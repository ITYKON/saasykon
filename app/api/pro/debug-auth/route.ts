import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const cookieStore = cookies();
  const businessId = url.searchParams.get("business_id") || cookieStore.get("business_id")?.value || ctx.assignments[0]?.business_id || null;

  const allowed = businessId ? (
    ctx.roles.includes("ADMIN") ||
    ctx.permissions.includes("pro_portal_access") ||
    ctx.assignments.some((a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"))
  ) : false;

  return NextResponse.json({
    user_id: ctx.userId,
    roles: ctx.roles,
    permissions: ctx.permissions,
    assignments: ctx.assignments,
    business_id_checked: businessId,
    allowed_employee_accounts: allowed,
  });
}
