import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";

function toDate(value: string) { const d = new Date(value); if (isNaN(d.getTime())) throw new Error("Invalid date"); return d; }

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const {
    business_id,
    client_id,
    employee_id,
    starts_at,
    items,
    notes,
    location_id,
  } = body || {};

  const bizId = business_id || ctx.assignments[0]?.business_id;
  if (!bizId) return NextResponse.json({ error: "business_id required" }, { status: 400 });
  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === bizId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: "items required" }, { status: 400 });
  const start = typeof starts_at === 'string' ? toDate(starts_at) : new Date(starts_at);

  // Compute end time from items durations
  const durations: number[] = items.map((i: any) => Number(i.duration_minutes || 0));
  const totalMinutes = durations.reduce((s, x) => s + (isFinite(x) ? x : 0), 0);
  const ends = new Date(start.getTime() + totalMinutes * 60000);

  // Create reservation + items in a transaction
  const created = await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservations.create({
      data: {
        business_id: bizId,
        client_id: client_id || null,
        employee_id: employee_id || null,
        location_id: location_id || null,
        booker_user_id: ctx.userId,
        starts_at: start,
        ends_at: ends,
        status: 'CONFIRMED' as any,
        notes: notes || null,
      },
    });

    // For each item, we require service_id, price_cents, duration_minutes
    for (const it of items) {
      await tx.reservation_items.create({
        data: {
          reservation_id: reservation.id,
          service_id: it.service_id,
          variant_id: it.variant_id || null,
          employee_id: it.employee_id || employee_id || null,
          price_cents: Number(it.price_cents || 0),
          currency: it.currency || 'EUR',
          duration_minutes: Number(it.duration_minutes || 0),
        },
      });
    }

    return reservation;
  });

  return NextResponse.json({ reservation_id: created.id });
}
