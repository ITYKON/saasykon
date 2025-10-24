import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cookieStore = cookies();
  const businessId = cookieStore.get("business_id")?.value || "";
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });

  // Find employee account for this user in current business
  const acc = await prisma.employee_accounts.findUnique({ where: { user_id: ctx.userId } }).catch(() => null);
  let name: string | null = null;
  let roleLabel: string | null = null;
  let permissionCodes: string[] = [];

  if (acc) {
    const emp = await prisma.employees.findUnique({ where: { id: acc.employee_id }, select: { id: true, business_id: true, full_name: true } });
    if (emp && emp.business_id === businessId) {
      name = emp.full_name;
      const role = await prisma.employee_roles.findFirst({ where: { employee_id: emp.id }, select: { role: true } });
      roleLabel = role?.role || null;
      const perms = await prisma.employee_permissions.findMany({ where: { employee_id: emp.id, business_id: businessId }, include: { pro_permissions: { select: { code: true } } } } as any);
      permissionCodes = Array.from(new Set(perms.map((p: any) => p.pro_permissions?.code).filter(Boolean)));
    }
  }

  return NextResponse.json({ employee: { name, role: roleLabel }, permissions: permissionCodes });
}
