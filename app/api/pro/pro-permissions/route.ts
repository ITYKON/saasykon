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
  const allowed = ctx.roles.includes("ADMIN") || ctx.permissions.includes("pro_portal_access") || ctx.assignments.some((a) => a.business_id === businessId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const permissions = await prisma.pro_permissions.findMany({ select: { id: true, code: true, description: true } });
  return NextResponse.json({ permissions });
}
