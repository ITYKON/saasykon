export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrPermission } from "@/lib/authorization";

// Helpers
function startOfDayUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}
function addDaysUTC(d: Date, days: number) {
  const nd = new Date(d);
  nd.setUTCDate(nd.getUTCDate() + days);
  return nd;
}
function startOfMonthUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0));
}
function addMonthsUTC(d: Date, months: number) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()));
}

function parseRange(searchParams: URLSearchParams) {
  const now = new Date();
  const toParam = searchParams.get("to");
  const fromParam = searchParams.get("from");
  const rangeParam = searchParams.get("range"); // e.g. 7d, 30d, 3m

  let to = toParam ? new Date(toParam) : now;
  let from: Date;

  if (fromParam) {
    from = new Date(fromParam);
  } else if (rangeParam) {
    const m = rangeParam.match(/^(\d+)([dm])$/i);
    if (m) {
      const n = parseInt(m[1], 10);
      const unit = m[2].toLowerCase();
      if (unit === "d") from = addDaysUTC(to, -n);
      else from = addMonthsUTC(to, -n);
    } else {
      from = addDaysUTC(to, -30);
    }
  } else {
    from = addDaysUTC(to, -30);
  }

  // Normalize to inclusive [from, to) bounds
  const start = startOfDayUTC(from);
  const end = startOfDayUTC(addDaysUTC(to, 1));
  return { start, end };
}

function getGranularity(searchParams: URLSearchParams): "day" | "month" {
  const g = (searchParams.get("granularity") || "day").toLowerCase();
  return g === "month" ? "month" : "day";
}

function formatKey(d: Date, granularity: "day" | "month") {
  if (granularity === "month") {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminOrPermission("statistics");
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const { start, end } = parseRange(searchParams);
    const rangeMs = end.getTime() - start.getTime();
    const previousEnd = new Date(start);
    const previousStart = new Date(previousEnd.getTime() - rangeMs);
    const granularity = getGranularity(searchParams);

    // Fetch raw data in parallel
    const [
      payments, // captured payments in range
      reservations, // reservations in range
      confirmedReservations, // confirmed/completed
      usersCount, // total users (not deleted)
      activeLogins, // successful logins for active users metric
      sessionsInRange, // sessions created in range
      reservationsWithUsers, // reservations having booker_user_id
      businessesCount, // partners
      reviewsAgg, // average rating
      topPaymentsBySalon, // for top salons
      reservationsBySalon, // for top salons
      eventsRecent, // activity feed
      primaryLocations, // business -> city mapping
      // previous period
      paymentsPrev,
      activeLoginsPrev,
      sessionsPrev,
      reservationsWithUsersPrev,
      confirmedReservationsPrev,
      reservationsPrev,
      businessesPrevCount,
    ] = await Promise.all([
      prisma.payments.findMany({
        where: { status: "CAPTURED", created_at: { gte: start, lt: end } },
        select: { amount_cents: true, created_at: true, business_id: true },
      }),
      prisma.reservations.findMany({
        where: { starts_at: { gte: start, lt: end } },
        select: { id: true, status: true, business_id: true, starts_at: true },
      }),
      prisma.reservations.count({
        where: { starts_at: { gte: start, lt: end }, status: { in: ["CONFIRMED", "COMPLETED"] } },
      }),
      prisma.users.count({ where: { deleted_at: null } }),
      prisma.login_attempts.findMany({
        where: { attempted_at: { gte: start, lt: end }, success: true },
        select: { user_id: true, attempted_at: true },
      }),
      prisma.sessions.findMany({
        where: { created_at: { gte: start, lt: end } },
        select: { user_id: true, created_at: true },
      }),
      prisma.reservations.findMany({
        where: { starts_at: { gte: start, lt: end }, booker_user_id: { not: null } },
        select: { booker_user_id: true, starts_at: true },
      }),
      prisma.businesses.count(),
      prisma.reviews.aggregate({ _avg: { rating: true } }),
      prisma.payments.groupBy({
        by: ["business_id"],
        where: { status: "CAPTURED", created_at: { gte: start, lt: end } },
        _sum: { amount_cents: true },
        _count: { _all: true },
      }),
      prisma.reservations.groupBy({
        by: ["business_id"],
        where: { starts_at: { gte: start, lt: end } },
        _count: { _all: true },
      }),
      prisma.event_logs.findMany({
        where: { occurred_at: { gte: addDaysUTC(end, -7), lt: end } },
        orderBy: { occurred_at: "desc" },
        take: 50,
        select: { id: true, occurred_at: true, user_id: true, business_id: true, event_name: true, payload: true },
      }),
      prisma.business_locations.findMany({
        where: { is_primary: true },
        include: { cities: { select: { name: true } } },
      }),
      // previous period data
      prisma.payments.findMany({
        where: { status: "CAPTURED", created_at: { gte: previousStart, lt: previousEnd } },
        select: { amount_cents: true, created_at: true, business_id: true },
      }),
      prisma.login_attempts.findMany({
        where: { attempted_at: { gte: previousStart, lt: previousEnd }, success: true },
        select: { user_id: true, attempted_at: true },
      }),
      prisma.sessions.findMany({
        where: { created_at: { gte: previousStart, lt: previousEnd } },
        select: { user_id: true, created_at: true },
      }),
      prisma.reservations.findMany({
        where: { starts_at: { gte: previousStart, lt: previousEnd }, booker_user_id: { not: null } },
        select: { booker_user_id: true, starts_at: true },
      }),
      prisma.reservations.count({
        where: { starts_at: { gte: previousStart, lt: previousEnd }, status: { in: ["CONFIRMED", "COMPLETED"] } },
      }),
      prisma.reservations.findMany({
        where: { starts_at: { gte: previousStart, lt: previousEnd } },
        select: { id: true },
      }),
      prisma.businesses.count({ where: { created_at: { lt: end } } }).catch(() => 0),
    ]);

    // Summary KPIs
    const totalRevenueCents = payments.reduce((s: number, p: { amount_cents: number | null }) => s + (p.amount_cents || 0), 0);

    // Active users: distinct user having (login success OR session created OR booked a reservation) in range
    const activeUserIds = new Set<string>();
    activeLogins.forEach((l: { user_id: string | null }) => { if (l.user_id) activeUserIds.add(l.user_id); });
    sessionsInRange.forEach((s: { user_id: string }) => { if (s.user_id) activeUserIds.add(s.user_id); });
    reservationsWithUsers.forEach((r: { booker_user_id: string | null }) => { if (r.booker_user_id) activeUserIds.add(r.booker_user_id); });
    const activeUsers = activeUserIds.size;

    const partnerSalons = businessesCount; // total businesses
    const totalReservations = reservations.length;

    // Conversion: confirmed reservations / successful logins
    const conversionRate = activeLogins.length > 0 ? confirmedReservations / activeLogins.length : 0;

    const averageRating = reviewsAgg._avg.rating ?? 0;

    // Session duration not tracked in schema -> return null placeholder
    const avgSessionSeconds = null as number | null;

    // Time series baselines
    const series: Record<string, { revenueCents: number; activeUsers: number; reservations: number }> = {};

    if (granularity === "month") {
      let cursor = startOfMonthUTC(start);
      while (cursor < end) {
        series[formatKey(cursor, "month")] = { revenueCents: 0, activeUsers: 0, reservations: 0 };
        cursor = addMonthsUTC(cursor, 1);
      }
    } else {
      let cursor = startOfDayUTC(start);
      while (cursor < end) {
        series[formatKey(cursor, "day")] = { revenueCents: 0, activeUsers: 0, reservations: 0 };
        cursor = addDaysUTC(cursor, 1);
      }
    }

    // Fill revenue series
    payments.forEach((p: { created_at: Date; amount_cents: number; business_id: string }) => {
      const key = formatKey(granularity === "month" ? startOfMonthUTC(p.created_at) : startOfDayUTC(p.created_at), granularity);
      if (!series[key]) series[key] = { revenueCents: 0, activeUsers: 0, reservations: 0 };
      series[key].revenueCents += p.amount_cents || 0;
    });

    // Fill reservations series
    reservations.forEach((r: { starts_at: Date; business_id: string }) => {
      const key = formatKey(granularity === "month" ? startOfMonthUTC(r.starts_at) : startOfDayUTC(r.starts_at), granularity);
      if (!series[key]) series[key] = { revenueCents: 0, activeUsers: 0, reservations: 0 };
      series[key].reservations += 1;
    });

    // Fill active users series (distinct per bucket)
    const bucketUsers: Record<string, Set<string>> = {};
    activeLogins.forEach((l: { attempted_at: Date; user_id: string | null }) => {
      const key = formatKey(granularity === "month" ? startOfMonthUTC(l.attempted_at) : startOfDayUTC(l.attempted_at), granularity);
      if (!bucketUsers[key]) bucketUsers[key] = new Set();
      if (l.user_id) bucketUsers[key].add(l.user_id);
    });
    Object.keys(bucketUsers).forEach((k) => {
      if (!series[k]) series[k] = { revenueCents: 0, activeUsers: 0, reservations: 0 };
      series[k].activeUsers = bucketUsers[k].size;
    });

    const timeseries = Object.keys(series)
      .sort()
      .map((k) => ({ key: k, revenueCents: series[k].revenueCents, activeUsers: series[k].activeUsers, reservations: series[k].reservations }));

    // Regions breakdown: sum revenue by primary city
    const businessCity: Record<string, string> = {};
    primaryLocations.forEach((bl: { business_id: string; cities?: { name?: string | null } | null }) => {
      businessCity[bl.business_id] = bl.cities?.name || "-";
    });
    const regions: Record<string, { revenueCents: number; reservations: number }> = {};
    payments.forEach((p: { business_id: string; amount_cents: number }) => {
      const city = businessCity[p.business_id] || "-";
      if (!regions[city]) regions[city] = { revenueCents: 0, reservations: 0 };
      regions[city].revenueCents += p.amount_cents || 0;
    });
    reservations.forEach((r: { business_id: string }) => {
      const city = businessCity[r.business_id] || "-";
      if (!regions[city]) regions[city] = { revenueCents: 0, reservations: 0 };
      regions[city].reservations += 1;
    });
    const regionsArray = Object.entries(regions)
      .map(([name, v]) => ({ name, revenueCents: v.revenueCents, reservations: v.reservations }))
      .sort((a, b) => b.revenueCents - a.revenueCents)
      .slice(0, 20);

    // Top salons
    const topSalonsRaw = topPaymentsBySalon
      .map((row: any) => ({
        business_id: row.business_id as string,
        revenueCents: row._sum.amount_cents || 0,
        paymentsCount: row._count._all || 0,
        reservations: (reservationsBySalon.find((r: any) => r.business_id === row.business_id)?._count._all) || 0,
      }))
      .sort((a: any, b: any) => b.revenueCents - a.revenueCents)
      .slice(0, 10);

    const businessIds = topSalonsRaw.map((t) => t.business_id);
    const businessNames = businessIds.length
      ? await prisma.businesses.findMany({
          where: { id: { in: businessIds } },
          select: { id: true, public_name: true, legal_name: true },
        })
      : [];
    const nameMap = Object.fromEntries(
      businessNames.map((b) => [b.id, (b.public_name || b.legal_name || b.id)])
    );
    const topSalons = topSalonsRaw.map((t: any) => ({ ...t, name: nameMap[t.business_id] || t.business_id }));

    // Activity feed
    const activity = eventsRecent.map((e: any) => ({
      id: e.id.toString(),
      time: e.occurred_at.toISOString(),
      event: e.event_name,
      user_id: e.user_id || null,
      business_id: e.business_id || null,
      payload: e.payload || null,
    }));

    // Previous summary and deltas
    const prevRevenueCents = paymentsPrev.reduce((s: number, p: { amount_cents: number | null }) => s + (p.amount_cents || 0), 0);
    const prevActiveSet = new Set<string>();
    activeLoginsPrev.forEach((l: { user_id: string | null }) => { if (l.user_id) prevActiveSet.add(l.user_id); });
    sessionsPrev.forEach((s: { user_id: string }) => { if (s.user_id) prevActiveSet.add(s.user_id); });
    reservationsWithUsersPrev.forEach((r: { booker_user_id: string | null }) => { if (r.booker_user_id) prevActiveSet.add(r.booker_user_id); });
    const prevActiveUsers = prevActiveSet.size;
    const prevReservations = reservationsPrev.length;
    const prevConversion = activeLoginsPrev.length > 0 ? confirmedReservationsPrev / activeLoginsPrev.length : 0;

    const previousSummary = {
      totalRevenueCents: prevRevenueCents,
      activeUsers: prevActiveUsers,
      partnerSalons: businessesPrevCount,
      reservations: prevReservations,
      conversionRate: prevConversion,
      averageRating, // keep same period-agnostic rating for now
      avgSessionSeconds: null as number | null,
    };

    const delta = (curr: number, prev: number) => (prev === 0 ? (curr > 0 ? 1 : 0) : (curr - prev) / prev);

    const deltas = {
      totalRevenue: delta(totalRevenueCents, prevRevenueCents),
      activeUsers: delta(activeUsers, prevActiveUsers),
      partnerSalons: delta(partnerSalons, businessesPrevCount),
      reservations: delta(totalReservations, prevReservations),
      conversionRate: delta(conversionRate, prevConversion),
    };

    return NextResponse.json({
      params: { start: start.toISOString(), end: end.toISOString(), granularity },
      summary: {
        totalRevenueCents,
        activeUsers,
        partnerSalons,
        reservations: totalReservations,
        conversionRate, // 0..1
        averageRating,
        avgSessionSeconds, // null (not tracked)
      },
      previousSummary,
      deltas,
      timeseries,
      regions: regionsArray,
      topSalons,
      activity,
    });
  } catch (e) {
    console.error("[GET /api/admin/statistics] Error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
