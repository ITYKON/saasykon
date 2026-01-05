import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ exists: true, message: "Cet email est déjà utilisé." }, { status: 200 });
    }

    return NextResponse.json({ exists: false }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'email:', error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}