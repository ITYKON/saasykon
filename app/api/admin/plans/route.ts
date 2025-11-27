export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";

/**
 * GET /api/admin/plans
 * Récupère tous les plans d'abonnement avec leurs features
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin ou a la permission subscriptions
    const isAdmin = auth.roles.includes("ADMIN");
    const hasPermission = auth.permissions.includes("subscriptions");
    
    if (!isAdmin && !hasPermission) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupérer tous les plans actifs avec leurs features
    const plans = await prisma.plans.findMany({
      where: {
        is_active: true,
      },
      include: {
        plan_features: true,
        subscriptions: {
          where: {
            status: "ACTIVE",
          },
        },
      },
      orderBy: {
        price_cents: "asc",
      },
    });

    // Calculer les statistiques pour chaque plan
    const plansWithStats = plans.map((plan) => {
      const subscribers = plan.subscriptions.length;
      const revenue = subscribers * plan.price_cents;

      return {
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
        subscribers,
        revenue,
      };
    });

    return NextResponse.json({ plans: plansWithStats });
  } catch (error) {
    console.error("Erreur lors de la récupération des plans:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
