import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";

/**
 * GET /api/admin/plans/[id]
 * Récupère un plan spécifique
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const isAdmin = auth.roles.includes("ADMIN");
    const hasPermission = auth.permissions.includes("subscriptions");
    
    if (!isAdmin && !hasPermission) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const planId = parseInt(params.id);
    if (isNaN(planId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const plan = await prisma.plans.findUnique({
      where: { id: planId },
      include: {
        plan_features: true,
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Erreur lors de la récupération du plan:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/plans/[id]
 * Met à jour un plan d'abonnement
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const isAdmin = auth.roles.includes("ADMIN");
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé - Admin uniquement" }, { status: 403 });
    }

    const planId = parseInt(params.id);
    if (isNaN(planId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const body = await req.json();
    const { name, price_cents, billing_interval, trial_days, features, is_active } = body;

    // Validation
    if (!name || typeof price_cents !== "number" || price_cents < 0) {
      return NextResponse.json(
        { error: "Données invalides" },
        { status: 400 }
      );
    }

    // Vérifier que le plan existe
    const existingPlan = await prisma.plans.findUnique({
      where: { id: planId },
    });

    if (!existingPlan) {
      return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 });
    }

    // Mettre à jour le plan et ses features dans une transaction
    const updatedPlan = await prisma.$transaction(async (tx) => {
      // Mettre à jour le plan
      const plan = await tx.plans.update({
        where: { id: planId },
        data: {
          name,
          price_cents,
          billing_interval: billing_interval || existingPlan.billing_interval,
          trial_days: trial_days !== undefined ? trial_days : existingPlan.trial_days,
          is_active: is_active !== undefined ? is_active : existingPlan.is_active,
        },
      });

      // Si des features sont fournies, les mettre à jour
      if (features && Array.isArray(features)) {
        // Supprimer les anciennes features
        await tx.plan_features.deleteMany({
          where: { plan_id: planId },
        });

        // Créer les nouvelles features
        if (features.length > 0) {
          await tx.plan_features.createMany({
            data: features.map((f: { feature_code: string; value?: string }) => ({
              plan_id: planId,
              feature_code: f.feature_code,
              value: f.value || null,
            })),
          });
        }
      }

      return plan;
    });

    // Récupérer le plan mis à jour avec ses features
    const planWithFeatures = await prisma.plans.findUnique({
      where: { id: planId },
      include: {
        plan_features: true,
      },
    });

    return NextResponse.json({
      message: "Plan mis à jour avec succès",
      plan: planWithFeatures,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du plan:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
