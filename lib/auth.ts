import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "saas_session";
const SESSION_TTL_SECONDS = Number(process.env.SESSION_TTL_SECONDS || 60 * 60 * 24 * 7); // 7 days

export async function hashPassword(plainPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plainPassword, salt);
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createSession(userId: string) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await prisma.sessions.create({
    data: {
      user_id: userId,
      token,
      expires_at: expiresAt,
    },
  });

  const cookieValue = token;
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });

  // Also set a readable roles cookie for middleware/client redirects
  const userRoles = await prisma.user_roles.findMany({
    where: { user_id: userId },
    include: { roles: true },
  });
  
  const roleCodes = userRoles.map((ur) => ur.roles.code).join(",");
  
  response.cookies.set("saas_roles", roleCodes, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
  
  // Set business_id cookie for middleware
  // If user has ANY role with business_id '00000000-0000-0000-0000-000000000000', use that; otherwise first business_id
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
      expires: expiresAt,
      path: "/",
    });
  }
  return response;
}

export async function destroySessionFromRequestCookie() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await prisma.sessions.delete({ where: { token } }).catch(() => {});
  }
  const res = NextResponse.json({ ok: true });
  // Suppression du cookie pour tous les chemins et domaines
  res.cookies.set(SESSION_COOKIE_NAME, "", { httpOnly: true, expires: new Date(0), path: "/" });
  res.cookies.set(SESSION_COOKIE_NAME, "", { httpOnly: true, expires: new Date(0), path: "/", domain: getRequestDomain() });
  res.cookies.set("saas_roles", "", { httpOnly: false, expires: new Date(0), path: "/" });
  res.cookies.set("saas_roles", "", { httpOnly: false, expires: new Date(0), path: "/", domain: getRequestDomain() });
  return res;
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
  const session = await prisma.sessions.findUnique({ where: { token }, include: { users: true } }).catch(() => null);
  if (!session || session.expires_at < new Date()) return null;
  return session.users;
}


