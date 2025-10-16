import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Placeholder webhook for Stripe-like events. No signature verification for now.
// Expected minimal payload example:
// { type: "invoice.payment_succeeded", data: { subscription_id: "...", provider_subscription_id: "..." } }

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const type = body?.type || "";
  const data = body?.data || {};

  // Log webhook event
  await prisma.event_logs.create({
    data: {
      event_name: "billing.webhook_event",
      payload: { type, data },
    },
  }).catch(() => {});

  // Update subscriptions when possible
  if (type === "invoice.payment_succeeded") {
    const subId = data.subscription_id as string | undefined;
    if (subId) {
      await prisma.subscriptions.update({
        where: { id: subId },
        data: { status: "ACTIVE" as any },
      }).catch(() => {});
      // Optionally set business active
      const sub = await prisma.subscriptions.findUnique({ where: { id: subId } }).catch(() => null);
      if (sub?.business_id) {
        await prisma.businesses.update({ where: { id: sub.business_id }, data: { status: "active" as any } }).catch(() => {});
      }
    }
  }

  if (type === "invoice.payment_failed") {
    const subId = data.subscription_id as string | undefined;
    if (subId) {
      await prisma.subscriptions.update({ where: { id: subId }, data: { status: "PAST_DUE" as any } }).catch(() => {});
    }
  }

  return NextResponse.json({ received: true });
}
