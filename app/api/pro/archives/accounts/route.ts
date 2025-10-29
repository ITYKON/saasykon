import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

function getBusinessId(ctx: any, req: NextRequest) {
  const cookieStore = cookies();
  const url = new URL(req.url);
  return url.searchParams.get("business_id") || cookieStore.get("business_id")?.value || ctx.assignments[0]?.business_id || null;
}

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = getBusinessId(ctx, req);
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });

  let allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a: any) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const items = await prisma.employees.findMany({
    where: { business_id: businessId, is_active: false, employee_accounts: { some: {} } },
    orderBy: { updated_at: "desc" },
    select: {
      id: true,
      full_name: true,
      email: true,
      profession_label: true,
      employee_roles: { select: { role: true } },
      employee_accounts: { select: { user_id: true, users: { select: { email: true } } } },
    },
  } as any);

  const out = items.map((e: any) => ({
    id: e.id,
    name: e.full_name,
    email: e.email || e.employee_accounts?.[0]?.users?.email || null,
    role: e.profession_label || e.employee_roles?.[0]?.role || null,
  }));

  return NextResponse.json({ items: out });
}

// Restore account: reactivate the employee
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = getBusinessId(ctx, req);
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const employee = await prisma.employees.findUnique({ where: { id }, select: { id: true, business_id: true } });
  if (!employee || employee.business_id !== businessId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a: any) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.employees.update({ where: { id }, data: { is_active: true } });
  return NextResponse.json({ ok: true });
}

// Permanently delete account link (unlink user) without deleting employee
export async function DELETE(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = getBusinessId(ctx, req);
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id"); // employee id
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const employee = await prisma.employees.findUnique({ where: { id }, select: { id: true, business_id: true } });
  if (!employee || employee.business_id !== businessId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a: any) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.employee_accounts.deleteMany({ where: { employee_id: id } });
  return NextResponse.json({ ok: true });
}
