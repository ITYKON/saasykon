export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: "Token manquant" }, { status: 400 });
    }

    const tokenRecord = await prisma.password_reset_tokens.findUnique({
      where: { token },
      select: { expires_at: true, used: true }
    });

    if (!tokenRecord || tokenRecord.used) {
      return NextResponse.json({ valid: false, error: "Lien invalide ou déjà utilisé" }, { status: 400 });
    }

    if (tokenRecord.expires_at < new Date()) {
      return NextResponse.json({ valid: false, error: "Lien expiré" }, { status: 400 });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return NextResponse.json(
      { valid: false, error: "Erreur serveur lors de la vérification du token" },
      { status: 500 }
    );
  }
}
