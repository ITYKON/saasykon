// Script pour corriger les incohérences détectées
const { PrismaClient } = require('./lib/generated/prisma');

const prisma = new PrismaClient();

async function fixIncoherences() {
  console.log('=== CORRECTION DES INCOHÉRENCES ===\n');

  try {
    // 1. Récupérer les revendications actives
    const activeClaims = await prisma.claims.findMany({
      where: {
        status: {
          in: ['pending', 'documents_submitted']
        }
      },
      include: {
        businesses: {
          select: {
            id: true,
            public_name: true,
            claim_status: true,
          }
        }
      }
    });

    console.log(`Revendications actives trouvées: ${activeClaims.length}`);

    // 2. Corriger les salons qui devraient être "pending"
    for (const claim of activeClaims) {
      if (claim.businesses && claim.businesses.claim_status !== 'pending') {
        console.log(`\nCorrection du salon: ${claim.businesses.public_name}`);
        console.log(`  État actuel: ${claim.businesses.claim_status}`);
        console.log(`  Devrait être: pending`);
        
        // Mettre à jour le claim_status du salon
        await prisma.businesses.update({
          where: { id: claim.business_id },
          data: { claim_status: 'pending' }
        });
        
        console.log(`  ✅ Mis à jour avec succès`);
      }
    }

    // 3. Vérifier les salons "pending" sans revendication active
    const pendingSalons = await prisma.businesses.findMany({
      where: { claim_status: 'pending' },
      include: {
        claims: {
          where: {
            status: {
              in: ['pending', 'documents_submitted']
            }
          }
        }
      }
    });

    console.log('\n\nVérification des salons "pending":');
    for (const salon of pendingSalons) {
      if (salon.claims.length === 0) {
        console.log(`\n⚠️  Salon "pending" sans revendication active: ${salon.public_name}`);
        console.log(`  Options de correction:`);
        console.log(`  1. Mettre claim_status à "none" (rendre revendicable)`);
        console.log(`  2. Mettre claim_status à "not_claimable" (non revendicable)`);
        console.log(`  3. Laisser tel quel (si une revendication est attendue)`);
        
        // Pour ce script, nous allons mettre à "none" par sécurité
        await prisma.businesses.update({
          where: { id: salon.id },
          data: { claim_status: 'none' }
        });
        console.log(`  ✅ Mis à jour à "none" par défaut`);
      } else {
        console.log(`✅ ${salon.public_name} - ${salon.claims.length} revendication(s) active(s)`);
      }
    }

    // 4. Statut final
    console.log('\n\n=== STATUT FINAL APRÈS CORRECTION ===');
    
    const finalStats = await prisma.businesses.groupBy({
      by: ['claim_status'],
      _count: {
        id: true
      }
    });

    console.log('Distribution des claim_status:');
    finalStats.forEach(stat => {
      console.log(`  ${stat.claim_status || 'null'}: ${stat._count.id}`);
    });

    const claimsCount = await prisma.claims.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    console.log('\nDistribution des statuts de revendication:');
    claimsCount.forEach(stat => {
      console.log(`  ${stat.status}: ${stat._count.id}`);
    });

    console.log('\n✅ Correction terminée');

  } catch (error) {
    console.error('Erreur lors de la correction:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la correction
fixIncoherences();
