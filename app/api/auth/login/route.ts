import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Identifiants requis" }, { status: 400 });
    }
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user || !user.password_hash) {
      // Log failed attempt (no user or no password)
      await prisma.login_attempts.create({
        data: {
          success: false,
          user_id: user?.id ?? null,
          ip_address: undefined,
          user_agent: undefined,
        },
      }).catch(() => {});
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      // Log failed password
      await prisma.login_attempts.create({
        data: {
          success: false,
          user_id: user.id,
          ip_address: undefined,
          user_agent: undefined,
        },
      }).catch(() => {});
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }
    // Log successful login
    await prisma.login_attempts.create({
      data: {
        success: true,
        user_id: user.id,
        ip_address: undefined,
        user_agent: undefined,
      },
    }).catch(() => {});
    // Create session and role/business cookies
    const res = await createSession(user.id);
    // Sync onboarding_done cookie for PRO guard based on DB flag
    try {
      const owned = await prisma.businesses.findMany({ where: { owner_user_id: user.id }, select: { onboarding_completed: true } });
      const done = owned.some((b) => b.onboarding_completed === true);
      const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      if (done) {
        res.cookies.set("onboarding_done", "true", { httpOnly: false, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires });
      } else {
        // ensure it is cleared so middleware redirects to /pro/onboarding
        res.cookies.set("onboarding_done", "", { httpOnly: false, expires: new Date(0), path: "/" });
      }
    } catch {}
    return res;
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


