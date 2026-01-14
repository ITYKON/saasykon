import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionData, setAuthCookies } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

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
    // Rate limiting: 5 attempts per 15 minutes per IP
    const clientIp = getClientIp(request);
    const rateLimitKey = `login:${clientIp}`;
    const rateLimitResult = rateLimit(rateLimitKey, 5, 15 * 60 * 1000); // 15 minutes
    
    if (!rateLimitResult.ok) {
      const retryAfterSeconds = Math.ceil(rateLimitResult.retryAfterMs! / 1000);
      return NextResponse.json(
        { error: "Trop de tentatives de connexion. Veuillez réessayer plus tard." },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfterSeconds.toString()
          }
        }
      );
    }
    
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
    
    await logSuccessfulLogin(user.id, email);
    
    // Create session data
    const sessionData = await createSessionData(user.id);
    
    // Create response
    const response = NextResponse.json({ success: true, message: 'Connexion réussie' });
    
    // Set auth cookies on response
    setAuthCookies(response, sessionData);
    
    // Sync onboarding_done cookie for PRO guard based on DB flag
    try {
      const owned = await prisma.businesses.findMany({ 
        where: { owner_user_id: user.id }, 
        select: { onboarding_completed: true } 
      });
      const done = owned.some((b) => b.onboarding_completed === true);
      const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      
      if (done) {
        response.cookies.set("onboarding_done", "true", { 
          httpOnly: false, 
          sameSite: "lax", 
          secure: process.env.NODE_ENV === 'production', 
          path: "/", 
          expires 
        });
      } else {
        // ensure it is cleared so middleware redirects to /pro/onboarding
        response.cookies.set("onboarding_done", "false", { 
          httpOnly: false, 
          sameSite: "lax", 
          secure: process.env.NODE_ENV === 'production', 
          path: "/", 
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 jour
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'onboarding:', error);
    }
    
    // Fallback: if user owns businesses but has no PRO role, auto-assign PRO
    try {
      const [assignments, owned, proRole] = await Promise.all([
        prisma.user_roles.findMany({ where: { user_id: user.id }, include: { roles: true } }),
        prisma.businesses.findMany({ where: { owner_user_id: user.id }, select: { id: true } }),
        prisma.roles.findUnique({ where: { code: "PRO" } }),
      ]);
      const hasPRO = assignments.some((a) => a.roles.code === "PRO");
      if (!hasPRO && proRole && owned.length) {
        for (const b of owned) {
          await prisma.user_roles.upsert({
            where: { user_id_role_id_business_id: { user_id: user.id, role_id: proRole.id, business_id: b.id } as any },
            update: {},
            create: { user_id: user.id, role_id: proRole.id, business_id: b.id },
          } as any);
        }
        // refresh roles cookie
        const refreshed = await prisma.user_roles.findMany({ where: { user_id: user.id }, include: { roles: true } });
        const roleCodes = refreshed.map((ur) => ur.roles.code).join(",");
        const expiresAt = new Date(Date.now() + (Number(process.env.SESSION_TTL_SECONDS || 60 * 60 * 24 * 7)) * 1000);
        response.cookies.set("saas_roles", roleCodes, { httpOnly: false, sameSite: "lax", secure: process.env.NODE_ENV === "production", expires: expiresAt, path: "/" });
      }
      
      // Définir le business_id pour les utilisateurs PRO
      const userRoles = assignments.map(ur => ur.roles.code);
      if (userRoles.includes('PRO') && owned.length > 0) {
        const businessId = owned[0].id; // Prend le premier business de la liste
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 jours
        response.cookies.set("business_id", businessId, {
          httpOnly: false,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          expires: expiresAt,
          path: "/",
        });
      }
    } catch {}
    

    return response;
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}