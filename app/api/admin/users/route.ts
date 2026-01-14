import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrPermission } from "@/lib/authorization";

// GET: Liste tous les utilisateurs
export async function GET() {
		try {
			const authCheck = await requireAdminOrPermission("users");
			if (authCheck instanceof NextResponse) return authCheck;
			const users = await prisma.users.findMany({
				where: { deleted_at: null },
				orderBy: { created_at: "desc" },
				include: {
					user_roles: {
						include: {
							roles: true
						}
					}
				}
			});

			return NextResponse.json({ users });
		} catch (e) {
			console.error("[GET /api/admin/users] Erreur:", e);
			return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
		}
}

// DELETE: Supprime un utilisateur (soft delete)
export async function DELETE(request: Request) {
		try {
			const authCheck = await requireAdminOrPermission("users");
			if (authCheck instanceof NextResponse) return authCheck;
			const body = await request.json().catch(() => ({} as any));
			const rawId = body.id ?? body.userId ?? body.user_id
			const id = rawId !== undefined && rawId !== null ? String(rawId) : null
			if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
			try {
				const result = await prisma.users.update({
					where: { id },
					data: { deleted_at: new Date() },
				});
				return NextResponse.json({ success: true, user: result });
			} catch (err: any) {
				// Prisma 'record not found' error (P2025) -> return 404
				if (err?.code === 'P2025') {
					console.warn('[DELETE /api/admin/users] utilisateur non trouvé:', id)
					return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
				}
				console.error("[DELETE /api/admin/users] Erreur Prisma:", err)
				return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
			}
		} catch (e) {
			console.error("[DELETE /api/admin/users] Erreur:", e);
			return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
		}
}

// PUT: Modifie un utilisateur
export async function PUT(request: Request) {
		try {
			const authCheck = await requireAdminOrPermission("users");
			if (authCheck instanceof NextResponse) return authCheck;
			const { id, ...data } = await request.json();
			if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
			const result = await prisma.users.update({
				where: { id },
				data,
			});
			return NextResponse.json({ success: true });
		} catch (e) {
			console.error("[PUT /api/admin/users] Erreur:", e);
			return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
		}
}
