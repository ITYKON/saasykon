import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export async function POST(request: Request) {
  try {
    const { token, status } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token de réclamation manquant" },
        { status: 400 }
      );
    }

    // Vérifier que le statut est valide
    const validStatuses = [
      "documents_pending",
      "documents_submitted",
      "approved",
      "rejected",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Statut de réclamation invalide" },
        { status: 400 }
      );
    }

    // Hasher le token comme dans les autres APIs
    const tokenHash = createHash("sha256").update(token).digest("hex");

    // Mettre à jour le statut de la réclamation
    const updatedClaim = await prisma.claims.update({
      where: {
        claim_token: tokenHash,
      },
      data: {
        status,
      },
      include: {
        businesses: true,
      },
    });

    return NextResponse.json({
      success: true,
      claim: updatedClaim,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour du statut de la réclamation:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du statut de la réclamation" },
      { status: 500 }
    );
  }
}
