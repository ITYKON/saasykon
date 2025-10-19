import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function seedPlans() {
  console.log("🌱 Seeding plans...");

  const plans = [
    {
      code: "decouverte",
      name: "Découverte",
      price_cents: 0, // 0 DA
      currency: "DZD",
      billing_interval: "monthly",
      trial_days: 0,
      is_active: true,
      features: [
        { feature_code: "directory_listing", value: "true" },
        { feature_code: "public_page", value: "true" },
        { feature_code: "manual_booking", value: "true" },
        { feature_code: "employee_accounts", value: "1" },
        { feature_code: "calendar_sync", value: "false" },
        { feature_code: "statistics", value: "false" },
      ],
    },
    {
      code: "starter",
      name: "Starter",
      price_cents: 2500, // 2,500 DA
      currency: "DZD",
      billing_interval: "monthly",
      trial_days: 14,
      is_active: true,
      features: [
        { feature_code: "directory_listing", value: "true" },
        { feature_code: "public_page", value: "true" },
        { feature_code: "full_booking_management", value: "true" },
        { feature_code: "email_reminders", value: "true" },
        { feature_code: "employee_accounts", value: "2" },
        { feature_code: "basic_statistics", value: "true" },
        { feature_code: "priority_support", value: "true" },
      ],
    },
    {
      code: "pro",
      name: "Pro",
      price_cents: 4500, // 4,500 DA
      currency: "DZD",
      billing_interval: "monthly",
      trial_days: 14,
      is_active: true,
      features: [
        { feature_code: "all_starter_features", value: "true" },
        { feature_code: "employee_accounts", value: "5" },
        { feature_code: "absence_management", value: "true" },
        { feature_code: "variable_hours", value: "true" },
        { feature_code: "crm_basic", value: "true" },
        { feature_code: "social_integration", value: "true" },
        { feature_code: "promo_campaigns", value: "true" },
      ],
    },
    {
      code: "business",
      name: "Business",
      price_cents: 10000, // 10,000 DA
      currency: "DZD",
      billing_interval: "monthly",
      trial_days: 30,
      is_active: true,
      features: [
        { feature_code: "all_pro_features", value: "true" },
        { feature_code: "multi_salon", value: "unlimited" },
        { feature_code: "employee_accounts", value: "unlimited" },
        { feature_code: "advanced_dashboards", value: "true" },
        { feature_code: "dedicated_support", value: "true" },
        { feature_code: "custom_training", value: "true" },
        { feature_code: "api_integration", value: "true" },
        { feature_code: "accounting_tools", value: "true" },
      ],
    },
  ];

  for (const planData of plans) {
    const { features, ...planInfo } = planData;

    // Vérifier si le plan existe déjà
    const existingPlan = await prisma.plans.findUnique({
      where: { code: planInfo.code },
    });

    if (existingPlan) {
      console.log(`  ⏭️  Plan "${planInfo.name}" existe déjà, mise à jour...`);
      
      // Mettre à jour le plan
      await prisma.plans.update({
        where: { code: planInfo.code },
        data: planInfo,
      });

      // Supprimer les anciennes features
      await prisma.plan_features.deleteMany({
        where: { plan_id: existingPlan.id },
      });

      // Créer les nouvelles features
      await prisma.plan_features.createMany({
        data: features.map((f) => ({
          plan_id: existingPlan.id,
          feature_code: f.feature_code,
          value: f.value,
        })),
      });
    } else {
      console.log(`  ✅ Création du plan "${planInfo.name}"...`);
      
      // Créer le plan avec ses features
      await prisma.plans.create({
        data: {
          ...planInfo,
          plan_features: {
            create: features,
          },
        },
      });
    }
  }

  console.log("✅ Plans seeded successfully!");
}

// Exécuter le seed si ce fichier est appelé directement
if (require.main === module) {
  seedPlans()
    .catch((e) => {
      console.error("❌ Error seeding plans:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
