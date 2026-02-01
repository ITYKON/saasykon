import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const cookieStore = cookies();
  const businessId = url.searchParams.get("business_id") || cookieStore.get("business_id")?.value || ctx.assignments[0]?.business_id;
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });
  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const scope = (url.searchParams.get("scope") || "").toLowerCase(); // "employee" or "institute"

  const IN_CODE_ROLES = [
    {
      code: "admin_institut",
      name: "Admin Institut",
      permissions: [
        { code: "pro_portal_access" },
        { code: "agenda_view" },
        { code: "reservations_manage" },
        { code: "clients_manage" },
        { code: "services_manage" },
        { code: "employees_manage" },
        { code: "billing_access" },
        { code: "reports_view" },
        { code: "settings_edit" },
      ],
    },
    {
      code: "receptionniste",
      name: "Réceptionniste",
      permissions: [
        { code: "pro_portal_access" },
        { code: "agenda_view" },
        { code: "reservations_manage" },
      ],
    },
    {
      code: "praticienne",
      name: "Praticienne",
      permissions: [
        { code: "pro_portal_access" },
        { code: "agenda_view" },
      ],
    },
  ];

  if (scope === "institute") {
    return NextResponse.json({ roles: IN_CODE_ROLES });
  }

  const EMPLOYEE_ROLE_CODES = [
    "PRO",
    "PROFESSIONNEL",
    "support",
    "gestion_clients",
  ];

  const where: any = scope === "employee"
    ? { code: { in: EMPLOYEE_ROLE_CODES } }
    : {};

  const roles = await prisma.roles.findMany({
    where,
    select: {
      id: true,
      code: true,
      name: true,
      role_permissions: { select: { permissions: { select: { code: true, description: true } } } },
    },
  });
  const mapped = roles.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    permissions: r.role_permissions.map((rp) => rp.permissions).filter(Boolean),
  }));
  return NextResponse.json({ roles: mapped });
}
