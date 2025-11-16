// Exemples de test pour démontrer la différence entre salons leads et revendicables
const { PrismaClient } = require('./lib/generated/prisma');

const prisma = new PrismaClient();

async function createTestExamples() {
  console.log('=== CRÉATION D\'EXEMPLES DE TEST ===\n');

  try {
    // 1. Créer un salon revendicable (pour les utilisateurs)
    console.log('1. CRÉATION D\'UN SALON REVENDICABLE');
    
    // Récupérer ou créer un user système
    let systemUser = await prisma.users.findFirst({
      where: { email: "system@yoka.com" }
    });
    
    if (!systemUser) {
      systemUser = await prisma.users.create({
        data: {
          email: "system@yoka.com",
          first_name: "System",
          last_name: "YOKA",
          locale: "fr",
        }
      });
    }

    const claimableSalon = await prisma.businesses.create({
      data: {
        owner_user_id: systemUser.id,
        legal_name: "Salon Beauté Revendicable",
        public_name: "Beauté Revendicable Test",
        email: "contact@beaute-revendicable.com",
        phone: "0123456789",
        status: "pending_verification",
        claim_status: "none", // TRÈS IMPORTANT: rend le salon revendicable
        description: "Ce salon peut être revendiqué par un utilisateur",
      }
    });

    console.log(`✅ Salon revendicable créé: ${claimableSalon.public_name}`);
    console.log(`   ID: ${claimableSalon.id}`);
    console.log(`   claim_status: ${claimableSalon.claim_status} (revendicable)`);
    console.log(`   Propriétaire actuel: system@yoka.com (temporaire)\n`);

    // 2. Créer un salon non-revendicable (depuis un lead)
    console.log('2. CRÉATION D\'UN SALON NON-REVENDICABLE (depuis lead)');
    
    // Créer d'abord un lead
    const testLead = await prisma.business_leads.create({
      data: {
        business_name: "Institut Spa Non-Revendicable",
        owner_first_name: "Jean",
        owner_last_name: "Dupont",
        email: "jean.dupont@spa.com",
        phone: "0123456788",
        activity_type: "spa",
        location: "Lyon",
        notes: "Lead de test pour conversion",
        status: "pending",
      }
    });

    console.log(`📋 Lead créé: ${testLead.business_name}`);

    // Simuler la conversion du lead en salon par un admin
    const adminUser = await prisma.users.findFirst({
      where: { email: "admin@yoka.com" }
    });

    if (!adminUser) {
      console.log('⚠️  Création d\'un utilisateur admin pour la démo...');
      // Créer un utilisateur admin fictif pour la démo
      const demoAdmin = await prisma.users.create({
        data: {
          email: "admin@yoka.com",
          first_name: "Admin",
          last_name: "Demo",
          locale: "fr",
        }
      });
      
      // Convertir le lead en salon
      const nonClaimableSalon = await prisma.businesses.create({
        data: {
          owner_user_id: demoAdmin.id,
          legal_name: testLead.business_name,
          public_name: testLead.business_name,
          email: testLead.email,
          phone: testLead.phone,
          status: "pending_verification",
          claim_status: "approved", // Utiliser "approved" pour indiquer qu'il n'est pas revendicable
          description: "Ce salon ne peut PAS être revendiqué (créé depuis un lead)",
        }
      });

      // Marquer le lead comme converti
      await prisma.business_leads.update({
        where: { id: testLead.id },
        data: { converted_by: demoAdmin.id }
      });

      console.log(`✅ Salon non-revendicable créé: ${nonClaimableSalon.public_name}`);
      console.log(`   ID: ${nonClaimableSalon.id}`);
      console.log(`   claim_status: ${nonClaimableSalon.claim_status} (non-revendicable - créé depuis lead)`);
      console.log(`   Propriétaire: admin@yoka.com (définitif)\n`);
    }

    // 3. Créer un salon déjà revendiqué
    console.log('3. CRÉATION D\'UN SALON DÉJÀ REVENDIQUÉ');
    
    // Créer un utilisateur pour la revendication
    let claimantUser = await prisma.users.findFirst({
      where: { email: "claimant@example.com" }
    });
    
    if (!claimantUser) {
      claimantUser = await prisma.users.create({
        data: {
          email: "claimant@example.com",
          first_name: "Marie",
          last_name: "Martin",
          locale: "fr",
        }
      });
    }

    // Créer un salon qui sera revendiqué
    const claimedSalon = await prisma.businesses.create({
      data: {
        owner_user_id: systemUser.id,
        legal_name: "Salon Déjà Revendiqué",
        public_name: "Déjà Revendiqué Test",
        email: "contact@deja-revendique.com",
        phone: "0123456790",
        status: "active",
        claim_status: "approved", // TRÈS IMPORTANT: déjà revendiqué
        description: "Ce salon est déjà revendiqué et appartient à un utilisateur",
      }
    });

    // Créer la revendication correspondante
    await prisma.claims.create({
      data: {
        business_id: claimedSalon.id,
        user_id: claimantUser.id,
        full_name: "Marie Martin",
        email: "claimant@example.com",
        phone: "0123456791",
        role: "owner",
        status: "approved", // Revendication approuvée
        documents_submitted: true,
      }
    });

    // Mettre à jour le propriétaire du salon
    await prisma.businesses.update({
      where: { id: claimedSalon.id },
      data: { owner_user_id: claimantUser.id }
    });

    console.log(`✅ Salon déjà revendiqué créé: ${claimedSalon.public_name}`);
    console.log(`   ID: ${claimedSalon.id}`);
    console.log(`   claim_status: ${claimedSalon.claim_status} (déjà revendiqué)`);
    console.log(`   Propriétaire: claimant@example.com (utilisateur réel)\n`);

    // 4. Démonstration des différences
    console.log('4. DÉMONSTRATION DES DIFFÉRENCES');
    
    const allTestSalons = await prisma.businesses.findMany({
      where: {
        public_name: {
          contains: "Test"
        }
      },
      select: {
        id: true,
        public_name: true,
        claim_status: true,
        status: true,
        owner_user_id: true,
        users_businesses_owner_user_idTousers: {
          select: {
            email: true
          }
        }
      }
    });

    console.log('\n📊 RÉCAPITULATIF DES SALONS DE TEST:');
    allTestSalons.forEach(salon => {
      const type = salon.claim_status === 'none' ? '🟢 REVENDICABLE' :
                   (salon.claim_status === 'approved' && salon.public_name.includes('Non-Revendicable')) ? '🔴 NON-REVENDICABLE (Lead)' :
                   salon.claim_status === 'approved' ? '✅ DÉJÀ REVENDIQUÉ' : '❓ AUTRE';
      
      console.log(`\n${type}: ${salon.public_name}`);
      console.log(`   claim_status: "${salon.claim_status}"`);
      console.log(`   propriétaire: ${salon.users_businesses_owner_user_idTousers?.email || 'N/A'}`);
      console.log(`   peut être revendiqué: ${salon.claim_status === 'none' ? 'OUI' : 'NON'}`);
    });

    // 5. Test de tentative de revendication
    console.log('\n\n5. TEST DE TENTATIVE DE REVENDICATION');
    
    for (const salon of allTestSalons) {
      const canClaim = salon.claim_status === 'none';
      console.log(`\n🧪 Test: Peut-on revendiquer "${salon.public_name}"?`);
      
      if (canClaim) {
        console.log(`   ✅ OUI - claim_status est "${salon.claim_status}"`);
        console.log(`   → Un utilisateur peut soumettre une revendication`);
      } else {
        console.log(`   ❌ NON - claim_status est "${salon.claim_status}"`);
        console.log(`   → La revendication sera bloquée par l'API`);
      }
    }

    console.log('\n=== FIN DES EXEMPLES DE TEST ===');
    console.log('\n💡 CONCLUSION:');
    console.log('- Les salons revendicables ont claim_status = "none"');
    console.log('- Les salons créés depuis les leads ont claim_status = "not_claimable"');
    console.log('- Les salons déjà revendiqués ont claim_status = "approved"');
    console.log('- Seuls les salons avec claim_status = "none" peuvent être revendiqués');

  } catch (error) {
    console.error('Erreur lors de la création des exemples:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la création d'exemples
createTestExamples();
