import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomBytes, randomInt } from "crypto";
import { SignJWT, jwtVerify } from "jose";

//  CORRECTION : Utiliser le même nom que le middleware attend
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "__yk_sb_hg";
const SESSION_TTL_SECONDS = Number(process.env.SESSION_TTL_SECONDS || 60 * 60 * 24 * 7); // 7 days
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "default_secret_fallback_12345");

export async function hashPassword(plainPassword: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(plainPassword, salt);
    return hashed;
  } catch (error) {
    console.error('[hashPassword] Erreur lors du hachage du mot de passe:', error);
    throw error;
  }
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    if (!plainPassword || !hashedPassword) {
      console.error('[verifyPassword] Mot de passe ou hash manquant');
      return false;
    }
    
    const isValid = await bcrypt.compare(plainPassword, hashedPassword);
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

export async function createSessionData(userId: string) {
  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const userRoles = await prisma.user_roles.findMany({
        where: { user_id: userId },
        include: { roles: true },
      });
      
      const roles = userRoles.map((ur) => ur.roles.code);
      
      let businessId = "";
      const special = userRoles.find((ur) => ur.business_id === "00000000-0000-0000-0000-000000000000");
      if (special) {
        businessId = special.business_id;
      } else if (userRoles.length > 0) {
        businessId = userRoles[0].business_id;
      }

      // Create JWT token containing session info with unique jti (JWT ID)
      const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
      const jti = randomBytes(16).toString("base64url"); // Unique JWT ID
      
      const token = await new SignJWT({ userId, roles, businessId })
        .setProtectedHeader({ alg: "HS256" })
        .setJti(jti) // Add unique JWT ID to prevent collisions
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(JWT_SECRET);

      console.log(`[Auth] Created session JWT for user: ${userId}, roles: ${roles.join(',')}`)
      
      // Still save to DB for record/revocation if needed
      await prisma.sessions.create({
        data: {
          user_id: userId,
          token: token.substring(0, 255), // Store prefix for lookup if needed, or just let JWT handle it
          expires_at: expiresAt,
        },
      });

      return {
        token,
        expiresAt,
        roleCodes: roles.join(","),
        businessId
      };
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a unique constraint violation on token
      if (error?.code === 'P2002' && error?.meta?.target?.includes('token')) {
        console.warn(`[createSessionData] Token collision on attempt ${attempt + 1}, retrying...`);
        
        // Exponential backoff: wait before retrying
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
          continue;
        }
      }
      
      // For other errors or final retry, throw immediately
      console.error('[createSessionData] Error:', error);
      throw error;
    }
  }

  // If we exhausted all retries
  console.error('[createSessionData] Failed after all retries:', lastError);
  throw lastError;
}

export function setAuthCookies(response: NextResponse, sessionData: { token: string, expiresAt: Date }) {
  const { token, expiresAt } = sessionData;
  const isSecure = process.env.NODE_ENV === "production" && process.env.DISABLE_SECURE_COOKIES !== "true";

  // Session Cookie (Always HttpOnly)
  // This token now contains roles and businessId encrypted/signed
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    expires: expiresAt,
  });

  // SECURITY: NO MORE PLAIN TEXT COOKIES for saas_roles or business_id
  // We explicitly clear them if they exist to clean up the browser
  response.cookies.delete("saas_roles");
  response.cookies.delete("business_id");
  response.cookies.delete("onboarding_done");

  return response;
}

// Deprecated: keeping for backward compatibility if needed temporarily, but should be removed
export async function createSession(userId: string) {
  const data = await createSessionData(userId);
  const response = NextResponse.json({ success: true, message: 'Session créée' });
  return setAuthCookies(response, data);
}

export async function destroySessionFromRequestCookie() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (token) {
    // Only delete from DB if it was a stored session (legacy or JWT prefix)
    const tokenPart = token.substring(0, 255);
    await prisma.sessions.deleteMany({ where: { token: tokenPart } }).catch(() => {});
  }

  const response = NextResponse.json({ ok: true });
  
  // Clear all auth-related cookies
  const isProduction = process.env.NODE_ENV === 'production'
  const isSecure = isProduction && process.env.DISABLE_SECURE_COOKIES !== "true"
  
  const cookieOptions = {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
    expires: new Date(0)
  }
  
  const cookiesToClear = [
    SESSION_COOKIE_NAME,
    "next_auth_session",
    "saas_roles",
    "business_id",
    "onboarding_done"
  ]

  cookiesToClear.forEach(name => {
    response.cookies.set(name, '', cookieOptions)
    response.cookies.delete(name)
  })

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
  
  if (!token) return null;
  
  try {
    // 1. Essayer de récupérer via JWT
    const authData = await getAuthDataFromToken(token);
    if (authData) {
      return await prisma.users.findUnique({ 
        where: { id: authData.userId }
      }).catch((e) => {
        console.error('[getAuthUserFromCookies] Prisma error (JWT):', e);
        return null;
      });
    }

    // 2. Fallback: Vérifier si c'est une session legacy en DB
    const session = await prisma.sessions.findUnique({ 
      where: { token }, 
      include: { users: true } 
    }).catch((e) => {
      console.error('[getAuthUserFromCookies] Prisma error (Legacy):', e);
      return null;
    });
    
    if (session) {
      if (session.expires_at < new Date()) {
        await prisma.sessions.delete({ where: { token } }).catch(() => {});
        return null;
      }
      return session.users;
    }
    
    return null;
  } catch (error) {
    console.error('[getAuthUserFromCookies] Error:', error);
    return null;
  }
}

/**
 * SECURITY: Securely fetch authentication data (roles and business) 
 * from the database using the session token.
 * This is the source of truth for the middleware.
 */
export async function getAuthDataFromToken(token: string) {
  if (!token) return null;

  // 1. Try to verify as JWT (new strategy)
  try {
    if (!token) return null;
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload) {
      console.log(`[Auth] JWT verified for userId: ${payload.userId}`)
      return {
        userId: payload.userId as string,
        roles: payload.roles as string[],
        businessId: payload.businessId as string
      };
    }
  } catch (jwtError: any) {
    console.warn(`[Auth] JWT verification failed: ${jwtError.message}. Secret length: ${JWT_SECRET.length}`)
    // Not a valid JWT or expired, fallback to DB check for legacy sessions (prefix)
    try {
      // In Edge runtime, this part will throw the Prisma error, which is caught below
      // We only use the first 255 chars as prefix lookup for safety
      const tokenPart = token.substring(0, 255);
      const sessions = await prisma.sessions.findMany({
        where: { token: tokenPart },
        include: {
          users: { include: { user_roles: { include: { roles: true } } } }
        },
        take: 1
      });

      const session = sessions[0];
      if (session && session.expires_at > new Date()) {
        const roles = session.users.user_roles.map(ur => ur.roles.code);
        let businessId = "";
        const special = session.users.user_roles.find((ur) => ur.business_id === "00000000-0000-0000-0000-000000000000");
        if (special) businessId = special.business_id;
        else if (session.users.user_roles.length > 0) businessId = session.users.user_roles[0].business_id;

        return { userId: session.user_id, roles, businessId };
      }
    } catch (e) {
      // Silent error for edge compatibility
    }
  }

  return null;
}
