import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cookieStore = cookies();
  const url = new URL(req.url);
  const businessId =
    url.searchParams.get("business_id") ||
    cookieStore.get("business_id")?.value ||
    ctx.assignments[0]?.business_id;
  if (!businessId)
    return NextResponse.json({ error: "business_id required" }, { status: 400 });
  const allowed =
    ctx.roles.includes("ADMIN") ||
    ctx.assignments.some(
      (a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL")
    );
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Fetch distinct service names from services and service_variants
  const baseServices = await prisma.services.findMany({
    where: { business_id: businessId },
    select: { name: true },
    orderBy: { name: "asc" },
  } as any);

  const variantServices = await prisma.service_variants.findMany({
    where: { services: { business_id: businessId } },
    select: { name: true },
    orderBy: { name: "asc" },
  } as any);

  const names = Array.from(
    new Set<string>([
      ...baseServices.map((s: any) => s?.name).filter(Boolean),
      ...variantServices.map((s: any) => s?.name).filter(Boolean),
    ])
  ).sort((a, b) => a.localeCompare(b));

  return NextResponse.json({ services: names });
}
