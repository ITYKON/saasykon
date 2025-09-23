import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "saas_session";

export async function GET() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ user: null }, { status: 200 });
  const session = await prisma.sessions.findUnique({ where: { token }, include: { users: true } });
  if (!session || session.expires_at < new Date()) return NextResponse.json({ user: null }, { status: 200 });
  const roles = await prisma.user_roles.findMany({ where: { user_id: session.user_id }, include: { roles: true } });
  return NextResponse.json({
    user: {
      id: session.user_id,
      email: session.users.email,
      first_name: session.users.first_name,
      last_name: session.users.last_name,
      roles: roles.map((r) => r.roles.code),
    },
  });
}


