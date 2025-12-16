import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromCookies } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const user = await getAuthUserFromCookies();
    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    // Récupérer l'entreprise de l'utilisateur
    const business = await prisma.businesses.findFirst({
      where: { owner_user_id: user.id },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Aucune entreprise trouvée" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    
    // Téléverser les fichiers
    const idCardFront = formData.get("idDocumentFront") as File | null;
    const idCardBack = formData.get("idDocumentBack") as File | null;
    const rcDocument = formData.get("rcDocument") as File | null;
    const rcNumber = formData.get("rcNumber") as string | null;

    // Vérifier que tous les documents requis sont présents
    if (!idCardFront || !idCardBack || !rcDocument || !rcNumber) {
      return NextResponse.json(
        { error: "Tous les documents sont requis" },
        { status: 400 }
      );
    }

    // Créer un dossier unique pour les documents de cette entreprise
    const folder = `business-verification/${business.id}`;
    
    // Téléverser les fichiers
    const [idCardFrontUrl, idCardBackUrl, rcDocumentUrl] = await Promise.all([
      uploadFile(await idCardFront.arrayBuffer(), `${folder}/id-front-${Date.now()}.${idCardFront.name.split('.').pop()}`),
      uploadFile(await idCardBack.arrayBuffer(), `${folder}/id-back-${Date.now()}.${idCardBack.name.split('.').pop()}`),
      uploadFile(await rcDocument.arrayBuffer(), `${folder}/rc-doc-${Date.now()}.${rcDocument.name.split('.').pop()}`),
    ]);

    // Vérifier si une vérification existe déjà pour cette entreprise
    const existingVerification = await prisma.business_verifications.findFirst({
      where: { business_id: business.id },
    });

    // Mettre à jour ou créer l'enregistrement de vérification
    if (existingVerification) {
      await prisma.business_verifications.update({
        where: { id: existingVerification.id },
        data: {
          rc_number: rcNumber,
          rc_document_url: rcDocumentUrl,
          id_document_front_url: idCardFrontUrl,
          id_document_back_url: idCardBackUrl,
          status: "pending",
          updated_at: new Date(),
        },
      });
    } else {
      await prisma.business_verifications.create({
        data: {
          business_id: business.id,
          rc_number: rcNumber,
          rc_document_url: rcDocumentUrl,
          id_document_front_url: idCardFrontUrl,
          id_document_back_url: idCardBackUrl,
          status: "pending",
        },
      });
    }

    // Mettre à jour le statut de l'entreprise
    await prisma.businesses.update({
      where: { id: business.id },
      data: {
        status: "pending_verification",
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la soumission des documents:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du traitement de votre demande" },
      { status: 500 }
    );
  }
}
