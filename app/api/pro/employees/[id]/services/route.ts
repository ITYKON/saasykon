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
  const pairs = await prisma.employee_services.findMany({ where: { employee_id: params.id }, select: { services: { select: { id: true, name: true } } } });
  const services = pairs.map((p) => p.services);
  return NextResponse.json({ services });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireAccess(params.id);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.service_ids)) return NextResponse.json({ error: "service_ids array required" }, { status: 400 });
  const serviceIds: string[] = body.service_ids;

  // Validate services belong to same business
  const validServices = await prisma.services.findMany({ where: { id: { in: serviceIds }, business_id: access.emp!.business_id }, select: { id: true } });
  const validIds = new Set(validServices.map((s) => s.id));

  await prisma.$transaction([
    prisma.employee_services.deleteMany({ where: { employee_id: params.id } }),
    prisma.employee_services.createMany({ data: Array.from(validIds).map((sid) => ({ employee_id: params.id, service_id: sid })) }),
  ]);

  return NextResponse.json({ ok: true });
}
