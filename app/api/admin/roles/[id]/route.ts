import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, context: { params: { id: string } }) {
  try {
    const idNum = Number(context.params.id);
    if (!idNum || Number.isNaN(idNum)) {
      return NextResponse.json({ error: "Paramètre id invalide" }, { status: 400 });
    }

    const role = await prisma.roles.findUnique({
      where: { id: idNum },
      include: { role_permissions: { include: { permissions: true } }, user_roles: true },
    });

    if (!role) {
      return NextResponse.json({ error: "Rôle introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      role: {
        id: role.id,
        code: role.code,
        name: role.name,
        permissions: role.role_permissions.map((rp) => rp.permissions.code),
        usersCount: role.user_roles.length,
      },
    });
  } catch (e) {
    console.error("[GET /api/admin/roles/:id] Error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}



