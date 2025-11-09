import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Non autorisé', { status: 401 });
    }

    const formData = await request.formData();
    
    // Récupération des données du formulaire
    const rcNumber = formData.get('rcNumber') as string;
    const rcDocument = formData.get('rcDocument') as File;
    const idDocumentFront = formData.get('idDocumentFront') as File;
    const idDocumentBack = formData.get('idDocumentBack') as File;

    // Vérification des fichiers requis
    if (!rcDocument || !idDocumentFront || !idDocumentBack) {
      return new NextResponse('Tous les documents sont requis', { status: 400 });
    }

    // Dans un environnement de production, vous voudrez télécharger les fichiers vers un service de stockage comme S3
    // Pour l'instant, nous allons simuler le stockage en générant des URLs factices
    const generateFileUrl = (file: File) => {
      return `/uploads/${Date.now()}-${file.name}`;
    };

    const rcDocumentUrl = generateFileUrl(rcDocument);
    const idDocumentFrontUrl = generateFileUrl(idDocumentFront);
    const idDocumentBackUrl = generateFileUrl(idDocumentBack);

    // Récupérer l'ID de l'entreprise de l'utilisateur
    const userWithBusiness = await prisma.users.findUnique({
      where: { id: session.user.id },
      include: { businesses: true }
    });

    if (!userWithBusiness?.businesses?.[0]?.id) {
      return new NextResponse('Aucune entreprise trouvée pour cet utilisateur', { status: 400 });
    }

    const businessId = userWithBusiness.businesses[0].id;

    // Vérifier s'il existe déjà une vérification en attente
    const existingVerification = await prisma.business_verifications.findFirst({
      where: {
        business_id: businessId,
        status: { in: ['PENDING', 'PENDING_VERIFICATION'] }
      }
    });

    // Mettre à jour ou créer une nouvelle vérification
    if (existingVerification) {
      // Mettre à jour la vérification existante
      await prisma.business_verifications.update({
        where: { id: existingVerification.id },
        data: {
          rc_number: rcNumber,
          rc_document_url: rcDocumentUrl,
          id_document_front_url: idDocumentFrontUrl,
          id_document_back_url: idDocumentBackUrl,
          status: 'PENDING_VERIFICATION',
          reviewed_at: null,
          reviewed_by: null,
          notes: null
        }
      });
    } else {
      // Créer une nouvelle vérification
      await prisma.business_verifications.create({
        data: {
          business_id: businessId,
          rc_number: rcNumber,
          rc_document_url: rcDocumentUrl,
          id_document_front_url: idDocumentFrontUrl,
          id_document_back_url: idDocumentBackUrl,
          status: 'PENDING_VERIFICATION'
        }
      });
    }

    // Mettre à jour le statut de l'entreprise
    await prisma.businesses.update({
      where: { id: businessId },
      data: { status: 'PENDING_VERIFICATION' }
    });

    // Envoyer une notification à l'administrateur
    // À implémenter: système de notification pour les administrateurs

    return NextResponse.json({ 
      success: true,
      message: 'Documents soumis avec succès. Vérification en cours.'
    });

  } catch (error) {
    console.error('Erreur lors de la soumission des documents:', error);
    return new NextResponse('Erreur interne du serveur', { status: 500 });
  }
}
