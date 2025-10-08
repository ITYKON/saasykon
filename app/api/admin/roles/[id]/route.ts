import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrPermission } from "@/lib/authorization";

export async function GET(_req: Request, context: { params: { id: string } }) {
  const authCheck = await requireAdminOrPermission("roles");
  if (authCheck instanceof NextResponse) return authCheck;
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



