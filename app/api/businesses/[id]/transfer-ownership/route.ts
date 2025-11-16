import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";

type RequestBody = {
  newOwnerEmail: string;
  documents: {
    idDocumentFront: string;
    idDocumentBack: string;
    proofOfOwnership?: string;
  };
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = params.id;
    const { newOwnerEmail, documents } = (await req.json()) as RequestBody;

    // Vérifier que l'utilisateur est bien le propriétaire actuel
    const business = await prisma.businesses.findUnique({
      where: { 
        id: businessId,
        owner_user_id: auth.userId 
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found or unauthorized" },
        { status: 404 }
      );
    }

    // Vérifier que l'email du nouveau propriétaire existe
    const newOwner = await prisma.users.findUnique({
      where: { email: newOwnerEmail },
    });

    if (!newOwner) {
      return NextResponse.json(
        { error: "New owner not found" },
        { status: 404 }
      );
    }

    // Vérifier qu'il n'y a pas de demande en cours
    const existingTransfer = await prisma.business_ownership_transfers.findFirst({
      where: {
        business_id: businessId,
        status: "pending",
      },
    });

    if (existingTransfer) {
      return NextResponse.json(
        { error: "A transfer request is already pending for this business" },
        { status: 400 }
      );
    }

    // Créer la demande de transfert
    const transfer = await prisma.business_ownership_transfers.create({
      data: {
        business_id: businessId,
        current_owner_id: auth.userId,
        new_owner_id: newOwner.id,
        documents: {
          idDocumentFront: documents.idDocumentFront,
          idDocumentBack: documents.idDocumentBack,
          proofOfOwnership: documents.proofOfOwnership,
        },
      },
    });

    // TODO: Envoyer une notification à l'admin et au nouveau propriétaire

    return NextResponse.json({ transfer });
  } catch (error) {
    console.error("Error creating ownership transfer:", error);
    return NextResponse.json(
      { error: "Failed to create ownership transfer" },
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = params.id;

    // Vérifier que l'utilisateur est impliqué dans le transfert
    const transfers = await prisma.business_ownership_transfers.findMany({
      where: {
        business_id: businessId,
        OR: [
          { current_owner_id: auth.userId },
          { new_owner_id: auth.userId },
        ],
      },
      orderBy: { created_at: "desc" },
      include: {
        current_owner: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        new_owner: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    return NextResponse.json({ transfers });
  } catch (error) {
    console.error("Error fetching ownership transfers:", error);
    return NextResponse.json(
      { error: "Failed to fetch ownership transfers" },
      { status: 500 }
    );
  }
}
