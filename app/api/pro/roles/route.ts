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

  const EMPLOYEE_ROLE_CODES = [
    // Institute-specific employee roles (business-scoped), independent from SaaS admin
    "admin_institut",
    "manager",
    "gestionnaire",
    "receptionniste",
    "praticien",
    "agent_commercial",
    // keep legacy/professional roles for backward compatibility if already used
    "PRO",
    "PROFESSIONNEL",
    "support",
    "gestion_clients",
  ];

  const INSTITUTE_ROLE_CODES = [
    "admin_institut",
    "manager",
    "gestionnaire",
    "receptionniste",
    "praticien",
    "agent_commercial",
  ];

  const where: any = scope === "employee"
    ? { code: { in: EMPLOYEE_ROLE_CODES } }
    : scope === "institute"
      ? { code: { in: INSTITUTE_ROLE_CODES } }
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
