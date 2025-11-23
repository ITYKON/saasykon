import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

function toUTCDate(date: Date): Date {
  return new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  ));
}

function zonedDate(date: Date, timeZone: string): Date {
  const str = date.toLocaleString('en-US', { timeZone });
  return new Date(str);
}

function startOfDayTZ(date: Date, timeZone: string): Date {
  const d = zonedDate(date, timeZone);
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  return start;
}

function endOfDayTZ(date: Date, timeZone: string): Date {
  const start = startOfDayTZ(date, timeZone);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return end;
}

function startOfWeekTZ(date: Date, timeZone: string): Date {
  const d = zonedDate(date, timeZone);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi comme premier jour de la semaine
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
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

  const now = new Date();
  const primaryLoc = await prisma.business_locations.findFirst({ where: { business_id: businessId, is_primary: true }, select: { timezone: true } });
  const tz = primaryLoc?.timezone || "Europe/Paris";
  
  // Calcul des dates avec le fuseau horaire du salon
  const weekStart = startOfWeekTZ(now, tz);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  
  const dayStart = startOfDayTZ(now, tz);
  const dayEnd = endOfDayTZ(now, tz);
  
  console.log('Current time:', now);
  console.log('Using timezone:', tz);
  console.log('Week start (local):', weekStart.toLocaleString('fr-FR', { timeZone: tz }));
  console.log('Week end (local):', weekEnd.toLocaleString('fr-FR', { timeZone: tz }));

  console.log('Week start:', weekStart, 'Week end:', weekEnd);
  
  const [paymentsAgg, bookingsCount, firsts, ratingAgg, todayReservations, notifications, unreadCount, latestPayment, businessInfo, primaryAddress] = await Promise.all([
    prisma.payments.aggregate({ 
      _sum: { amount_cents: true }, 
      where: { 
        business_id: businessId, 
        status: { in: ["CAPTURED"] as any },
        created_at: { gte: weekStart, lt: weekEnd }
      } 
    }),
    prisma.reservations.count({ 
      where: { 
        business_id: businessId, 
        status: { in: ["CONFIRMED", "COMPLETED"] as any },
        starts_at: { gte: weekStart, lt: weekEnd }
      } 
    }),
    prisma.reservations.groupBy({ by: ["client_id"], where: { business_id: businessId, client_id: { not: null } }, _min: { starts_at: true } }),
    prisma.ratings_aggregates.findUnique({ where: { business_id: businessId } }).catch(() => null as any),
    prisma.reservations.findMany({
      where: { business_id: businessId, starts_at: { gte: dayStart, lt: dayEnd } },
      orderBy: { starts_at: "asc" },
      select: {
        id: true, starts_at: true, ends_at: true, status: true,
        clients: { select: { first_name: true, last_name: true } },
        reservation_items: { select: { price_cents: true, duration_minutes: true, services: { select: { name: true } }, service_variants: { select: { name: true, price_cents: true, duration_minutes: true } } } },
      },
    }),
    prisma.notifications.findMany({
      where: { business_id: businessId },
      orderBy: { created_at: "desc" },
      take: 10,
      select: { id: true, type: true, payload: true, is_read: true, created_at: true },
    }).catch(() => []),
    prisma.notifications.count({ where: { business_id: businessId, is_read: false } }).catch(() => 0),
    prisma.payments.findFirst({ where: { business_id: businessId }, orderBy: { created_at: "desc" }, select: { currency: true } }).catch(() => null as any),
    prisma.businesses.findUnique({ where: { id: businessId }, select: { id: true, public_name: true, legal_name: true } }),
    prisma.business_locations.findFirst({
      where: { business_id: businessId, is_primary: true },
      select: { address_line1: true, cities: { select: { name: true } } }
    }),
  ]);

  const newClients = firsts.filter((g) => {
    const startDate = g._min.starts_at;
    return startDate && new Date(startDate) >= weekStart && new Date(startDate) < weekEnd;
  }).length;
  
  console.log('New clients calculation:', {
    firstsCount: firsts.length,
    newClients,
    weekStart,
    weekEnd,
    firsts: firsts.map(f => ({
      clientId: f.client_id,
      firstReservation: f._min.starts_at,
      isInRange: f._min.starts_at && new Date(f._min.starts_at) >= weekStart && new Date(f._min.starts_at) < weekEnd
    }))
  });
  const rating = (ratingAgg as any)?.rating_avg ? Number((ratingAgg as any).rating_avg) : 0;
  const kpis = {
    revenueCents: paymentsAgg._sum.amount_cents || 0,
    bookings: bookingsCount,
    newClients,
    rating,
    currency: (latestPayment as any)?.currency || "DZD",
    unreadNotifications: unreadCount || 0,
  };

  const todayAgenda = todayReservations.map((r) => {
    const priceCents = r.reservation_items.reduce((s, it) => s + (it.price_cents ?? it.service_variants?.price_cents ?? 0), 0);
    const duration = r.reservation_items.reduce((s, it) => s + (it.duration_minutes ?? it.service_variants?.duration_minutes ?? 0), 0);
    const serviceNames = r.reservation_items.map((it) => it.services?.name || (it.service_variants?.name ?? "Service")).filter(Boolean).join(" + ");
    const client = [r.clients?.first_name || "", r.clients?.last_name || ""].join(" ").trim() || "Client";
    return { id: r.id, starts_at: r.starts_at, status: r.status as any, client, service: serviceNames, duration_minutes: duration, price_cents: priceCents };
  });

  return NextResponse.json(
    { kpis, todayAgenda, notifications, business: businessInfo, address: primaryAddress },
    { headers: { "Cache-Control": "private, max-age=30" } }
  );
}
