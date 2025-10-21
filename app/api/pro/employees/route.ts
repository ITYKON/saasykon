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

  const employees = await prisma.employees.findMany({
    where: { business_id: businessId, is_active: true },
    orderBy: { full_name: "asc" },
    select: { id: true, full_name: true },
  });
  return NextResponse.json({ employees });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cookieStore = cookies();
  const url = new URL(req.url);
  const businessId = url.searchParams.get("business_id") || cookieStore.get("business_id")?.value || ctx.assignments[0]?.business_id;
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });
  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { full_name, email, phone, color, is_active } = body || {};
  if (!full_name || typeof full_name !== "string") {
    return NextResponse.json({ error: "full_name required" }, { status: 400 });
  }

  const created = await prisma.employees.create({
    data: {
      business_id: businessId,
      full_name,
      email: email || null,
      phone: phone || null,
      color: color || null,
      ...(typeof is_active === "boolean" ? { is_active } : {}),
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}

