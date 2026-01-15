import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

import { z } from "zod";

import { createSubscriptionSchema, updateSubscriptionSchema } from "./schemas";

// GET /api/pro/subscription
// Returns the current (or latest) subscription for the active business, including plan details
export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cookieStore = cookies();
    const url = new URL(req.url);
    const businessId =
      url.searchParams.get("business_id") ||
      cookieStore.get("business_id")?.value ||
      ctx.assignments[0]?.business_id;
    if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });

    // Ensure user is allowed to access this business context
    const allowed =
      ctx.roles.includes("ADMIN") ||
      ctx.assignments.some(
        (a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL")
      );
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    let sub = await prisma.subscriptions.findFirst({
      where: { business_id: businessId },
      orderBy: { created_at: "desc" },
      include: { plans: { include: { plan_features: true } } },
    });

    // Auto-provision a TRIAL subscription (60 days) if none exists yet
    if (!sub) {
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setUTCDate(trialEnd.getUTCDate() + 60);

      // Ensure TRIAL plan exists
      let trialPlan = await prisma.plans.findUnique({ where: { code: "TRIAL" } }).catch(() => null as any);
      if (!trialPlan) {
        trialPlan = await prisma.plans.create({
          data: {
            code: "TRIAL",
            name: "Essai gratuit",
            price_cents: 0,
            currency: "EUR",
            billing_interval: "trial",
            trial_days: 60,
            is_active: true,
          },
        });
      }

      sub = await prisma.subscriptions.create({
        data: {
          business_id: businessId,
          plan_id: trialPlan.id,
          status: "TRIALING" as any,
          current_period_start: now,
          current_period_end: trialEnd,
          cancel_at_period_end: false,
        },
        include: { plans: { include: { plan_features: true } } },
      });
    }

    return NextResponse.json({ subscription: sub });
  } catch (error: any) {
    console.error("[GET] /api/pro/subscription error", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/pro/subscription
// Starts a new subscription or swaps plan. Body: { plan_id: number }
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cookieStore = cookies();
    const url = new URL(req.url);
    const businessId =
      url.searchParams.get("business_id") ||
      cookieStore.get("business_id")?.value ||
      ctx.assignments[0]?.business_id;
    if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });

    const allowed =
      ctx.roles.includes("ADMIN") ||
      ctx.assignments.some(
        (a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL")
      );
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    let body: z.infer<typeof createSubscriptionSchema>;
    try {
      const json = await req.json();
      const result = createSubscriptionSchema.safeParse(json);
      if (!result.success) {
        return NextResponse.json({ error: "Validation error", details: result.error.format() }, { status: 400 });
      }
      body = result.data;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const planId = body.plan_id;

    const plan = await prisma.plans.findUnique({ where: { id: planId } });
    if (!plan || !plan.is_active) {
      return NextResponse.json({ error: "Plan not found or inactive" }, { status: 404 });
    }

    const now = new Date();
    const periodStart = now;
    const periodEnd = new Date(periodStart);
    // Very simple period calc: monthly/yearly based on billing_interval field values like 'month'|'year'
    if ((plan.billing_interval || "").toLowerCase().startsWith("year")) {
      periodEnd.setUTCFullYear(periodEnd.getUTCFullYear() + 1);
    } else {
      periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
    }

    // If an active subscription exists, we swap plan immediately and reset the period
    const existing = await prisma.subscriptions.findFirst({
      where: { business_id: businessId },
      orderBy: { created_at: "desc" },
    });

    let subscription;
    if (existing) {
      const upgradingFromTrial = (existing.status as any) === ("TRIALING" as any);
      subscription = await prisma.subscriptions.update({
        where: { id: existing.id },
        data: {
          plan_id: plan.id,
          status: "ACTIVE" as any,
          cancel_at_period_end: false,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          provider_id: null,
          provider_subscription_id: null,
          updated_at: new Date(),
        },
        include: { plans: { include: { plan_features: true } } },
      });
    } else {
      // First-time subscription: apply 2 months free trial if not configured in plan
      const trialDays = (plan.trial_days && plan.trial_days > 0) ? plan.trial_days : 60;
      let firstPeriodEnd = new Date(periodStart);
      let status: any = "PENDING";
      if (trialDays > 0) {
        firstPeriodEnd = new Date(periodStart);
        firstPeriodEnd.setUTCDate(firstPeriodEnd.getUTCDate() + trialDays);
        status = "TRIALING" as any;
      } else {
        // fall back to normal billing period when no trial
        firstPeriodEnd = periodEnd;
        status = "ACTIVE" as any;
      }

      subscription = await prisma.subscriptions.create({
        data: {
          business_id: businessId,
          plan_id: plan.id,
          status,
          current_period_start: periodStart,
          current_period_end: firstPeriodEnd,
          cancel_at_period_end: false,
        },
        include: { plans: { include: { plan_features: true } } },
      });
    }

    // Do not create an invoice while in trial.
    // If upgrading from TRIAL to paid plan, simulate payment by marking invoice as PAID.
    if (subscription.status !== ("TRIALING" as any)) {
      const invoiceStatus = existing && (existing.status as any) === ("TRIALING" as any) ? "PAID" : "OPEN";
      await prisma.subscription_invoices
        .create({
          data: {
            subscription_id: subscription.id,
            amount_cents: plan.price_cents,
            currency: plan.currency,
            status: invoiceStatus,
          },
        })
        .catch(() => {});
    }

    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error("[POST] /api/pro/subscription error", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/pro/subscription
// Body: { action: 'cancel' | 'resume' }
// - cancel: set cancel_at_period_end = true (keeps current period)
// - resume: set cancel_at_period_end = false
export async function PATCH(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cookieStore = cookies();
    const url = new URL(req.url);
    const businessId =
      url.searchParams.get("business_id") ||
      cookieStore.get("business_id")?.value ||
      ctx.assignments[0]?.business_id;
    if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });

    const allowed =
      ctx.roles.includes("ADMIN") ||
      ctx.assignments.some(
        (a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL")
      );
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    let body: z.infer<typeof updateSubscriptionSchema>;
    try { 
      const json = await req.json();
      const result = updateSubscriptionSchema.safeParse(json);
      if (!result.success) {
        return NextResponse.json({ error: "Validation error", details: result.error.format() }, { status: 400 });
      }
      body = result.data;
    } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
    const action = body.action.toLowerCase();

    const existing = await prisma.subscriptions.findFirst({
      where: { business_id: businessId },
      orderBy: { created_at: "desc" },
      include: { plans: { include: { plan_features: true } } },
    });
    if (!existing) return NextResponse.json({ error: "No subscription found" }, { status: 404 });

    const updated = await prisma.subscriptions.update({
      where: { id: existing.id },
      data: {
        cancel_at_period_end: action === "cancel",
        updated_at: new Date(),
      },
      include: { plans: { include: { plan_features: true } } },
    });

    return NextResponse.json({ subscription: updated });
  } catch (error: any) {
    console.error("[PATCH] /api/pro/subscription error", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
