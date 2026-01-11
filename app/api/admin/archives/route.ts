import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrPermission } from "@/lib/authorization";

// Helpers
function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  return { page, pageSize, skip, take };
}

// GET /api/admin/archives?type=utilisateurs|salons|reservations|abonnements&q=&page=&pageSize=
export async function GET(request: Request) {
  try {
    const authCheck = await requireAdminOrPermission("archives");
    if (authCheck instanceof NextResponse) return authCheck;

    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") || "utilisateurs").toLowerCase();
    const q = (searchParams.get("q") || "").trim();
    const { skip, take } = parsePagination(searchParams);

    if (!["utilisateurs", "salons", "reservations", "abonnements", "leads"].includes(type)) {
      return NextResponse.json({ error: "Type invalide" }, { status: 400 });
    }

    switch (type) {
      case "utilisateurs": {
        const where: any = {
          NOT: { deleted_at: null },
          ...(q
            ? {
                OR: [
                  { email: { contains: q, mode: "insensitive" } },
                  { first_name: { contains: q, mode: "insensitive" } },
                  { last_name: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        };
        const [items, total] = await Promise.all([
          prisma.users.findMany({ where, orderBy: { deleted_at: "desc" }, skip, take }),
          prisma.users.count({ where }),
        ]);
        return NextResponse.json({ items, total });
      }
      case "salons": {
        const where: any = {
          OR: [{ NOT: { archived_at: null } }, { NOT: { deleted_at: null } }],
          ...(q
            ? {
                OR: [
                  { public_name: { contains: q, mode: "insensitive" } },
                  { legal_name: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        };
        const [items, total] = await Promise.all([
          prisma.businesses.findMany({
            where,
            orderBy: [{ deleted_at: "desc" }, { archived_at: "desc" }],
            skip,
            take,
            include: { users_businesses_owner_user_idTousers: true }, // owner
          }),
          prisma.businesses.count({ where }),
        ]);
        return NextResponse.json({ items, total });
      }
      case "reservations": {
        // Consider reservations with cancelled_at set as archived (assumption)
        const where: any = {
          NOT: { cancelled_at: null },
          ...(q
            ? {
                OR: [
                  { clients: { is: { first_name: { contains: q, mode: "insensitive" } } } },
                  { clients: { is: { last_name: { contains: q, mode: "insensitive" } } } },
                  { businesses: { is: { public_name: { contains: q, mode: "insensitive" } } } },
                ],
              }
            : {}),
        };
        const [items, total] = await Promise.all([
          prisma.reservations.findMany({
            where,
            orderBy: { cancelled_at: "desc" },
            skip,
            take,
            include: {
              clients: true,
              businesses: true,
              reservation_items: { include: { services: true } },
            },
          }),
          prisma.reservations.count({ where }),
        ]);
        return NextResponse.json({ items, total });
      }
      case "abonnements": {
        // Consider subscriptions with status CANCELED as archived (assumption)
        const where: any = {
          status: "CANCELED",
          ...(q
            ? {
                OR: [
                  { businesses: { is: { public_name: { contains: q, mode: "insensitive" } } } },
                  { plans: { is: { name: { contains: q, mode: "insensitive" } } } },
                ],
              }
            : {}),
        };
        const [items, total] = await Promise.all([
          prisma.subscriptions.findMany({
            where,
            orderBy: { updated_at: "desc" },
            skip,
            take,
            include: { businesses: true, plans: true },
          }),
          prisma.subscriptions.count({ where }),
        ]);
        return NextResponse.json({ items, total });
      }
      case "leads": {
        const where: any = {
          NOT: { archived_at: null },
          ...(q
            ? {
                OR: [
                  { business_name: { contains: q, mode: "insensitive" } },
                  { owner_first_name: { contains: q, mode: "insensitive" } },
                  { owner_last_name: { contains: q, mode: "insensitive" } },
                  { email: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        };
        const [items, total] = await Promise.all([
          prisma.business_leads.findMany({ 
            where, 
            orderBy: { archived_at: "desc" }, 
            skip, 
            take 
          }),
          prisma.business_leads.count({ where }),
        ]);
        return NextResponse.json({ items, total });
      }
    }
  } catch (e) {
    console.error("[GET /api/admin/archives] Erreur:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/admin/archives  body: { type, id }
// Attempts permanent deletion. May fail if foreign key constraints exist.
export async function DELETE(request: Request) {
  try {
    const authCheck = await requireAdminOrPermission("archives");
    if (authCheck instanceof NextResponse) return authCheck;

    const { type, id } = await request.json();
    if (!type || !id) return NextResponse.json({ error: "type et id requis" }, { status: 400 });

    const t = String(type).toLowerCase();

    try {
      switch (t) {
        case "utilisateurs": {
          const res = await prisma.users.delete({ where: { id: String(id) } });
          // audit log
          await prisma.event_logs.create({
            data: {
              user_id: (authCheck as any).userId,
              event_name: "archive.delete_permanent",
              payload: { type: t, entity_id: String(id) } as any,
            },
          });
          return NextResponse.json({ success: true, message: "Supprimé définitivement", item: res });
        }
        case "salons": {
          const res = await prisma.businesses.delete({ where: { id: String(id) } });
          await prisma.event_logs.create({
            data: {
              user_id: (authCheck as any).userId,
              event_name: "archive.delete_permanent",
              payload: { type: t, entity_id: String(id) } as any,
            },
          });
          return NextResponse.json({ success: true, message: "Supprimé définitivement", item: res });
        }
        case "reservations": {
          const res = await prisma.reservations.delete({ where: { id: String(id) } });
          await prisma.event_logs.create({
            data: {
              user_id: (authCheck as any).userId,
              event_name: "archive.delete_permanent",
              payload: { type: t, entity_id: String(id) } as any,
            },
          });
          return NextResponse.json({ success: true, message: "Supprimé définitivement", item: res });
        }
        case "abonnements": {
          const res = await prisma.subscriptions.delete({ where: { id: String(id) } });
          await prisma.event_logs.create({
            data: {
              user_id: (authCheck as any).userId,
              event_name: "archive.delete_permanent",
              payload: { type: t, entity_id: String(id) } as any,
            },
          });
          return NextResponse.json({ success: true, message: "Supprimé définitivement", item: res });
        }
        case "leads": {
          const res = await prisma.business_leads.delete({ where: { id: String(id) } });
          await prisma.event_logs.create({
            data: {
              user_id: (authCheck as any).userId,
              event_name: "archive.delete_permanent",
              payload: { type: t, entity_id: String(id) } as any,
            },
          });
          return NextResponse.json({ success: true, message: "Supprimé définitivement", item: res });
        }
        default:
          return NextResponse.json({ error: "Type invalide" }, { status: 400 });
      }
    } catch (err: any) {
      // Prisma errors
      if (err?.code === "P2025") {
        return NextResponse.json({ error: "Élément non trouvé" }, { status: 404 });
      }
      if (err?.code === "P2003") {
        return NextResponse.json({ error: "Suppression impossible: contraintes de données", details: err?.meta || null }, { status: 409 });
      }
      console.error("[DELETE /api/admin/archives] Erreur Prisma:", err);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
  } catch (e) {
    console.error("[DELETE /api/admin/archives] Erreur:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
