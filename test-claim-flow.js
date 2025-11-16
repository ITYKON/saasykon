// Test du système de revendication de salons
const { PrismaClient } = require('./lib/generated/prisma');

const prisma = new PrismaClient();

async function testClaimFlow() {
  console.log('=== TEST DU SYSTÈME DE REVENDICATION ===\n');

  try {
    // 1. Vérifier l'état initial des salons
    console.log('1. ÉTAT INITIAL DES SALONS');
    const allSalons = await prisma.businesses.findMany({
      select: {
        id: true,
        public_name: true,
        claim_status: true,
        status: true,
        owner_user_id: true,
      }
    });

    console.log('Total salons:', allSalons.length);
    console.log('Répartition par claim_status:');
    allSalons.reduce((acc, salon) => {
      acc[salon.claim_status || 'null'] = (acc[salon.claim_status || 'null'] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n');

    // 2. Vérifier les leads
    console.log('2. ÉTAT DES LEADS');
    const leads = await prisma.business_leads.findMany({
      select: {
        id: true,
        business_name: true,
        email: true,
        status: true,
        converted_by: true,
      }
    });

    console.log('Total leads:', leads.length);
    console.log('Leads non convertis:', leads.filter(l => !l.converted_by).length);
    console.log('Leads convertis:', leads.filter(l => l.converted_by).length);
    console.log('\n');

    // 3. Vérifier les revendications
    console.log('3. ÉTAT DES REVENDICATIONS');
    const claims = await prisma.claims.findMany({
      select: {
        id: true,
        business_id: true,
        user_id: true,
        status: true,
        documents_submitted: true,
        created_at: true,
        businesses: {
          select: {
            public_name: true,
            claim_status: true,
          }
        }
      }
    });

    console.log('Total revendications:', claims.length);
    console.log('Répartition par statut:');
    const statusCounts = claims.reduce((acc, claim) => {
      acc[claim.status] = (acc[claim.status] || 0) + 1;
      return acc;
    }, {});
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    console.log('\n');

    // 4. Test de cohérence
    console.log('4. TEST DE COHÉRENCE');
    
    // Vérifier que les salons avec claim_status "pending" ont bien une revendication
    const pendingSalons = allSalons.filter(s => s.claim_status === 'pending');
    const pendingClaimIds = claims.filter(c => c.status === 'pending' || c.status === 'documents_submitted').map(c => c.business_id);
    
    console.log('Salons avec claim_status "pending":', pendingSalons.length);
    console.log('Revendications en cours:', pendingClaimIds.length);
    
    const incoherence = pendingSalons.some(salon => !pendingClaimIds.includes(salon.id));
    if (incoherence) {
      console.log('⚠️  INCOHÉRENCE DÉTECTÉE: Des salons ont claim_status "pending" sans revendication active');
    } else {
      console.log('✅ Cohérence vérifiée: Les salons "pending" ont bien des revendications actives');
    }

    // 5. Vérifier la séparation leads vs revendications
    console.log('\n5. SÉPARATION LEADS vs REVENDICATIONS');
    
    const fromLeadsSalons = allSalons.filter(s => s.claim_status === 'not_claimable');
    const claimableSalons = allSalons.filter(s => s.claim_status === 'none');
    const claimedSalons = allSalons.filter(s => s.claim_status === 'approved');
    
    console.log('Salons créés depuis les leads (not_claimable):', fromLeadsSalons.length);
    console.log('Salons disponibles pour revendication (none):', claimableSalons.length);
    console.log('Salons revendiqués avec succès (approved):', claimedSalons.length);

    // 6. Test du flux de revendication
    console.log('\n6. TEST DU FLUX DE REVENDICATION');
    
    if (claimableSalons.length > 0) {
      const testSalon = claimableSalons[0];
      console.log(`Test avec le salon: ${testSalon.public_name} (${testSalon.id})`);
      console.log('Statut actuel:', testSalon.claim_status);
      
      // Simuler une demande de revendication
      console.log('-> Simulation d\'une demande de revendication...');
      
      // Vérifier si le business peut être revendiqué
      if (testSalon.claim_status === 'none') {
        console.log('✅ Le salon peut être revendiqué');
      } else {
        console.log('❌ Le salon ne peut pas être revendiqué');
      }
    } else {
      console.log('❌ Aucun salon disponible pour tester la revendication');
    }

    console.log('\n=== FIN DU TEST ===');

  } catch (error) {
    console.error('Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testClaimFlow();
