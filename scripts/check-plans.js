const { PrismaClient } = require("../lib/generated/prisma");

const prisma = new PrismaClient();

async function checkPlans() {
  console.log("🔍 Vérification des plans existants...\n");

  try {
    const plans = await prisma.plans.findMany({
      include: {
        plan_features: true,
      },
    });

    if (plans.length === 0) {
      console.log("❌ Aucun plan trouvé dans la base de données");
      console.log("\n💡 Essayons de voir un exemple de plan existant pour comprendre le format...");
      
      // Essayer de voir la structure
      const rawResult = await prisma.$queryRaw`SELECT * FROM plans LIMIT 1`;
      console.log("Structure:", rawResult);
    } else {
      console.log(`✅ ${plans.length} plan(s) trouvé(s):\n`);
      plans.forEach((plan) => {
        console.log(`📋 ${plan.name} (${plan.code})`);
        console.log(`   Prix: ${plan.price_cents} ${plan.currency}`);
        console.log(`   Intervalle: "${plan.billing_interval}"`);
        console.log(`   Features: ${plan.plan_features.length}`);
        console.log("");
      });
    }
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlans();
