import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrPermission } from "@/lib/authorization";
import { z } from "zod";

import { assignSchema, unassignSchema } from "./schemas";

export async function POST(req: Request) {
    try {
      const authCheck = await requireAdminOrPermission("roles");
      if (authCheck instanceof NextResponse) return authCheck;
    const body = await req.json();
    const parse = assignSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: "Validation error", details: parse.error }, { status: 400 });
    }
    let { email, roleCode, business_id } = parse.data;

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const role = await prisma.roles.findUnique({ where: { code: roleCode } });
    if (!role) {
      return NextResponse.json({ error: "Rôle introuvable" }, { status: 404 });
    }

    if (!business_id) {
      const anyBiz = await prisma.businesses.findFirst();
      if (!anyBiz) {
        return NextResponse.json({ error: "Aucun business trouvé pour associer le rôle (business_id requis)" }, { status: 400 });
      }
      business_id = anyBiz.id;
    }

    const already = await prisma.user_roles.findFirst({ where: { user_id: user.id, role_id: role.id, business_id } });
    if (already) {
      return NextResponse.json({ error: "Rôle déjà assigné à cet utilisateur" }, { status: 409 });
    }

    await prisma.user_roles.create({ data: { user_id: user.id, role_id: role.id, business_id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[POST /api/admin/roles/assign] Erreur:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
    try {
      const authCheck = await requireAdminOrPermission("roles");
      if (authCheck instanceof NextResponse) return authCheck;
    const body = await req.json().catch(() => ({}));
    const parse = unassignSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: "Validation error", details: parse.error }, { status: 400 });
    }
    const { email, roleCode, business_id } = parse.data;

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const role = await prisma.roles.findUnique({ where: { code: roleCode } });
    if (!role) {
      return NextResponse.json({ error: "Rôle introuvable" }, { status: 404 });
    }

    const existing = await prisma.user_roles.findFirst({ where: { user_id: user.id, role_id: role.id, business_id } });
    if (!existing) {
      return NextResponse.json({ error: "Aucune attribution trouvée" }, { status: 404 });
    }

    await prisma.user_roles.delete({ where: { user_id_role_id_business_id: { user_id: user.id, role_id: role.id, business_id } } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[DELETE /api/admin/roles/assign] Erreur:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}



