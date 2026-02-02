import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrPermission, getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cookieStore = cookies();
  const url = new URL(req.url);
  const businessId = url.searchParams.get("business_id") || cookieStore.get("business_id")?.value || ctx.assignments[0]?.business_id;
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });
  const allowed = ctx.roles.includes("ADMIN") || ctx.permissions.includes("pro_portal_access") || ctx.assignments.some((a: any) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const employeeId = params.id;
  const emp = await prisma.employees.findUnique({ where: { id: employeeId }, select: { id: true, business_id: true } });
  if (!emp || emp.business_id !== businessId) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { is_active, employee_role, user_email, permission_codes } = body || {};

  const account = await prisma.employee_accounts.findFirst({ where: { employee_id: employeeId } });
  const user = user_email ? await prisma.users.findUnique({ where: { email: user_email } }) : null;

  await prisma.$transaction(async (tx) => {
    // Update employee fields
    const data: any = {};
    if (typeof is_active === "boolean") data.is_active = is_active;
    if (Object.keys(data).length) {
      await tx.employees.update({ where: { id: employeeId }, data });
    }

    // Update role: store exact label in employee_roles (used as Access Level)
    if (typeof employee_role === "string") {
      const trimmed = employee_role.trim();
      const norm = trimmed.toLowerCase();
      const labelMap: Record<string, string> = {
        admin_institut: "Admin Institut",
        receptionniste: "Réceptionniste",
        praticienne: "Praticienne",
      };
      const exactRole = trimmed ? (labelMap[norm] || trimmed) : null;
      if (exactRole) {
        // Clear existing roles and set new one
        await tx.employee_roles.deleteMany({ where: { employee_id: employeeId } });
        await tx.employee_roles.create({ data: { employee_id: employeeId, role: exactRole } });
      }
    }

    // Link to user if provided (account linkage only)
    if (user_email) {
      let linkUser = user;
      if (!linkUser) {
        linkUser = await tx.users.findUnique({ where: { email: user_email } });
        if (!linkUser) {
          linkUser = await tx.users.create({ data: { email: user_email } });
        }
      }
      await tx.employee_accounts.upsert({
        where: { user_id: linkUser.id },
        update: { employee_id: employeeId },
        create: { user_id: linkUser.id, employee_id: employeeId },
      } as any);
    }

    // Replace direct pro permissions for this employee and business
    if (Array.isArray(permission_codes)) {
      await tx.employee_permissions.deleteMany({ where: { employee_id: employeeId, business_id: businessId } });
      const perms = await tx.pro_permissions.findMany({ where: { code: { in: permission_codes } }, select: { id: true } });
      if (perms.length) {
        await tx.employee_permissions.createMany({ data: perms.map((p) => ({ employee_id: employeeId, permission_id: p.id, business_id: businessId })) });
      }
    }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cookieStore = cookies();
  const url = new URL(req.url);
  const businessId = url.searchParams.get("business_id") || cookieStore.get("business_id")?.value || ctx.assignments[0]?.business_id;
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });
  const allowed = ctx.roles.includes("ADMIN") || ctx.permissions.includes("pro_portal_access") || ctx.assignments.some((a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const employeeId = params.id;
  const emp = await prisma.employees.findUnique({ where: { id: employeeId }, select: { id: true, business_id: true } });
  if (!emp || emp.business_id !== businessId) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const hard = (url.searchParams.get("hard") || "").toLowerCase() === "true";
  if (!hard) {
    await prisma.employee_accounts.deleteMany({ where: { employee_id: employeeId } });
    return NextResponse.json({ ok: true });
  }

  await prisma.$transaction(async (tx) => {
    await tx.employee_accounts.deleteMany({ where: { employee_id: employeeId } });
    await tx.employee_permissions.deleteMany({ where: { employee_id: employeeId, business_id: businessId } });
    await tx.employee_roles.deleteMany({ where: { employee_id: employeeId } });
    await tx.employees.delete({ where: { id: employeeId } });
  });
  return NextResponse.json({ ok: true, deleted: "employee" });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cookieStore = cookies();
  const url = new URL(req.url);
  const businessId = url.searchParams.get("business_id") || cookieStore.get("business_id")?.value || ctx.assignments[0]?.business_id;
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });
  const allowed = ctx.roles.includes("ADMIN") || ctx.permissions.includes("pro_portal_access") || ctx.assignments.some((a: any) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const employeeId = params.id;
  const emp = await prisma.employees.findFirst({
    where: { id: employeeId, business_id: businessId },
    select: {
      id: true,
      full_name: true,
      email: true,
      phone: true,
      is_active: true,
      profession_label: true,
      employee_roles: { select: { role: true } },
      employee_accounts: { select: { user_id: true } },
    },
  });
  if (!emp) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const perms = await prisma.employee_permissions.findMany({
    where: { employee_id: employeeId, business_id: businessId },
    select: { pro_permissions: { select: { code: true, description: true } } },
  } as any);
  return NextResponse.json({
    id: emp.id,
    name: emp.full_name,
    email: emp.email,
    phone: emp.phone,
    is_active: emp.is_active,
    role: emp.employee_roles[0]?.role || null,
    permission_codes: perms.map((p: any) => p.pro_permissions?.code).filter(Boolean),
  });
}
