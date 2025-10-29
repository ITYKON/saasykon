import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

function getBusinessId(ctx: any, req: NextRequest) {
  const cookieStore = cookies();
  const url = new URL(req.url);
  return url.searchParams.get("business_id") || cookieStore.get("business_id")?.value || ctx.assignments[0]?.business_id || null;
}

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = getBusinessId(ctx, req);
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });

  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a: any) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "100", 10) || 100, 1), 200);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);

  const where: any = {
    business_id: businessId,
    OR: [
      { status: "CANCELLED" as any },
      { NOT: { cancelled_at: null } },
    ],
  };
  if (q) {
    where.AND = [
      {
        OR: [
          { clients: { is: { first_name: { contains: q, mode: "insensitive" } } } },
          { clients: { is: { last_name: { contains: q, mode: "insensitive" } } } },
          { employees: { is: { full_name: { contains: q, mode: "insensitive" } } } },
        ],
      },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.reservations.findMany({
      where,
      orderBy: { cancelled_at: "desc" },
      skip: offset,
      take: limit,
      include: {
        clients: { select: { id: true, first_name: true, last_name: true, phone: true, users: { select: { email: true } } } },
        employees: { select: { id: true, full_name: true } },
        reservation_items: { select: { id: true, services: { select: { id: true, name: true } }, service_variants: { select: { id: true, name: true } }, price_cents: true, duration_minutes: true } },
      },
    } as any),
    prisma.reservations.count({ where }),
  ]);

  return NextResponse.json({ items, total });
}

// Restore a cancelled reservation: set cancelled_at null and status to PENDING if currently CANCELLED
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = getBusinessId(ctx, req);
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await prisma.reservations.findUnique({ where: { id }, select: { id: true, business_id: true, status: true } });
  if (!existing || existing.business_id !== businessId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a: any) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.reservations.update({ where: { id }, data: { cancelled_at: null, status: existing.status === "CANCELLED" ? ("PENDING" as any) : undefined } });
  return NextResponse.json({ ok: true });
}
