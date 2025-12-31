import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionData, setAuthCookies } from "@/lib/auth";
import { createHash } from "crypto";

export async function POST(request: Request) {
  try {
    const { email, password, claimToken } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Hacher le token de revendication si fourni
    const tokenHash = claimToken
      ? createHash("sha256").update(claimToken).digest("hex")
      : null;

    // Vérifier si l'utilisateur existe et ses revendications en cours
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        claims: {
          where: {
            status: "pending",
            claim_token: tokenHash ? { equals: tokenHash } : undefined,
            token_expires_at: {
              gte: new Date(),
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Si un token de revendication est fourni, vérifier qu'il est valide
    if (claimToken && (!user.claims || user.claims.length === 0)) {
      return NextResponse.json(
        { error: "Lien de revendication invalide ou expiré" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur a déjà un mot de passe
    if (user.password_hash) {
      return NextResponse.json(
        { error: "Un mot de passe est déjà défini pour ce compte" },
        { status: 400 }
      );
    }

    console.log("Définition du mot de passe pour l'utilisateur:", user.id);

    // Hacher le mot de passe
    const hashedPassword = await hashPassword(password);
    console.log("Mot de passe haché avec succès");

    // Mettre à jour le mot de passe de l'utilisateur
    await prisma.users.update({
      where: { id: user.id },
      data: {
        password_hash: hashedPassword,
        updated_at: new Date(),
      },
    });

    console.log(
      "Mot de passe mis à jour avec succès pour l'utilisateur:",
      user.id
    );

    // Assigner le rôle PRO pour la revendication
    if (claimToken && user.claims && user.claims.length > 0) {
      const claim = user.claims[0];
      const proRole = await prisma.roles.findUnique({ where: { code: "PRO" } });
      if (proRole) {
        await prisma.user_roles.upsert({
          where: {
            user_id_role_id_business_id: {
              user_id: user.id,
              role_id: proRole.id,
              business_id: claim.business_id,
            } as any,
          },
          update: {},
          create: {
            user_id: user.id,
            role_id: proRole.id,
            business_id: claim.business_id,
          },
        } as any);
        console.log("Rôle PRO assigné pour la revendication");
      }
    }

    // Créer une session pour l'utilisateur
    const sessionData = await createSessionData(user.id);
    const response = NextResponse.json({
      ok: true,
      userId: user.id,
      hasPassword: true,
    });
    return setAuthCookies(response, sessionData);


  } catch (error) {
    console.error("Erreur lors de la définition du mot de passe:", error);
    return NextResponse.json(
      { error: "Erreur lors de la définition du mot de passe" },
      { status: 500 }
    );
  }
}
