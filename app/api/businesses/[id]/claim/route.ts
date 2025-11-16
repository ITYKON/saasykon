import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const businessId = params.id;
    
    // Vérifier si le business existe et n'est pas déjà revendiqué
    const business = await prisma.businesses.findUnique({
      where: { id: businessId },
      select: {
        owner_user_id: true,
        converted_from_lead_id: true,
        legal_name: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Salon non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si le salon a déjà un propriétaire
    if (business.owner_user_id) {
      return NextResponse.json(
        { error: "Ce salon a déjà un propriétaire et ne peut pas être revendiqué" },
        { status: 400 }
      );
    }

    // Vérifier si le salon vient d'un lead
    if (business.converted_from_lead_id) {
      return NextResponse.json(
        { error: "Ce salon a été créé via un lead et ne peut pas être revendiqué" },
        { status: 400 }
      );
    }

    // Récupérer les données de la requête
    const { documents } = await req.json();

    // Vérifier si une demande est déjà en cours
    const existingClaim = await prisma.claims.findFirst({
      where: {
        business_id: businessId,
        status: "pending"
      }
    });

    if (existingClaim) {
      return NextResponse.json(
        { error: "Une demande de revendication est déjà en cours pour ce salon" },
        { status: 400 }
      );
    }

    // Récupérer les informations de l'utilisateur pour les champs obligatoires
    const user = await prisma.users.findUnique({
      where: { id: auth.userId },
      select: {
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Créer la demande de revendication
    const claim = await prisma.claims.create({
      data: {
        business_id: businessId,
        user_id: auth.userId,
        status: "pending",
        full_name: `${user.first_name} ${user.last_name}`.trim(),
        email: user.email || "",
        phone: user.phone || "",
        role: "owner",
        documents_submitted: true,
        documents_submitted_at: new Date(),
        // Ajouter les documents fournis
        rc_number: documents.rcNumber,
        rc_document_url: documents.rcDocumentUrl,
        id_document_front_url: documents.idDocumentFrontUrl,
        id_document_back_url: documents.idDocumentBackUrl,
      },
    });

    // TODO: Envoyer une notification à l'administrateur

    return NextResponse.json({ 
      success: true,
      message: "Demande de revendication envoyée avec succès",
      claimId: claim.id
    });

  } catch (error) {
    console.error("Erreur lors de la revendication du salon:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la revendication du salon" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const claim = await prisma.claims.findFirst({
      where: {
        business_id: params.id,
        user_id: auth.userId,
      },
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!claim) {
      return NextResponse.json(
        { hasClaim: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      hasClaim: true,
      claim
    });

  } catch (error) {
    console.error("Erreur lors de la vérification de la revendication:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la vérification de la revendication" },
      { status: 500 }
    );
  }
}
