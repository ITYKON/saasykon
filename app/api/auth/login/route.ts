import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";

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
    console.log(`Tentative de connexion échouée pour l'utilisateur: ${userId || 'inconnu'}, email: ${email}`);
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
    console.log(`Connexion réussie pour l'utilisateur: ${userId}, email: ${email}`);
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la connexion réussie:', error);
  }
}

export async function POST(request: Request) {
  console.log('Début de la tentative de connexion');
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
    console.log('Tentative de connexion pour l\'email:', email);
    
    if (!email || !password) {
      console.log('Email ou mot de passe manquant');
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
    
    console.log('Utilisateur trouvé dans la base de données:', user ? 'Oui' : 'Non');
    
    if (!user) {
      console.log('Aucun utilisateur trouvé avec cet email');
      await logFailedLoginAttempt(null, email);
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }
    
    if (!user.password_hash) {
      console.log('L\'utilisateur n\'a pas de mot de passe défini');
      await logFailedLoginAttempt(user.id, email);
      return NextResponse.json({ error: "Veuvez d'abord définir votre mot de passe" }, { status: 401 });
    }
    console.log('Vérification du mot de passe...');
    console.log(`Données de l'utilisateur:`, {
      userId: user.id,
      hasPassword: !!user.password_hash,
      passwordLength: user.password_hash?.length
    });
    
    const ok = await verifyPassword(password, user.password_hash || '');
    
    if (!ok) {
      console.log('Échec de la vérification du mot de passe');
      console.log(`Détails de la vérification:`, {
        passwordProvided: !!password,
        passwordLength: password?.length,
        storedHash: user.password_hash ? 'Présent' : 'Manquant',
        storedHashLength: user.password_hash?.length
      });
      
      await logFailedLoginAttempt(user.id, email);
      return NextResponse.json({ 
        error: "Identifiants invalides",
        details: {
          hasPassword: !!user.password_hash,
          passwordLength: password?.length
        }
      }, { status: 401 });
    }
    
    console.log('Mot de passe valide, création de la session...');
    // Log successful login
    await logSuccessfulLogin(user.id, email);
    
    console.log('Création de la session pour l\'utilisateur ID:', user.id);
    //  CORRECTION : Créer la session et obtenir la réponse avec cookies
    const sessionResponse = await createSession(user.id);
    console.log('Session créée avec succès');
    
    //  CORRECTION : Créer une nouvelle réponse qui combine le succès et les cookies
    const response = NextResponse.json({ success: true, message: 'Connexion réussie' });
    
    // Copier les cookies de la session vers la réponse finale
    const cookies = sessionResponse.headers.get('set-cookie');
    if (cookies) {
      response.headers.set('set-cookie', cookies);
    }
    
    // Sync onboarding_done cookie for PRO guard based on DB flag
    try {
      console.log('Vérification de l\'onboarding pour l\'utilisateur ID:', user.id);
      const owned = await prisma.businesses.findMany({ 
        where: { owner_user_id: user.id }, 
        select: { onboarding_completed: true } 
      });
      
      console.log('Entreprises trouvées pour l\'utilisateur:', owned);
      const done = owned.some((b) => b.onboarding_completed === true);
      const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      
      console.log('Onboarding status:', done ? 'Complété' : 'Non complété');
      
      if (done) {
        response.cookies.set("onboarding_done", "true", { 
          httpOnly: false, 
          sameSite: "lax", 
          secure: process.env.NODE_ENV === 'production', 
          path: "/", 
          expires 
        });
        console.log('Cookie onboarding_done défini à true');
      } else {
        // ensure it is cleared so middleware redirects to /pro/onboarding
        response.cookies.set("onboarding_done", "false", { 
          httpOnly: false, 
          sameSite: "lax", 
          secure: process.env.NODE_ENV === 'production', 
          path: "/", 
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 jour
        });
        console.log('Cookie onboarding_done défini à false');
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
        console.log('Définition du business_id:', businessId);
      }
    } catch {}
    
    console.log('Réponse envoyée avec cookies');
    return response;
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}