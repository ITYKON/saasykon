/**
 * Script pour corriger les claim_status des salons qui ont été revendiqués
 * mais qui ont encore claim_status = "none" au lieu de "approved"
 * 
 * Usage: npx tsx scripts/fix-claim-status.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixClaimStatus() {
  console.log("🔍 Recherche des salons avec des claims approuvés...");

  // Trouver tous les claims approuvés
  const approvedClaims = await prisma.claims.findMany({
    where: {
      status: "approved",
    },
    select: {
      id: true,
      business_id: true,
      status: true,
    },
  });

  console.log(`📋 Trouvé ${approvedClaims.length} claims approuvés`);

  // Pour chaque claim approuvé, vérifier et mettre à jour le business
  let updated = 0;
  let alreadyCorrect = 0;

  for (const claim of approvedClaims) {
    const business = await prisma.businesses.findUnique({
      where: { id: claim.business_id },
      select: { id: true, claim_status: true },
    });

    if (!business) {
      console.log(`⚠️  Business ${claim.business_id} non trouvé pour le claim ${claim.id}`);
      continue;
    }

    if (business.claim_status === "approved") {
      alreadyCorrect++;
      continue;
    }

    // Mettre à jour le claim_status
    await prisma.businesses.update({
      where: { id: claim.business_id },
      data: {
        claim_status: "approved",
        updated_at: new Date(),
      },
    });

    updated++;
    console.log(`✅ Business ${claim.business_id} mis à jour: claim_status = "approved"`);
  }

  console.log("\n📊 Résumé:");
  console.log(`   - Claims approuvés trouvés: ${approvedClaims.length}`);
  console.log(`   - Salons déjà corrects: ${alreadyCorrect}`);
  console.log(`   - Salons mis à jour: ${updated}`);

  // Vérifier aussi les salons avec claim_status = "none" mais qui ont un owner_user_id réel (pas système)
  console.log("\n🔍 Recherche des salons avec owner_user_id réel mais claim_status = 'none'...");

  const systemUser = await prisma.users.findFirst({
    where: { email: "system@yoka.com" },
  });

  if (systemUser) {
    const businessesWithRealOwner = await prisma.businesses.findMany({
      where: {
        claim_status: "none",
        owner_user_id: {
          not: systemUser.id,
        },
      },
      select: {
        id: true,
        public_name: true,
        owner_user_id: true,
      },
    });

    console.log(`📋 Trouvé ${businessesWithRealOwner.length} salons avec owner réel mais claim_status = 'none'`);

    let fixed = 0;
    for (const business of businessesWithRealOwner) {
      // Vérifier s'il y a un claim approuvé pour ce business
      const approvedClaim = await prisma.claims.findFirst({
        where: {
          business_id: business.id,
          status: "approved",
        },
      });

      if (approvedClaim) {
        // Mettre à jour à "approved"
        await prisma.businesses.update({
          where: { id: business.id },
          data: {
            claim_status: "approved",
            updated_at: new Date(),
          },
        });
        fixed++;
        console.log(`✅ Business ${business.id} (${business.public_name}) mis à jour: claim_status = "approved"`);
      } else {
        // Sinon, mettre à "not_claimable" car il a déjà un propriétaire
        await prisma.businesses.update({
          where: { id: business.id },
          data: {
            claim_status: "not_claimable",
            updated_at: new Date(),
          },
        });
        fixed++;
        console.log(`✅ Business ${business.id} (${business.public_name}) mis à jour: claim_status = "not_claimable"`);
      }
    }

    console.log(`\n✅ ${fixed} salons corrigés`);
  }

  console.log("\n✨ Correction terminée!");
}

fixClaimStatus()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

