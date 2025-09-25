import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "saas_session";

export async function GET() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ user: null }, { status: 200 });
  const session = await prisma.sessions.findUnique({ where: { token }, include: { users: true } });
  if (!session || session.expires_at < new Date()) return NextResponse.json({ user: null }, { status: 200 });
  const [roles, ownedBusinesses] = await Promise.all([
    prisma.user_roles.findMany({ where: { user_id: session.user_id }, include: { roles: true } }),
    prisma.businesses.findMany({ where: { owner_user_id: session.user_id }, select: { id: true } }),
  ]);
  const explicit = roles.map((r) => r.roles.code);
  const isAdmin = explicit.includes("ADMIN");
  const isPro = explicit.includes("PRO") || ownedBusinesses.length > 0;
  const computed = isAdmin ? ["ADMIN", "PRO"] : isPro ? ["PRO"] : ["CLIENT"];
  const roleList = Array.from(new Set([...explicit, ...computed]));
  const res = NextResponse.json({
    user: {
      id: session.user_id,
      email: session.users.email,
      first_name: session.users.first_name,
      last_name: session.users.last_name,
      roles: roleList,
    },
  });
  // Sync readable roles cookie when missing or outdated
  const rolesCookie = cookies().get("saas_roles")?.value || "";
  if (rolesCookie.split(",").sort().join(",") !== roleList.sort().join(",")) {
    res.cookies.set("saas_roles", roleList.join(","), {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: session.expires_at,
      path: "/",
    });
  }
  return res;
}


