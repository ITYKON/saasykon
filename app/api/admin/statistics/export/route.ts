import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrPermission } from "@/lib/authorization";

// Helpers (duplicated from statistics route for isolation)
function startOfDayUTC(d: Date) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0)); }
function addDaysUTC(d: Date, days: number) { const nd = new Date(d); nd.setUTCDate(nd.getUTCDate() + days); return nd; }
function startOfMonthUTC(d: Date) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0)); }
function addMonthsUTC(d: Date, months: number) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds())); }
function parseRange(searchParams: URLSearchParams) {
  const now = new Date();
  const toParam = searchParams.get("to");
  const fromParam = searchParams.get("from");
  const rangeParam = searchParams.get("range"); // e.g. 30d or 3m
  let to = toParam ? new Date(toParam) : now;
  let from: Date;
  if (fromParam) from = new Date(fromParam); else if (rangeParam) {
    const m = rangeParam.match(/^(\d+)([dm])$/i);
    if (m) {
      const n = parseInt(m[1], 10); const unit = m[2].toLowerCase();
      from = unit === "d" ? addDaysUTC(to, -n) : addMonthsUTC(to, -n);
    } else from = addDaysUTC(to, -30);
  } else from = addDaysUTC(to, -30);
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
    const granularity = getGranularity(searchParams);

    // Pull data required for CSV timeseries
    const [payments, reservations, activeLogins, sessionsInRange, reservationsWithUsers] = await Promise.all([
      prisma.payments.findMany({
        where: { status: "CAPTURED", created_at: { gte: start, lt: end } },
        select: { amount_cents: true, created_at: true },
      }),
      prisma.reservations.findMany({
        where: { starts_at: { gte: start, lt: end } },
        select: { id: true, starts_at: true },
      }),
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
    ]);

    const series: Record<string, { revenueCents: number; activeUsers: number; reservations: number }> = {};
    if (granularity === "month") {
      let cursor = startOfMonthUTC(start);
      while (cursor < end) { series[formatKey(cursor, "month")] = { revenueCents: 0, activeUsers: 0, reservations: 0 }; cursor = addMonthsUTC(cursor, 1); }
    } else {
      let cursor = startOfDayUTC(start);
      while (cursor < end) { series[formatKey(cursor, "day")] = { revenueCents: 0, activeUsers: 0, reservations: 0 }; cursor = addDaysUTC(cursor, 1); }
    }

    payments.forEach((p) => {
      const key = formatKey(granularity === "month" ? startOfMonthUTC(p.created_at) : startOfDayUTC(p.created_at), granularity);
      if (!series[key]) series[key] = { revenueCents: 0, activeUsers: 0, reservations: 0 };
      series[key].revenueCents += p.amount_cents || 0;
    });
    reservations.forEach((r) => {
      const key = formatKey(granularity === "month" ? startOfMonthUTC(r.starts_at) : startOfDayUTC(r.starts_at), granularity);
      if (!series[key]) series[key] = { revenueCents: 0, activeUsers: 0, reservations: 0 };
      series[key].reservations += 1;
    });
    const bucketUsers: Record<string, Set<string>> = {};
    // successful logins
    activeLogins.forEach((l) => {
      const key = formatKey(granularity === "month" ? startOfMonthUTC(l.attempted_at as unknown as Date) : startOfDayUTC(l.attempted_at as unknown as Date), granularity);
      if (!bucketUsers[key]) bucketUsers[key] = new Set<string>();
      if (l.user_id) bucketUsers[key].add(l.user_id);
    });
    // sessions created
    sessionsInRange.forEach((s) => {
      const key = formatKey(granularity === "month" ? startOfMonthUTC(s.created_at as unknown as Date) : startOfDayUTC(s.created_at as unknown as Date), granularity);
      if (!bucketUsers[key]) bucketUsers[key] = new Set<string>();
      if ((s as any).user_id) bucketUsers[key].add((s as any).user_id);
    });
    // reservations with booker_user_id
    reservationsWithUsers.forEach((r) => {
      const key = formatKey(granularity === "month" ? startOfMonthUTC(r.starts_at as unknown as Date) : startOfDayUTC(r.starts_at as unknown as Date), granularity);
      if (!bucketUsers[key]) bucketUsers[key] = new Set<string>();
      if ((r as any).booker_user_id) bucketUsers[key].add((r as any).booker_user_id);
    });
    Object.keys(bucketUsers).forEach((k) => { if (!series[k]) series[k] = { revenueCents: 0, activeUsers: 0, reservations: 0 }; series[k].activeUsers = bucketUsers[k].size; });

    const rows = Object.keys(series).sort().map((k) => ({ key: k, revenueDZD: Math.round(series[k].revenueCents / 100), activeUsers: series[k].activeUsers, reservations: series[k].reservations }));

    // Build CSV with locale-friendly separator for Excel (semicolon) and BOM + sep line
    const delimiter = ";";
    const header = ["periode","revenus_DA","utilisateurs_actifs","reservations"].join(delimiter);
    const body = rows.map(r => [r.key, r.revenueDZD, r.activeUsers, r.reservations].join(delimiter)).join("\n");
    const content = `sep=${delimiter}\n${header}\n${body}`;
    const bom = "\uFEFF"; // UTF-8 BOM for Excel
    const csv = bom + content;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="statistics_${granularity}_${start.toISOString().slice(0,10)}_${end.toISOString().slice(0,10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[GET /api/admin/statistics/export] Error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
