const { PrismaClient } = require("../lib/generated/prisma");

const prisma = new PrismaClient();

async function checkFeatures() {
  console.log("🔍 Vérification des features dans la BDD...\n");

  try {
    const plans = await prisma.plans.findMany({
      include: {
        plan_features: true,
      },
      orderBy: {
        price_cents: "asc",
      },
    });

    plans.forEach((plan) => {
      console.log(`\n📋 ${plan.name} (${plan.code})`);
      console.log(`   Prix: ${plan.price_cents} ${plan.currency}`);
      console.log(`   Features:`);
      plan.plan_features.forEach((feature) => {
        console.log(`      - "${feature.feature_code}": "${feature.value}"`);
      });
    });
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkFeatures();
