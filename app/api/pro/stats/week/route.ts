import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

function startOfWeek(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun ... 6=Sat
  const diff = (day === 0 ? -6 : 1) - day; // make Monday first day of week
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cookieStore = cookies();
  const url = new URL(req.url);
  const businessId = url.searchParams.get("business_id") || cookieStore.get("business_id")?.value || ctx.assignments[0]?.business_id;
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });
  // Ensure user has access: ADMIN or PRO assignment for this business
  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const weekStart = startOfWeek(new Date());
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);

  // Revenue: sum payments CAPTURED this week
  const payments = await prisma.payments.aggregate({
    _sum: { amount_cents: true },
    where: { business_id: businessId, status: { in: ["CAPTURED"] as any }, created_at: { gte: weekStart, lt: weekEnd } },
  });

  // Bookings this week
  const bookings = await prisma.reservations.count({ where: { business_id: businessId, starts_at: { gte: weekStart, lt: weekEnd }, status: { in: ["CONFIRMED", "COMPLETED"] as any } } });

  // New clients this week: first reservation of client falls in week
  const firsts = await prisma.reservations.groupBy({
    by: ["client_id"],
    where: { business_id: businessId, client_id: { not: null } },
    _min: { starts_at: true },
  });
  const newClients = firsts.filter((g) => g._min.starts_at && g._min.starts_at >= weekStart && g._min.starts_at < weekEnd).length;

  // Rating average
  const agg = await prisma.ratings_aggregates.findUnique({ where: { business_id: businessId } }).catch(() => null as any);
  const rating = agg?.rating_avg ? Number(agg.rating_avg) : 0;

  return NextResponse.json({
    revenueCents: payments._sum.amount_cents || 0,
    bookings,
    newClients,
    rating,
  });
}
