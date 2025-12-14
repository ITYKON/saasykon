import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email, password, claimToken } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur existe et ses revendications en cours
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        claims: {
          where: {
            status: "pending",
            claim_token: claimToken ? { equals: claimToken } : undefined,
            token_expires_at: {
              gte: new Date()
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    // Si un token de revendication est fourni, vérifier qu'il est valide
    if (claimToken && (!user.claims || user.claims.length === 0)) {
      return NextResponse.json(
        { error: "Lien de revendication invalide ou expiré" },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur a déjà un mot de passe
    if (user.password_hash) {
      return NextResponse.json(
        { error: "Un mot de passe est déjà défini pour ce compte" },
        { status: 400 }
      )
    }

    console.log('Définition du mot de passe pour l\'utilisateur:', user.id);
    
    // Hacher le mot de passe
    const hashedPassword = await hashPassword(password)
    console.log('Mot de passe haché avec succès');

    // Trouver l'ID du rôle PRO
    const proRole = await prisma.roles.findUnique({
      where: { code: 'PRO' }
    });

    if (!proRole) {
      throw new Error("Rôle PRO non trouvé");
    }

    // Mettre à jour le mot de passe de l'utilisateur
    await prisma.users.update({
      where: { id: user.id },
      data: { 
        password_hash: hashedPassword, 
        updated_at: new Date() 
      },
    });

    // Vérifier si l'utilisateur a déjà le rôle PRO
    const existingRole = await prisma.user_roles.findFirst({
      where: {
        user_id: user.id,
        role_id: proRole.id,
        business_id: claimToken ? {
          in: await prisma.claims.findMany({
            where: { claim_token: claimToken },
            select: { business_id: true }
          }).then(claims => claims.map(c => c.business_id))
        } : undefined
      }
    });

    // Si l'utilisateur n'a pas le rôle PRO, l'ajouter
    if (!existingRole && claimToken) {
      // Récupérer l'ID du business depuis la revendication
      const claim = await prisma.claims.findFirst({
        where: { claim_token: claimToken },
        select: { business_id: true }
      });

      if (claim && claim.business_id) {
        await prisma.user_roles.create({
          data: {
            user_id: user.id,
            role_id: proRole.id,
            business_id: claim.business_id
          }
        });
      }
    }

    console.log('Mot de passe et rôle PRO mis à jour avec succès pour l\'utilisateur:', user.id);

    return NextResponse.json({ 
      ok: true,
      userId: user.id,
      hasPassword: true
    })
  } catch (error) {
    console.error("Erreur lors de la définition du mot de passe:", error)
    return NextResponse.json(
      { error: "Erreur lors de la définition du mot de passe" },
      { status: 500 }
    )
  }
}
