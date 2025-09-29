import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Liste tous les utilisateurs
export async function GET() {
	try {
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
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}

// DELETE: Supprime un utilisateur (soft delete)
export async function DELETE(request: Request) {
	try {
		const { id } = await request.json();
		if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
		await prisma.users.update({
			where: { id },
			data: { deleted_at: new Date() },
		});
		return NextResponse.json({ success: true });
	} catch (e) {
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}

// PUT: Modifie un utilisateur
export async function PUT(request: Request) {
	try {
		const { id, ...data } = await request.json();
		if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
		await prisma.users.update({
			where: { id },
			data,
		});
		return NextResponse.json({ success: true });
	} catch (e) {
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
