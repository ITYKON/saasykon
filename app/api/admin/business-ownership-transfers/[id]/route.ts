import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";

type Action = 'approve' | 'reject';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.roles.includes('ADMIN')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transferId = params.id;
    const { action } = await req.json() as { action: Action };

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Vérifier que le transfert existe et est en attente
    const transfer = await prisma.business_ownership_transfers.findUnique({
      where: { 
        id: transferId,
        status: 'pending',
      },
      include: {
        business: true,
        current_owner: true,
        new_owner: true,
      },
    });

    if (!transfer) {
      return NextResponse.json(
        { error: "Transfer request not found or already processed" },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      // Exécuter le transfert de propriété
      await prisma.$transaction([
        // Mettre à jour le propriétaire du business
        prisma.businesses.update({
          where: { id: transfer.business_id },
          data: {
            owner_user_id: transfer.new_owner_id,
            updated_at: new Date(),
          },
        }),

        // Mettre à jour le statut du transfert
        prisma.business_ownership_transfers.update({
          where: { id: transferId },
          data: {
            status: 'approved',
            reviewed_by: auth.userId,
            reviewed_at: new Date(),
          },
        }),
      ]);

      // TODO: Envoyer des notifications
      // - Au nouvel propriétaire : confirmation du transfert
      // À l'ancien propriétaire : confirmation du transfert
    } else {
      // Rejeter la demande
      await prisma.business_ownership_transfers.update({
        where: { id: transferId },
        data: {
          status: 'rejected',
          reviewed_by: auth.userId,
          reviewed_at: new Date(),
        },
      });

      // TODO: Envoyer une notification à l'ancien propriétaire
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing ownership transfer:", error);
    return NextResponse.json(
      { error: "Failed to process ownership transfer" },
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
    if (!auth || !auth.roles.includes('ADMIN')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transfer = await prisma.business_ownership_transfers.findUnique({
      where: { id: params.id },
      include: {
        business: {
          select: {
            id: true,
            legal_name: true,
            public_name: true,
          },
        },
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

    if (!transfer) {
      return NextResponse.json(
        { error: "Transfer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ transfer });
  } catch (error) {
    console.error("Error fetching transfer details:", error);
    return NextResponse.json(
      { error: "Failed to fetch transfer details" },
      { status: 500 }
    );
  }
}
