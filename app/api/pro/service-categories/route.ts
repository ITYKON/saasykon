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
  const where: any = {};
  if (businessId) where.business_id = businessId;
  const cats = await prisma.service_categories.findMany({ where, orderBy: { name: "asc" }, select: { id: true, code: true, name: true } } as any);
  return NextResponse.json({ categories: cats });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(ctx.roles.includes("ADMIN") || ctx.roles.includes("PRO") || ctx.roles.includes("PROFESSIONNEL"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { code, name } = body || {};
  if (!name || typeof name !== "string") return NextResponse.json({ error: "name required" }, { status: 400 });
  const cookieStore = cookies();
  const url = new URL(req.url);
  const businessId = url.searchParams.get("business_id") || cookieStore.get("business_id")?.value || ctx.assignments[0]?.business_id;
  const slug = (s: string) => s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const baseCode = slug((code && typeof code === "string" ? code : name) || "cat");
  const dataBase: any = {};
  // Create with guaranteed-unique code by timestamp+random; retry a few times for safety
  for (let i = 0; i < 5; i++) {
    const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;
    const codeCandidate = `${baseCode}-${suffix}`;
    const nameCandidate = i === 0 ? name : `${name} (${i + 1})`;
    const data: any = { ...dataBase, name: nameCandidate, code: codeCandidate };
    if (businessId) data.business_id = businessId;
    try {
      const created = await prisma.service_categories.create({
        data,
        select: { id: true, code: true, name: true },
      } as any);
      return NextResponse.json({ id: created.id, code: created.code, name: created.name }, { status: 201 });
    } catch (e: any) {
      if (e?.code === "P2002") {
        // rare, try again
        continue;
      }
      return NextResponse.json({ error: "Creation failed", code: e?.code || "UNKNOWN" }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "Creation failed after retries", code: "P2002" }, { status: 500 });
}
