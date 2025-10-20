import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/public/plans
 * Récupère tous les plans d'abonnement actifs (API publique)
 */
export async function GET(req: NextRequest) {
  try {
    // Récupérer tous les plans actifs avec leurs features
    const plans = await prisma.plans.findMany({
      where: {
        is_active: true,
      },
      include: {
        plan_features: true,
      },
      orderBy: {
        price_cents: "asc",
      },
    });

    // Formater les plans pour l'affichage public
    const formattedPlans = plans.map((plan) => ({
      id: plan.id,
      code: plan.code,
      name: plan.name,
      price_cents: plan.price_cents,
      currency: plan.currency,
      billing_interval: plan.billing_interval,
      trial_days: plan.trial_days,
      is_active: plan.is_active,
      features: plan.plan_features.map((f) => ({
        feature_code: f.feature_code,
        value: f.value,
      })),
    }));

    return NextResponse.json({ plans: formattedPlans });
  } catch (error) {
    console.error("Erreur lors de la récupération des plans:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
