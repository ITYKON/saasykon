import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrPermission } from "@/lib/authorization";

// POST /api/admin/archives/restore  body: { type, id }
export async function POST(request: Request) {
  try {
    const authCheck = await requireAdminOrPermission("archives");
    if (authCheck instanceof NextResponse) return authCheck;

    const { type, id } = await request.json();
    if (!type || !id) return NextResponse.json({ error: "type et id requis" }, { status: 400 });

    const t = String(type).toLowerCase();

    switch (t) {
      case "utilisateurs": {
        const res = await prisma.users.update({ where: { id: String(id) }, data: { deleted_at: null } });
        await prisma.event_logs.create({
          data: {
            user_id: (authCheck as any).userId,
            event_name: "archive.restore",
            payload: { type: t, entity_id: String(id) } as any,
          },
        });
        return NextResponse.json({ success: true, message: "Restauré avec succès", item: res });
      }
      case "salons": {
        const res = await prisma.businesses.update({
          where: { id: String(id) },
          data: { archived_at: null, deleted_at: null },
        });
        await prisma.event_logs.create({
          data: {
            user_id: (authCheck as any).userId,
            event_name: "archive.restore",
            payload: { type: t, entity_id: String(id) } as any,
          },
        });
        return NextResponse.json({ success: true, message: "Restauré avec succès", item: res });
      }
      case "reservations": {
        // Assumption: restoring a reservation means removing cancelled_at and setting status to PENDING
        const res = await prisma.reservations.update({
          where: { id: String(id) },
          data: { cancelled_at: null, status: "PENDING" as any },
        });
        await prisma.event_logs.create({
          data: {
            user_id: (authCheck as any).userId,
            event_name: "archive.restore",
            payload: { type: t, entity_id: String(id) } as any,
          },
        });
        return NextResponse.json({ success: true, message: "Restauré avec succès", item: res });
      }
      case "abonnements": {
        // Assumption: restoring a subscription means setting status back to ACTIVE
        const res = await prisma.subscriptions.update({
          where: { id: String(id) },
          data: { status: "ACTIVE" as any },
        });
        await prisma.event_logs.create({
          data: {
            user_id: (authCheck as any).userId,
            event_name: "archive.restore",
            payload: { type: t, entity_id: String(id) } as any,
          },
        });
        return NextResponse.json({ success: true, message: "Restauré avec succès", item: res });
      }
      default:
        return NextResponse.json({ error: "Type invalide" }, { status: 400 });
    }
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "Elément non trouvé" }, { status: 404 });
    }
    console.error("[POST /api/admin/archives/restore] Erreur:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
