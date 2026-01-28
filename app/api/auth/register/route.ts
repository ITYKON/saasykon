import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionData, setAuthCookies } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { email, password, phone, first_name, last_name } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Mot de passe trop court (min 8)" }, { status: 400 });
    }
    if (first_name && typeof first_name !== "string") {
      return NextResponse.json({ error: "Prénom invalide" }, { status: 400 });
    }
    if (last_name && typeof last_name !== "string") {
      return NextResponse.json({ error: "Nom invalide" }, { status: 400 });
    }

    // Check for existing email
    const existingEmail = await prisma.users.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ 
        error: "Cet email est déjà utilisé", 
        field: "email" 
      }, { status: 409 });
    }

    // Check for existing phone if provided
    if (phone) {
      const existingPhone = await prisma.users.findFirst({ where: { phone } });
      if (existingPhone) {
        return NextResponse.json({ 
          error: "Ce numéro de téléphone est déjà utilisé", 
          field: "phone" 
        }, { status: 409 });
      }
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.users.create({
      data: {
        email,
        phone: phone ?? null,
        password_hash: passwordHash,
        first_name: first_name ?? null,
        last_name: last_name ?? null,
      },
    });

    // Automatically assign CLIENT role & create client record
    try {
      const SPECIAL_ADMIN_BUSINESS_ID = "00000000-0000-0000-0000-000000000000";
      const clientRole = await prisma.roles.findUnique({ where: { code: "CLIENT" } });
      if (clientRole) {
        await prisma.user_roles.create({
          data: {
            user_id: user.id,
            role_id: clientRole.id,
            business_id: SPECIAL_ADMIN_BUSINESS_ID,
          },
        });

        // Also create the actual client record for the dashboard
        await prisma.clients.create({
          data: {
            user_id: user.id,
            first_name: first_name ?? null,
            last_name: last_name ?? null,
            phone: phone ?? null,
            status: 'NOUVEAU',
          }
        });
      }
    } catch (roleError) {
      console.error('[register] Erreur lors de l\'attribution du rôle CLIENT ou création du record:', roleError);
      // Non-blocking for registration success
    }

    const sessionData = await createSessionData(user.id);
    const response = NextResponse.json({ success: true, message: 'Compte créé avec succès' });
    return setAuthCookies(response, sessionData);
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: `Erreur lors de la création du compte: ${error.message}` 
      }, { status: 500 });
    }
    return NextResponse.json({ 
      error: "Une erreur inattendue est survenue lors de la création du compte" 
    }, { status: 500 });
  }
}


