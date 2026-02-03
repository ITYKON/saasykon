import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionData, setAuthCookies } from "@/lib/auth";

// Fonction pour enregistrer une tentative de connexion échouée
async function logFailedLoginAttempt(userId: string | null, email: string) {
  try {
    await prisma.login_attempts.create({
      data: {
        success: false,
        user_id: userId,
        ip_address: '',
        user_agent: '',
      },
    });
    await prisma.login_attempts.create({
      data: {
        success: false,
        user_id: userId,
        ip_address: '',
        user_agent: '',
      },
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la tentative échouée:', error);
  }
}

// Fonction pour enregistrer une connexion réussie
async function logSuccessfulLogin(userId: string, email: string) {
  try {
    await prisma.login_attempts.create({
      data: {
        success: true,
        user_id: userId,
        ip_address: '',
        user_agent: '',
      },
    });
    await prisma.login_attempts.create({
      data: {
        success: true,
        user_id: userId,
        ip_address: '',
        user_agent: '',
      },
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la connexion réussie:', error);
  }
}

export async function POST(request: Request) {
  try {
    //  CORRECTION : Protection contre les erreurs de parsing JSON
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Erreur de parsing JSON:', parseError);
      return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
    }
    
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json({ error: "Identifiants requis" }, { status: 400 });
    }
    
    const user = await prisma.users.findUnique({ 
      where: { email },
      include: {
        user_roles: {
          include: {
            roles: true
          }
        }
      }
    });
    
    if (!user) {
      await logFailedLoginAttempt(null, email);
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }
    
    if (!user.password_hash) {
      await logFailedLoginAttempt(user.id, email);
      return NextResponse.json({ error: "Veuvez d'abord définir votre mot de passe" }, { status: 401 });
    }
    const ok = await verifyPassword(password, user.password_hash || '');
    
    if (!ok) {
      
      await logFailedLoginAttempt(user.id, email);
      return NextResponse.json({ 
        error: "Identifiants invalides",
        details: {
          hasPassword: !!user.password_hash,
          passwordLength: password?.length
        }
      }, { status: 401 });
    }
    

    // Log successful login
    await logSuccessfulLogin(user.id, email);
    
    // Lazy Role Assignment Fallback for Legacy Users
    try {
      const [assignments, owned, clientRole, proRole] = await Promise.all([
        prisma.user_roles.findMany({ where: { user_id: user.id }, include: { roles: true } }),
        prisma.businesses.findMany({ where: { owner_user_id: user.id }, select: { id: true } }),
        prisma.roles.findUnique({ where: { code: "CLIENT" } }),
        prisma.roles.findUnique({ where: { code: "PRO" } }),
      ]);

      const SPECIAL_SYSTEM_BUSINESS_ID = "00000000-0000-0000-0000-000000000000";

      // 1. If NO ROLES AT ALL, assign CLIENT role
      if (assignments.length === 0 && clientRole) {
        console.log(`[Login] Lazy assigning CLIENT role to user ${user.id}`);
        await prisma.user_roles.create({
          data: {
            user_id: user.id,
            role_id: clientRole.id,
            business_id: SPECIAL_SYSTEM_BUSINESS_ID,
          },
        });
      }

      // 1b. Ensure CLIENT record exists for all users with CLIENT role
      const hasClientRole = assignments.some(a => a.roles.code === "CLIENT") || (assignments.length === 0 && clientRole);
      if (hasClientRole) {
        const clientProfile = await prisma.clients.findFirst({ where: { user_id: user.id } });
        if (!clientProfile) {
          console.log(`[Login] Lazy creating client profile for user ${user.id}`);
          await prisma.clients.create({
            data: {
              user_id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              phone: user.phone,
              status: 'NOUVEAU',
            }
          });
        }
      }

      // 2. If user owns businesses but has no PRO role, auto-assign PRO
      const hasPRO = assignments.some((a) => a.roles.code === "PRO");
      if (!hasPRO && proRole && owned.length > 0) {
        console.log(`[Login] Lazy assigning PRO role(s) to user ${user.id}`);
        for (const b of owned) {
          await prisma.user_roles.upsert({
            where: { user_id_role_id_business_id: { user_id: user.id, role_id: proRole.id, business_id: b.id } as any },
            update: {},
            create: { user_id: user.id, role_id: proRole.id, business_id: b.id },
          } as any);
        }
      }
    } catch (e) {
      console.error('[Login] Error in lazy role assignment fallback:', e);
    }

    // Create session data (NOW with the updated roles)
    const sessionData = await createSessionData(user.id);
    
    // Create response
    const response = NextResponse.json({ 
      success: true, 
      message: 'Connexion réussie',
      user: {
        roles: sessionData.roleCodes.split(',')
      }
    });
    
    // Set auth cookies on response
    setAuthCookies(response, sessionData);
    
    return response;
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}