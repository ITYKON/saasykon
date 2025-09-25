import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password, context } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Identifiants requis" }, { status: 400 });
    }
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user || !user.password_hash) {
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }
    // Enforce interface context: if pro context, only PRO or ADMIN can login here
    if (String(context || "").toLowerCase() === "pro") {
      const [roles, owned] = await Promise.all([
        prisma.user_roles.findMany({ where: { user_id: user.id }, include: { roles: true } }),
        prisma.businesses.findMany({ where: { owner_user_id: user.id }, select: { id: true } }),
      ]);
      const explicit = roles.map((r) => r.roles.code);
      const isAdmin = explicit.includes("ADMIN");
      const isPro = explicit.includes("PRO") || owned.length > 0;
      if (!isAdmin && !isPro) {
        return NextResponse.json(
          { error: "Cet espace est réservé aux professionnels. Veuillez vous connecter via Mon Compte." },
          { status: 403 }
        );
      }
    }
    return await createSession(user.id);
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


