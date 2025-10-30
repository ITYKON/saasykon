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

  // Derive distinct category names from services only
  try {
    const svcs = await prisma.services.findMany({
      where: { business_id: businessId } as any,
      select: { category: true },
    } as any);
    const names = Array.from(new Set((svcs || []).map((s: any) => s?.category).filter(Boolean))).sort(
      (a: string, b: string) => a.localeCompare(b)
    );
    return NextResponse.json({ categories: names });
  } catch (e) {
    return NextResponse.json({ categories: [] });
  }
}
