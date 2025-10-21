import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";

function isUuid(id: string) { return /^[0-9a-fA-F-]{36}$/.test(id); }
function toDateOnly(value: string) { return new Date(value); }
function toTime(value?: string | null) { return value ? new Date(`1970-01-01T${value.length === 5 ? value + ":00" : value}Z`) : null; }

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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireAccess(params.id);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const where: any = { employee_id: params.id };
  if (from) where.date = { gte: toDateOnly(from) as any };
  if (to) where.date = { ...(where.date || {}), lte: toDateOnly(to) as any };
  const rows = await prisma.employee_availability_overrides.findMany({ where, orderBy: { date: "asc" } });
  return NextResponse.json({ overrides: rows });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireAccess(params.id);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.overrides)) return NextResponse.json({ error: "overrides array required" }, { status: 400 });

  const rows = body.overrides as Array<{ date: string; is_available: boolean; start_time?: string | null; end_time?: string | null }>;

  await prisma.$transaction(async (tx) => {
    for (const r of rows) {
      if (!r.date || typeof r.is_available !== "boolean") throw new Error("date and is_available required");
      await tx.employee_availability_overrides.upsert({
        where: { employee_id_date: { employee_id: params.id, date: toDateOnly(r.date) as any } as any },
        create: { employee_id: params.id, date: toDateOnly(r.date) as any, is_available: r.is_available, start_time: toTime(r.start_time) as any, end_time: toTime(r.end_time) as any },
        update: { is_available: r.is_available, start_time: toTime(r.start_time) as any, end_time: toTime(r.end_time) as any },
      } as any);
    }
  });

  return NextResponse.json({ ok: true });
}
