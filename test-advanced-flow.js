// Test avancé du système de revendication - Détection des incohérences
const { PrismaClient } = require('./lib/generated/prisma');

const prisma = new PrismaClient();

async function testAdvancedFlow() {
  console.log('=== TEST AVANCÉ - DÉTECTION DES INCOHÉRENCES ===\n');

  try {
    // 1. Vérification des incohérences claim_status vs claims réels
    console.log('1. INCOHÉRENCES CLAIM_STATUS vs CLAIMS RÉELS');
    
    const allSalons = await prisma.businesses.findMany({
      select: {
        id: true,
        public_name: true,
        claim_status: true,
        status: true,
        owner_user_id: true,
      }
    });

    const claims = await prisma.claims.findMany({
      select: {
        id: true,
        business_id: true,
        user_id: true,
        status: true,
        documents_submitted: true,
        created_at: true,
      }
    });

    // Vérifier les salons avec claim_status "pending" mais sans revendication active
    const pendingSalons = allSalons.filter(s => s.claim_status === 'pending');
    const activeClaimBusinessIds = claims
      .filter(c => ['pending', 'documents_submitted'].includes(c.status))
      .map(c => c.business_id);

    const incoherentPendingSalons = pendingSalons.filter(salon => 
      !activeClaimBusinessIds.includes(salon.id)
    );

    if (incoherentPendingSalons.length > 0) {
      console.log('⚠️  SALONS PENDANTS SANS REVENDICATION ACTIVE:');
      incoherentPendingSalons.forEach(salon => {
        console.log(`  - ${salon.public_name} (${salon.id})`);
      });
    } else {
      console.log('✅ Tous les salons "pending" ont des revendications actives');
    }

    // Vérifier les revendications actives mais avec salons non "pending"
    const activeClaims = claims.filter(c => ['pending', 'documents_submitted'].includes(c.status));
    const incoherentActiveClaims = activeClaims.filter(claim => {
      const salon = allSalons.find(s => s.id === claim.business_id);
      return !salon || salon.claim_status !== 'pending';
    });

    if (incoherentActiveClaims.length > 0) {
      console.log('\n⚠️  REVENDICATIONS ACTIVES AVEC SALONS NON PENDANTS:');
      incoherentActiveClaims.forEach(claim => {
        const salon = allSalons.find(s => s.id === claim.business_id);
        console.log(`  - Claim ${claim.id} pour ${salon?.public_name || 'SALON INTROUVABLE'} (claim_status: ${salon?.claim_status})`);
      });
    } else {
      console.log('✅ Toutes les revendications actives correspondent à des salons "pending"');
    }

    // 2. Vérification des salons approuvés vs owner
    console.log('\n2. VÉRIFICATION DES SALONS APPROUVÉS');
    
    const approvedClaims = claims.filter(c => c.status === 'approved');
    const approvedSalons = allSalons.filter(s => s.claim_status === 'approved');

    console.log('Revendications approuvées:', approvedClaims.length);
    console.log('Salons avec claim_status "approved":', approvedSalons.length);

    // Vérifier la cohérence
    const approvedClaimBusinessIds = approvedClaims.map(c => c.business_id);
    const incoherentApprovedSalons = approvedSalons.filter(salon => 
      !approvedClaimBusinessIds.includes(salon.id)
    );

    if (incoherentApprovedSalons.length > 0) {
      console.log('⚠️  SALONS APPROUVÉS SANS REVENDICATION APPROUVÉE:');
      incoherentApprovedSalons.forEach(salon => {
        console.log(`  - ${salon.public_name} (${salon.id}) - Owner: ${salon.owner_user_id}`);
      });
    } else {
      console.log('✅ Tous les salons "approved" ont des revendications approuvées');
    }

    // Vérifier que les owners sont corrects
    const ownerInconsistencies = approvedSalons.filter(salon => {
      const claim = approvedClaims.find(c => c.business_id === salon.id);
      return claim && salon.owner_user_id !== claim.user_id;
    });

    if (ownerInconsistencies.length > 0) {
      console.log('\n⚠️  INCOHÉRENCES DE PROPRIÉTAIRE:');
      ownerInconsistencies.forEach(salon => {
        const claim = approvedClaims.find(c => c.business_id === salon.id);
        console.log(`  - ${salon.public_name}: salon.owner_user_id=${salon.owner_user_id}, claim.user_id=${claim?.user_id}`);
      });
    } else {
      console.log('✅ Tous les propriétaires des salons approuvés sont corrects');
    }

    // 3. Vérification des leads convertis
    console.log('\n3. VÉRIFICATION DES LEADS CONVERTIS');
    
    const leads = await prisma.business_leads.findMany({
      select: {
        id: true,
        business_name: true,
        email: true,
        status: true,
        converted_by: true,
      }
    });

    const convertedLeads = leads.filter(l => l.converted_by);
    const notClaimableSalons = allSalons.filter(s => s.claim_status === 'not_claimable');

    console.log('Leads convertis:', convertedLeads.length);
    console.log('Salons "not_claimable":', notClaimableSalons.length);

    // Cette vérification est plus complexe car les leads convertis créent des salons
    // mais il n'y a pas de lien direct dans la base de données
    console.log('ℹ️  Note: La vérification exacte des leads→salons nécessiterait un tracking supplémentaire');

    // 4. Test des cas limites
    console.log('\n4. TEST DES CAS LIMITES');
    
    // Salons sans claim_status
    const salonsWithoutClaimStatus = allSalons.filter(s => !s.claim_status);
    if (salonsWithoutClaimStatus.length > 0) {
      console.log('⚠️  SALONS SANS CLAIM_STATUS:');
      salonsWithoutClaimStatus.forEach(salon => {
        console.log(`  - ${salon.public_name} (${salon.id})`);
      });
    }

    // Revendications expirées
    const expiredClaims = claims.filter(c => 
      c.token_expires_at && new Date(c.token_expires_at) < new Date()
    );
    if (expiredClaims.length > 0) {
      console.log('\n⚠️  REVENDICATIONS EXPIRÉES:');
      expiredClaims.forEach(claim => {
        console.log(`  - Claim ${claim.id} expirée le ${claim.token_expires_at}`);
      });
    }

    // 5. Simulation de flux complet
    console.log('\n5. SIMULATION DE FLUX COMPLET');
    
    const availableSalon = allSalons.find(s => s.claim_status === 'none');
    if (availableSalon) {
      console.log(`✅ Salon disponible pour revendication: ${availableSalon.public_name}`);
      
      // Vérifier les conditions
      const hasActiveClaim = claims.some(c => 
        c.business_id === availableSalon.id && 
        ['pending', 'documents_submitted'].includes(c.status)
      );
      
      if (!hasActiveClaim) {
        console.log('✅ Conditions respectées: pas de revendication active');
      } else {
        console.log('❌ Condition non respectée: revendication active existante');
      }
    } else {
      console.log('❌ Aucun salon disponible pour la revendication');
    }

    console.log('\n=== FIN DU TEST AVANCÉ ===');

  } catch (error) {
    console.error('Erreur lors du test avancé:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test avancé
testAdvancedFlow();
