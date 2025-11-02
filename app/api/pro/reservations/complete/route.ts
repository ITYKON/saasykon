import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const reservationId: string | undefined = body?.reservation_id;
  if (!reservationId) return NextResponse.json({ error: "reservation_id required" }, { status: 400 });

  // Load reservation with business for access control and totals
  const reservation = await prisma.reservations.findUnique({
    where: { id: reservationId },
    include: {
      reservation_items: { select: { price_cents: true, duration_minutes: true, currency: true, service_variants: { select: { price_cents: true, duration_minutes: true } }, services: { select: { name: true } } } },
      clients: { select: { first_name: true, last_name: true } },
    },
  });
  if (!reservation) return NextResponse.json({ error: "Reservation not found" }, { status: 404 });

  const businessId = reservation.business_id;
  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Compute total amount from items
  const totalCents = reservation.reservation_items.reduce((s, it) => s + (it.price_cents ?? it.service_variants?.price_cents ?? 0), 0);
  const currency = reservation.reservation_items.find((it) => it.currency)?.currency || "DZD";

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Update status if not already COMPLETED
      const updated = await tx.reservations.update({
        where: { id: reservationId },
        data: { status: "COMPLETED" as any },
      });

      // Add status history
      await tx.reservation_status_history.create({
        data: {
          reservation_id: reservationId,
          from_status: reservation.status as any,
          to_status: "COMPLETED" as any,
          changed_by_user_id: (ctx as any).userId || null,
          reason: body?.reason || null,
        },
      });

      // Create or update payment
      const existingPayment = await tx.payments.findFirst({ where: { reservation_id: reservationId, status: { in: ["CAPTURED", "AUTHORIZED"] as any } } });
      let payment = existingPayment;
      if (!payment) {
        payment = await tx.payments.create({
          data: {
            business_id: businessId,
            reservation_id: reservationId,
            amount_cents: totalCents,
            currency,
            status: "CAPTURED" as any,
            captured_at: new Date(),
          },
        });
      } else if (payment.status === ("AUTHORIZED" as any)) {
        payment = await tx.payments.update({
          where: { id: payment.id },
          data: { status: "CAPTURED" as any, captured_at: new Date() },
        });
      }

      // Create notification
      const clientName = [reservation.clients?.first_name || "", reservation.clients?.last_name || ""].join(" ").trim() || "Client";
      await tx.notifications.create({
        data: {
          business_id: businessId,
          type: "reservation.completed",
          payload: { reservation_id: reservationId, amount_cents: totalCents, currency, client: clientName, message: `RDV terminé: ${clientName} - ${Math.round(totalCents / 100)} ${currency}` },
        },
      });

      return { updated, payment };
    });

    return NextResponse.json({ ok: true, reservation_id: reservationId, amount_cents: totalCents, currency, payment_created: Boolean(result.payment && result.payment.id) });
  } catch (e) {
    console.error("[POST /api/pro/reservations/complete]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
