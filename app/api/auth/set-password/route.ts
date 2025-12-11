import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    console.log('Définition du mot de passe pour l\'utilisateur:', user.id);
    
    // Hacher le mot de passe
    const hashedPassword = await hashPassword(password)
    console.log('Mot de passe haché avec succès');

    // Mettre à jour le mot de passe de l'utilisateur
    await prisma.users.update({
      where: { id: user.id },
      data: { 
        password_hash: hashedPassword, 
        updated_at: new Date() 
      },
    })

    console.log('Mot de passe mis à jour avec succès pour l\'utilisateur:', user.id);

    return NextResponse.json({ 
      ok: true,
      userId: user.id
    })
  } catch (error) {
    console.error("Erreur lors de la définition du mot de passe:", error)
    return NextResponse.json(
      { error: "Erreur lors de la définition du mot de passe" },
      { status: 500 }
    )
  }
}
