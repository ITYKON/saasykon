import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrPermission } from "@/lib/authorization";

// GET /api/admin/archives/stats
export async function GET() {
  try {
    const authCheck = await requireAdminOrPermission("archives");
    if (authCheck instanceof NextResponse) return authCheck;

    const [utilisateurs, salons, reservations, abonnements] = await Promise.all([
      prisma.users.count({ where: { NOT: { deleted_at: null } } }),
      prisma.businesses.count({ where: { OR: [{ NOT: { archived_at: null } }, { NOT: { deleted_at: null } }] } }),
      prisma.reservations.count({ where: { NOT: { cancelled_at: null } } }),
      prisma.subscriptions.count({ where: { status: "CANCELED" } }),
    ]);

    return NextResponse.json({
      utilisateurs,
      salons,
      reservations,
      abonnements,
    });
  } catch (e) {
    console.error("[GET /api/admin/archives/stats] Erreur:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
