import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password, phone, first_name, last_name } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Mot de passe trop court (min 8)" }, { status: 400 });
    }
    if (first_name && typeof first_name !== "string") {
      return NextResponse.json({ error: "Prénom invalide" }, { status: 400 });
    }
    if (last_name && typeof last_name !== "string") {
      return NextResponse.json({ error: "Nom invalide" }, { status: 400 });
    }

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email déjà utilisé" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.users.create({
      data: {
        email,
        phone: phone ?? null,
        password_hash: passwordHash,
        first_name: first_name ?? null,
        last_name: last_name ?? null,
      },
    });

    return await createSession(user.id);
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


