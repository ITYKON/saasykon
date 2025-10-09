import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "saas_session";

export async function GET() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ user: null }, { status: 200 });
  const session = await prisma.sessions.findUnique({ where: { token }, include: { users: true } });
  if (!session || session.expires_at < new Date()) return NextResponse.json({ user: null }, { status: 200 });
  // Load user's role assignments and their permissions
  const userRoles = await prisma.user_roles.findMany({
    where: { user_id: session.user_id },
    include: { roles: { include: { role_permissions: { include: { permissions: true } } } } },
  });

  // Aggregate role codes and permissions (unique)
  const roleCodes = userRoles.map((r) => r.roles.code);
  const permissionSet = new Set<string>();
  userRoles.forEach((ur) => {
    ur.roles.role_permissions.forEach((rp) => {
      if (rp.permissions?.code) permissionSet.add(rp.permissions.code);
    });
  });

  return NextResponse.json({
    user: {
      id: session.user_id,
      email: session.users.email,
      first_name: session.users.first_name,
      last_name: session.users.last_name,
      phone: session.users.phone,
      avatar_url: session.users.avatar_url,
      roles: roleCodes,
      permissions: Array.from(permissionSet),
      // also expose role assignments so the client knows which business each role belongs to
      assignments: userRoles.map((ur) => ({ role: ur.roles.code, business_id: ur.business_id })),
    },
  });
}


