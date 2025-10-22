import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Global categories for now
  const cats = await prisma.service_categories.findMany({ orderBy: { name: "asc" }, select: { id: true, code: true, name: true } });
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
  const created = await prisma.service_categories.create({
    data: { name, code: code && typeof code === "string" ? code : name.toLowerCase().replace(/\s+/g, "-") },
    select: { id: true },
  });
  return NextResponse.json({ id: created.id }, { status: 201 });
}
