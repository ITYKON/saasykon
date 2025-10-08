import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrPermission } from "@/lib/authorization";

export async function GET() {
  try {
    const auth = await requireAdminOrPermission("salons");
    if (auth instanceof NextResponse) return auth;

    const pending = await prisma.businesses.findMany({
      where: {
        OR: [
          { subscriptions: { none: { status: "ACTIVE" } } },
          { OR: [ { business_locations: { none: {} } }, { services: { none: {} } }, { employees: { none: {} } } ] },
        ],
        archived_at: null,
        deleted_at: null,
      },
      select: {
        id: true,
        public_name: true,
        legal_name: true,
        users: { select: { first_name: true, last_name: true, email: true } },
      },
      orderBy: { created_at: "desc" },
      take: 50,
    });
    return NextResponse.json({ salons: pending });
  } catch (e) {
    console.error("[GET /api/admin/dashboard/actions/validate-pending-salons] Error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdminOrPermission("salons");
    if (auth instanceof NextResponse) return auth;

    const body = await request.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((x: any) => typeof x === "string") : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: "Aucun salon sélectionné" }, { status: 400 });
    }

    // Log a validation event for each selected business (placeholder action)
    await prisma.$transaction(
      ids.map((id) =>
        prisma.event_logs.create({
          data: {
            business_id: id,
            event_name: "BUSINESS_VALIDATED",
            payload: { manual: true, source: "dashboard_quick_action_modal" } as any,
          },
        })
      )
    );

    return NextResponse.json({ validated: ids.length, businessIds: ids });
  } catch (e) {
    console.error("[POST /api/admin/dashboard/actions/validate-pending-salons] Error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
