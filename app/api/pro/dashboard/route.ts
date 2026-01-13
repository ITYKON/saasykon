import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

function zonedDate(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});
  const y = Number(parts.year),
    m = Number(parts.month),
    d = Number(parts.day),
    h = Number(parts.hour || "0"),
    mi = Number(parts.minute || "0"),
    s = Number(parts.second || "0");
  return new Date(Date.UTC(y, m - 1, d, h, mi, s));
}
function startOfDayTZ(date: Date, timeZone: string) {
  const z = zonedDate(date, timeZone);
  return new Date(
    Date.UTC(z.getUTCFullYear(), z.getUTCMonth(), z.getUTCDate(), 0, 0, 0)
  );
}
function endOfDayTZ(date: Date, timeZone: string) {
  const s = startOfDayTZ(date, timeZone);
  const x = new Date(s);
  x.setUTCDate(x.getUTCDate() + 1);
  return x;
}
function startOfWeekTZ(date: Date, timeZone: string) {
  const z = zonedDate(date, timeZone);
  const day = z.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday first
  const ws = new Date(z);
  ws.setUTCDate(ws.getUTCDate() + diff);
  return new Date(
    Date.UTC(ws.getUTCFullYear(), ws.getUTCMonth(), ws.getUTCDate(), 0, 0, 0)
  );
}

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cookieStore = cookies();
  const url = new URL(req.url);
  const businessId =
    url.searchParams.get("business_id") ||
    cookieStore.get("business_id")?.value ||
    ctx.assignments[0]?.business_id;
  if (!businessId)
    return NextResponse.json(
      { error: "business_id required" },
      { status: 400 }
    );
  // Vérifier si l'utilisateur est ADMIN, PRO ou EMPLOYEE
  const allowed =
    ctx.roles.includes("ADMIN") ||
    ctx.roles.includes("EMPLOYEE") ||
    ctx.assignments.some(
      (a) =>
        a.business_id === businessId &&
        (a.role === "PRO" || a.role === "PROFESSIONNEL")
    );

  if (!allowed) {
    return NextResponse.json(
      {
        error: "Forbidden",
        details:
          "Vous n'avez pas les permissions nécessaires pour accéder à cette ressource.",
      },
      { status: 403 }
    );
  }

  const now = new Date();
  const primaryLoc = await prisma.business_locations.findFirst({
    where: { business_id: businessId, is_primary: true },
    select: { timezone: true },
  });
  const tz = primaryLoc?.timezone || "Europe/Paris";
  const weekStart = startOfWeekTZ(now, tz);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  const dayStart = startOfDayTZ(now, tz);
  const dayEnd = endOfDayTZ(now, tz);

  const [
    paymentsAgg,
    bookingsCount,
    firsts,
    ratingAgg,
    todayReservations,
    notifications,
    unreadCount,
    latestPayment,
    businessInfo,
    primaryAddress,
  ] = await Promise.all([
    prisma.payments.aggregate({
      _sum: { amount_cents: true },
      where: {
        business_id: businessId,
        status: { in: ["CAPTURED"] as any },
        created_at: { gte: weekStart, lt: weekEnd },
      },
    }),
    prisma.reservations.count({
      where: {
        business_id: businessId,
        starts_at: { gte: weekStart, lt: weekEnd },
        status: { in: ["CONFIRMED", "COMPLETED"] as any },
      },
    }),
    prisma.reservations.groupBy({
      by: ["client_id"],
      where: { business_id: businessId, client_id: { not: null } },
      _min: { starts_at: true },
    }),
    prisma.ratings_aggregates
      .findUnique({ where: { business_id: businessId } })
      .catch(() => null as any),
    prisma.reservations.findMany({
      where: {
        business_id: businessId,
        starts_at: { gte: dayStart, lt: dayEnd },
      },
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
            service_variants: {
              select: { name: true, price_cents: true, duration_minutes: true },
            },
          },
        },
      },
    }),
    prisma.notifications
      .findMany({
        where: { business_id: businessId },
        orderBy: { created_at: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          payload: true,
          is_read: true,
          created_at: true,
        },
      })
      .catch(() => []),
    prisma.notifications
      .count({ where: { business_id: businessId, is_read: false } })
      .catch(() => 0),
    prisma.payments
      .findFirst({
        where: { business_id: businessId },
        orderBy: { created_at: "desc" },
        select: { currency: true },
      })
      .catch(() => null as any),
    prisma.businesses.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        public_name: true,
        legal_name: true,
        converted_from_lead: true,
        slug: true,
      },
    }),
    prisma.business_locations.findFirst({
      where: { business_id: businessId, is_primary: true },
      select: { address_line1: true, cities: { select: { name: true } } },
    }),
  ]);

  const newClients = firsts.filter(
    (g) =>
      g._min.starts_at &&
      g._min.starts_at >= weekStart &&
      g._min.starts_at < weekEnd
  ).length;
  const rating = (ratingAgg as any)?.rating_avg
    ? Number((ratingAgg as any).rating_avg)
    : 0;
  const kpis = {
    revenueCents: paymentsAgg._sum.amount_cents || 0,
    bookings: bookingsCount,
    newClients,
    rating,
    currency: (latestPayment as any)?.currency || "DZD",
    unreadNotifications: unreadCount || 0,
  };

  const todayAgenda = todayReservations.map((r) => {
    const priceCents = r.reservation_items.reduce(
      (s, it) => s + (it.price_cents ?? it.service_variants?.price_cents ?? 0),
      0
    );
    const duration = r.reservation_items.reduce(
      (s, it) =>
        s + (it.duration_minutes ?? it.service_variants?.duration_minutes ?? 0),
      0
    );
    const serviceNames = r.reservation_items
      .map(
        (it) => it.services?.name || (it.service_variants?.name ?? "Service")
      )
      .filter(Boolean)
      .join(" + ");
    const client =
      [r.clients?.first_name || "", r.clients?.last_name || ""]
        .join(" ")
        .trim() || "Client";
    return {
      id: r.id,
      starts_at: r.starts_at,
      status: r.status as any,
      client,
      service: serviceNames,
      duration_minutes: duration,
      price_cents: priceCents,
    };
  });

  return NextResponse.json(
    {
      kpis,
      todayAgenda,
      notifications,
      business: businessInfo,
      address: primaryAddress,
    },
    { headers: { "Cache-Control": "private, max-age=30" } }
  );
}
