import { prisma } from '../lib/prisma';

async function main() {
  const userId = '0435182c-59b7-4994-a7f6-d4c322b13113';
  
  try {
    console.log('=== Vérification des entreprises ===');
    
    // Vérifier l'utilisateur
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, email: true, created_at: true }
    });
    console.log('\nUtilisateur:', user);
    
    // Vérifier les entreprises avec owner_user_id
    const businesses1 = await prisma.businesses.findMany({
      where: { owner_user_id: userId },
      select: { id: true, public_name: true, status: true, owner_user_id: true, owner_id: true }
    });
    console.log('\nEntreprises (owner_user_id):', JSON.stringify(businesses1, null, 2));
    
    // Vérifier les entreprises avec owner_id
    const businesses2 = await prisma.businesses.findMany({
      where: { owner_id: userId },
      select: { id: true, public_name: true, status: true, owner_user_id: true, owner_id: true }
    });
    console.log('\nEntreprises (owner_id):', JSON.stringify(businesses2, null, 2));
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
