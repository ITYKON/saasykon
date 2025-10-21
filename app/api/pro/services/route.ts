import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cookieStore = cookies();
  const url = new URL(req.url);
  const businessId = url.searchParams.get("business_id") || cookieStore.get("business_id")?.value || ctx.assignments[0]?.business_id;
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });
  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const services = await prisma.services.findMany({
    where: { business_id: businessId, is_active: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      service_variants: { where: { is_active: true }, orderBy: { duration_minutes: "asc" }, select: { id: true, name: true, duration_minutes: true, price_cents: true } },
    },
  });
  return NextResponse.json({ services });
}
