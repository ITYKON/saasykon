import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

function dayRange(date = new Date()) {
  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cookieStore = cookies();
  const url = new URL(req.url);
  const businessId = url.searchParams.get("business_id") || cookieStore.get("business_id")?.value || ctx.assignments[0]?.business_id;
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });
  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { start, end } = dayRange(new Date());

  const reservations = await prisma.reservations.findMany({
    where: { business_id: businessId, starts_at: { gte: start, lt: end } },
    orderBy: { starts_at: "asc" },
    select: {
      id: true,
      starts_at: true,
      ends_at: true,
      status: true,
      clients: { select: { first_name: true, last_name: true } },
      reservation_items: {
        select: {
          price_cents: true,
          duration_minutes: true,
          services: { select: { name: true } },
        },
      },
    },
  });

  const items = reservations.map((r) => {
    const priceCents = r.reservation_items.reduce((s, it) => s + (it.price_cents || 0), 0);
    const duration = r.reservation_items.reduce((s, it) => s + (it.duration_minutes || 0), 0);
    const serviceNames = r.reservation_items.map((it) => it.services?.name).filter(Boolean).join(" + ");
    const client = [r.clients?.first_name || "", r.clients?.last_name || ""].join(" ").trim() || "Client";
    return {
      id: r.id,
      starts_at: r.starts_at,
      ends_at: r.ends_at,
      status: r.status,
      client,
      service: serviceNames,
      duration_minutes: duration,
      price_cents: priceCents,
    };
  });

  return NextResponse.json({ items });
}
