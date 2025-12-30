import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomBytes, randomInt } from "crypto";

//  CORRECTION : Utiliser le même nom que le middleware attend
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session_token";
const SESSION_TTL_SECONDS = Number(process.env.SESSION_TTL_SECONDS || 60 * 60 * 24 * 7); // 7 days

export async function hashPassword(plainPassword: string): Promise<string> {
  console.log('[hashPassword] Hachage du mot de passe...');
  try {
    const salt = await bcrypt.genSalt(10);
    console.log('[hashPassword] Sel généré');
    const hashed = await bcrypt.hash(plainPassword, salt);
    console.log('[hashPassword] Mot de passe haché avec succès');
    return hashed;
  } catch (error) {
    console.error('[hashPassword] Erreur lors du hachage du mot de passe:', error);
    throw error;
  }
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  console.log('[verifyPassword] Vérification du mot de passe...');
  try {
    if (!plainPassword || !hashedPassword) {
      console.error('[verifyPassword] Mot de passe ou hash manquant');
      return false;
    }
    
    const isValid = await bcrypt.compare(plainPassword, hashedPassword);
    console.log(`[verifyPassword] Résultat de la vérification: ${isValid ? 'Valide' : 'Invalide'}`);
    return isValid;
  } catch (error) {
    console.error('[verifyPassword] Erreur lors de la vérification du mot de passe:', error);
    return false;
  }
}

export function generateTemporaryPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
  
  // Assurez-vous que le mot de passe contient au moins un caractère de chaque type
  let password = [
    uppercase[randomInt(uppercase.length)],
    lowercase[randomInt(lowercase.length)],
    numbers[randomInt(numbers.length)],
    special[randomInt(special.length)]
  ];
  
  // Remplir le reste du mot de passe avec des caractères aléatoires
  const allChars = uppercase + lowercase + numbers + special;
  while (password.length < length) {
    password.push(allChars[randomInt(allChars.length)]);
  }
  
  // Mélanger le mot de passe
  for (let i = password.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }
  
  return password.join('');
}

function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createSession(userId: string) {
  console.log('[createSession] Début création session pour userId:', userId);
  
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  try {
    await prisma.sessions.create({
      data: {
        user_id: userId,
        token,
        expires_at: expiresAt,
      },
    });
    console.log('[createSession] Session créée en base pour userId:', userId);
  } catch (error) {
    console.error('[createSession] Erreur création session:', error);
    throw error;
  }

  //  CORRECTION : Utiliser un NextResponse.json() pour bien définir les cookies
  const response = NextResponse.json({ success: true, message: 'Session créée' });
  
  //  CORRECTION : Utiliser l'expiration correcte et les bons attributs
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  console.log('[createSession] Cookie session défini:', SESSION_COOKIE_NAME, '=', token);

  // Also set a readable roles cookie for middleware/client redirects
  try {
    const userRoles = await prisma.user_roles.findMany({
      where: { user_id: userId },
      include: { roles: true },
    });
    
    const roleCodes = userRoles.map((ur) => ur.roles.code).join(",");
    
    response.cookies.set("saas_roles", roleCodes, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });
    console.log('[createSession] Cookie roles défini:', roleCodes);
    
    // Set business_id cookie for middleware
    let businessId = "";
    const special = userRoles.find((ur) => ur.business_id === "00000000-0000-0000-0000-000000000000");
    
    if (special) {
      businessId = special.business_id;
    } else if (userRoles.length > 0) {
      businessId = userRoles[0].business_id;
    }
    
    if (businessId) {
      response.cookies.set("business_id", businessId, {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        expires: expiresAt,
      });
      console.log('[createSession] Cookie business_id défini:', businessId);
    }
  } catch (error) {
    console.error('[createSession] Erreur création cookies roles/business:', error);
  }
  
  return response;
}

export async function destroySessionFromRequestCookie() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (token) {
    await prisma.sessions.delete({ where: { token } }).catch(() => {});
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const domain = isProduction ? '.railway.app' : 'localhost';
  
  const response = NextResponse.json({ ok: true });
  
  // Suppression du cookie de session
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    domain: isProduction ? domain : undefined,
    expires: new Date(0)
  });

  // Suppression du cookie des rôles
  response.cookies.set('saas_roles', '', {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    domain: isProduction ? domain : undefined,
    expires: new Date(0)
  });

  // Suppression du cookie business_id
  response.cookies.set('business_id', '', {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    domain: isProduction ? domain : undefined,
    expires: new Date(0)
  });

  return response;
}

function getRequestDomain() {
  // Pour Next.js API routes, on se base sur les variables d'env de déploiement
  const host = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.HOST || "localhost";
  return host.replace(/^https?:\/\//, "").replace(/:\d+$/, "");
}

export async function getAuthUserFromCookies() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!token) {
    console.log('[getAuthUserFromCookies] Aucun token trouvé');
    return null;
  }
  
  try {
    const session = await prisma.sessions.findUnique({ 
      where: { token }, 
      include: { users: true } 
    }).catch(() => null);
    
    if (!session) {
      console.log('[getAuthUserFromCookies] Session non trouvée');
      return null;
    }
    
    if (session.expires_at < new Date()) {
      console.log('[getAuthUserFromCookies] Session expirée');
      await prisma.sessions.delete({ where: { token } }).catch(() => {});
      return null;
    }
    
    console.log('[getAuthUserFromCookies] Utilisateur authentifié:', session.users.id);
    return session.users;
  } catch (error) {
    console.error('[getAuthUserFromCookies] Erreur:', error);
    return null;
  }
}