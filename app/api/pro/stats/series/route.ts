import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

function zonedDate(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const parts = fmt.formatToParts(date).reduce<Record<string, string>>((acc, p) => { if (p.type !== "literal") acc[p.type] = p.value; return acc; }, {});
  const y = Number(parts.year), m = Number(parts.month), d = Number(parts.day), h = Number(parts.hour||"0"), mi = Number(parts.minute||"0"), s = Number(parts.second||"0");
  return new Date(Date.UTC(y, m - 1, d, h, mi, s));
}
function startOfDayTZ(date: Date, timeZone: string) { const z = zonedDate(date, timeZone); return new Date(Date.UTC(z.getUTCFullYear(), z.getUTCMonth(), z.getUTCDate(), 0, 0, 0)); }
function addDaysUTC(d: Date, days: number) { const x = new Date(d); x.setUTCDate(x.getUTCDate()+days); return x; }
function startOfWeekTZ(date: Date, timeZone: string) { const z = zonedDate(date, timeZone); const day = z.getUTCDay(); const diff = (day === 0 ? -6 : 1) - day; const ws = new Date(z); ws.setUTCDate(ws.getUTCDate()+diff); return new Date(Date.UTC(ws.getUTCFullYear(), ws.getUTCMonth(), ws.getUTCDate(), 0,0,0)); }
function startOfMonthTZ(date: Date, timeZone: string) { const z = zonedDate(date, timeZone); return new Date(Date.UTC(z.getUTCFullYear(), z.getUTCMonth(), 1, 0,0,0)); }
function addMonthsUTC(date: Date, months: number) { const x = new Date(date); x.setUTCMonth(x.getUTCMonth()+months); return x; }

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cookieStore = cookies();
  const url = new URL(req.url);
  const businessId = url.searchParams.get("business_id") || cookieStore.get("business_id")?.value || ctx.assignments[0]?.business_id;
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });
  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const range = (url.searchParams.get("range") || "week").toLowerCase();
  const primaryLoc = await prisma.business_locations.findFirst({ where: { business_id: businessId, is_primary: true }, select: { timezone: true } });
  const tz = primaryLoc?.timezone || "Europe/Paris";
  const now = new Date();

  let start: Date, end: Date;
  if (range === "month") {
    start = startOfMonthTZ(now, tz);
    end = addMonthsUTC(start, 1);
  } else {
    start = startOfWeekTZ(now, tz);
    end = addDaysUTC(start, 7);
  }

  // Fetch raw data in the window
  const [payments, reservations, reviews, firsts] = await Promise.all([
    prisma.payments.findMany({ where: { business_id: businessId, status: { in: ["CAPTURED", "AUTHORIZED"] as any }, created_at: { gte: start, lt: end } }, select: { amount_cents: true, created_at: true } }),
    prisma.reservations.findMany({ where: { business_id: businessId, starts_at: { gte: start, lt: end }, status: { in: ["CONFIRMED", "COMPLETED"] as any } }, select: { starts_at: true } }),
    prisma.reviews.findMany({ where: { business_id: businessId, created_at: { gte: start, lt: end } }, select: { rating: true, created_at: true } }),
    prisma.reservations.groupBy({ by: ["client_id"], where: { business_id: businessId, client_id: { not: null } }, _min: { starts_at: true } }),
  ]);

  // Build buckets per day in tz
  const buckets: Record<string, { date: string; revenueCents: number; bookings: number; newClients: number; ratingSum: number; ratingCount: number }> = {};
  for (let d = new Date(start); d < end; d = addDaysUTC(d, 1)) {
    const key = d.toISOString().slice(0,10);
    buckets[key] = { date: key, revenueCents: 0, bookings: 0, newClients: 0, ratingSum: 0, ratingCount: 0 };
  }
  const dayKey = (dt: Date) => startOfDayTZ(dt, tz).toISOString().slice(0,10);

  payments.forEach(p => { const k = dayKey(p.created_at as any); if (buckets[k]) buckets[k].revenueCents += p.amount_cents; });
  reservations.forEach(r => { const k = dayKey(r.starts_at as any); if (buckets[k]) buckets[k].bookings += 1; });
  reviews.forEach(rv => { const k = dayKey(rv.created_at as any); if (buckets[k]) { buckets[k].ratingSum += rv.rating; buckets[k].ratingCount += 1; } });
  firsts.forEach(g => { const first = g._min.starts_at; if (first && first >= start && first < end) { const k = dayKey(first as any); if (buckets[k]) buckets[k].newClients += 1; } });

  const days = Object.values(buckets).map(b => ({
    date: b.date,
    revenueCents: b.revenueCents,
    bookings: b.bookings,
    newClients: b.newClients,
    rating: b.ratingCount ? Number((b.ratingSum / b.ratingCount).toFixed(2)) : 0,
  }));

  return NextResponse.json({ range, start: start.toISOString(), end: end.toISOString(), days });
}
