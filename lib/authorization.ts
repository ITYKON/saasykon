import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "saas_session";

export type AuthContext = {
  userId: string;
  roles: string[];
  permissions: string[];
  assignments: Array<{ role: string; business_id: string }>;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await prisma.sessions.findUnique({ where: { token } }).catch(() => null);
  if (!session || session.expires_at < new Date()) return null;

  const userId = session.user_id;
  const userRoles = await prisma.user_roles.findMany({
    where: { user_id: userId },
    include: { roles: { include: { role_permissions: { include: { permissions: true } } } } },
  });

  const roles = userRoles.map((r) => r.roles.code);
  const permissionSet = new Set<string>();
  userRoles.forEach((ur) => {
    ur.roles.role_permissions.forEach((rp) => {
      if (rp.permissions?.code) permissionSet.add(rp.permissions.code);
    });
  });

  const assignments = userRoles.map((ur) => ({ role: ur.roles.code, business_id: ur.business_id }));

  return { userId, roles, permissions: Array.from(permissionSet), assignments };
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
