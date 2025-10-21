import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";

function isUuid(id: string) { return /^[0-9a-fA-F-]{36}$/.test(id); }
function toTimeDate(value: string) {
  // Expect "HH:MM" or "HH:MM:SS"; store as 1970-01-01 UTC date
  const v = value.length === 5 ? `${value}:00` : value;
  return new Date(`1970-01-01T${v}Z`);
}

async function requireAccess(employeeId: string) {
  const ctx = await getAuthContext();
  if (!ctx) return { status: 401 as const, error: "Unauthorized" };
  if (!isUuid(employeeId)) return { status: 400 as const, error: "Invalid employee id" };
  const emp = await prisma.employees.findUnique({ where: { id: employeeId }, select: { id: true, business_id: true } });
  if (!emp) return { status: 404 as const, error: "Not found" };
  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === emp.business_id && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return { status: 403 as const, error: "Forbidden" };
  return { status: 200 as const, emp, ctx };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireAccess(params.id);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });
  const rows = await prisma.working_hours.findMany({ where: { employee_id: params.id }, orderBy: { weekday: "asc" }, select: { id: true, weekday: true, start_time: true, end_time: true, breaks: true } });
  return NextResponse.json({ hours: rows });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireAccess(params.id);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.hours)) return NextResponse.json({ error: "hours array required" }, { status: 400 });

  const items = body.hours as Array<{ weekday: number; start_time: string; end_time: string; breaks?: any }>;
  for (const it of items) {
    if (typeof it.weekday !== "number" || it.weekday < 0 || it.weekday > 6) return NextResponse.json({ error: "weekday 0-6" }, { status: 400 });
    if (typeof it.start_time !== "string" || typeof it.end_time !== "string") return NextResponse.json({ error: "start_time/end_time required" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.working_hours.deleteMany({ where: { employee_id: params.id } }),
    prisma.working_hours.createMany({
      data: items.map((it) => ({
        business_id: access.emp!.business_id,
        employee_id: params.id,
        weekday: it.weekday,
        start_time: toTimeDate(it.start_time) as any,
        end_time: toTimeDate(it.end_time) as any,
        breaks: it.breaks ?? []
      })),
    }),
  ]);

  return NextResponse.json({ ok: true });
}
