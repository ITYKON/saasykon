import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ ok: true }); // do not leak

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ ok: true });

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
    await prisma.password_reset_tokens.create({
      data: { user_id: user.id, token, expires_at: expiresAt },
    });

    // TODO: integrate email provider. For now, return token in dev only
    const body: any = { ok: true };
    if (process.env.NODE_ENV !== "production") body.token = token;
    return NextResponse.json(body);
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


