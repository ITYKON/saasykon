import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";

function isUuid(id: string) { return /^[0-9a-fA-F-]{36}$/.test(id); }

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
  const link = await prisma.employee_accounts.findFirst({ where: { employee_id: params.id }, select: { user_id: true, users: { select: { email: true, first_name: true, last_name: true } } } });
  return NextResponse.json({ account: link ? { user_id: link.user_id, user: link.users } : null });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireAccess(params.id);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });
  const body = await req.json().catch(() => null);
  if (!body || !body.user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });
  const user = await prisma.users.findUnique({ where: { id: body.user_id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  await prisma.employee_accounts.upsert({ where: { user_id: body.user_id }, update: { employee_id: params.id }, create: { user_id: body.user_id, employee_id: params.id } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireAccess(params.id);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });
  await prisma.employee_accounts.deleteMany({ where: { employee_id: params.id } });
  return NextResponse.json({ ok: true });
}
