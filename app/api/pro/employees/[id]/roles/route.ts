import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";

function isUuid(id: string) {
  return /^[0-9a-fA-F-]{36}$/.test(id);
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
  const rows = await prisma.employee_roles.findMany({ where: { employee_id: params.id }, select: { role: true } });
  return NextResponse.json({ roles: rows.map((r) => r.role) });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireAccess(params.id);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.roles)) return NextResponse.json({ error: "roles array required" }, { status: 400 });
  const roles: string[] = body.roles.filter((r: any) => typeof r === "string");
  await prisma.$transaction([
    prisma.employee_roles.deleteMany({ where: { employee_id: params.id } }),
    ...(roles.length ? [prisma.employee_roles.createMany({ data: roles.map((role) => ({ employee_id: params.id, role })) })] : []),
  ]);
  return NextResponse.json({ ok: true });
}
