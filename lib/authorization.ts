import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAuthDataFromToken } from "@/lib/auth";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "__yk_sb_hg";

export type AuthContext = {
  userId: string;
  roles: string[];
  permissions: string[];
  assignments: Array<{ role: string; business_id: string }>;
  businessId?: string;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const cookieStore = cookies();
  const customToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  // 1. Try Custom Session (JWT)
  if (customToken) {
    const authData = await getAuthDataFromToken(customToken);
    if (authData) {
      const { userId, roles, businessId } = authData;
      const userRoles = await prisma.user_roles.findMany({
        where: { user_id: userId },
        include: { roles: { include: { role_permissions: { include: { permissions: true } } } } },
      });

      const permissionSet = new Set<string>();
      userRoles.forEach((ur: any) => {
        ur.roles.role_permissions.forEach((rp: any) => {
          if (rp.permissions?.code) permissionSet.add(rp.permissions.code);
        });
      });

      const assignments = userRoles.map((ur: any) => ({ role: ur.roles.code, business_id: ur.business_id }));
      return { userId, roles, permissions: Array.from(permissionSet), assignments, businessId };
    }
  }

  // 2. Try NextAuth JWT
  const nextAuthToken = await getToken({ 
    req: { cookies: Object.fromEntries(cookieStore.getAll().map(c => [c.name, c.value])) } as any,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: "next_auth_session"
  });

  if (nextAuthToken) {
    const userId = nextAuthToken.id as string;
    const roles = (nextAuthToken.roles as string[]) || [];
    const businessId = nextAuthToken.businessId as string;

    const userRoles = await prisma.user_roles.findMany({
      where: { user_id: userId },
      include: { roles: { include: { role_permissions: { include: { permissions: true } } } } },
    });

    const permissionSet = new Set<string>();
    userRoles.forEach((ur: any) => {
      ur.roles.role_permissions.forEach((rp: any) => {
        if (rp.permissions?.code) permissionSet.add(rp.permissions.code);
      });
    });

    const assignments = userRoles.map((ur: any) => ({ role: ur.roles.code, business_id: ur.business_id }));
    return { userId, roles, permissions: Array.from(permissionSet), assignments, businessId };
  }

  return null;
}

/**
 * Require either ADMIN role or a specific permission code.
 * Returns AuthContext on success, or a NextResponse (401/403) that the caller should return.
 */
export async function requireAdminOrPermission(permission?: string) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.roles.includes("ADMIN")) return ctx;
  if (permission && ctx.permissions.includes(permission)) return ctx;
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export default { getAuthContext, requireAdminOrPermission };
