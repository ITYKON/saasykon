import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password || password.length < 8) {
      return NextResponse.json({ error: "Token ou mot de passe invalide" }, { status: 400 });
    }
    const rec = await prisma.password_reset_tokens.findUnique({ where: { token } });
    if (!rec || rec.expires_at < new Date()) {
      return NextResponse.json({ error: "Lien expiré" }, { status: 400 });
    }
    const password_hash = await hashPassword(password);
    await prisma.$transaction([
      prisma.users.update({ where: { id: rec.user_id }, data: { password_hash } }),
      prisma.password_reset_tokens.delete({ where: { token } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


