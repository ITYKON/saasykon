import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";

function isUuid(id: string) {
  return /^[0-9a-fA-F-]{36}$/.test(id);
}

async function requireEmployeeAccess(req: NextRequest, employeeId: string) {
  const ctx = await getAuthContext();
  if (!ctx) return { status: 401 as const, error: "Unauthorized" };
  if (!isUuid(employeeId)) return { status: 400 as const, error: "Invalid employee id" };

  const employee = await prisma.employees.findUnique({ where: { id: employeeId }, select: { id: true, business_id: true } });
  if (!employee) return { status: 404 as const, error: "Not found" };

  const businessId = employee.business_id;
  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return { status: 403 as const, error: "Forbidden" };

  return { status: 200 as const, employee, ctx };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireEmployeeAccess(_req, params.id);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });

  const employee = await prisma.employees.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      business_id: true,
      full_name: true,
      email: true,
      phone: true,
      color: true,
      is_active: true,
      created_at: true,
      updated_at: true,
      employee_roles: { select: { role: true } },
      employee_services: { select: { services: { select: { id: true, name: true } } } },
      working_hours: { select: { id: true, weekday: true, start_time: true, end_time: true, breaks: true }, orderBy: { weekday: "asc" } },
    },
  } as any);

  return NextResponse.json({ employee });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireEmployeeAccess(req, params.id);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { full_name, email, phone, color, is_active } = body;

  const updated = await prisma.employees.update({
    where: { id: params.id },
    data: ({ full_name, email, phone, color, ...(typeof is_active === "boolean" ? { is_active } : {}) } as any),
    select: { id: true },
  });

  return NextResponse.json({ id: updated.id });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireEmployeeAccess(_req, params.id);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });
  // Soft-delete: mark inactive
  await prisma.employees.update({ where: { id: params.id }, data: { is_active: false } });
  return NextResponse.json({ ok: true });
}
