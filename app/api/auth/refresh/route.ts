import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "saas_session";
const SESSION_TTL_SECONDS = Number(process.env.SESSION_TTL_SECONDS || 60 * 60 * 24 * 7);

export async function POST() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ refreshed: false }, { status: 200 });
  const session = await prisma.sessions.findUnique({ where: { token } });
  if (!session) return NextResponse.json({ refreshed: false }, { status: 200 });

  const newExpiry = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await prisma.sessions.update({ where: { token }, data: { expires_at: newExpiry } });

  const res = NextResponse.json({ refreshed: true, expires_at: newExpiry.toISOString() });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: newExpiry,
    path: "/",
  });
  return res;
}


