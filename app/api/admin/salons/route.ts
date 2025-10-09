import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdminOrPermission } from "@/lib/authorization";

export async function GET(req: Request) {
  // Enforce auth
  const authCheck = await requireAdminOrPermission("salons");
  if (authCheck instanceof NextResponse) return authCheck;
  // Pagination
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  const q = (searchParams.get("q") || "").trim();

  const where: any = q
    ? {
        OR: [
          { public_name: { contains: q, mode: "insensitive" } },
          { legal_name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [salons, total] = await Promise.all([
    prisma.businesses.findMany({
      where,
      include: {
        business_locations: true,
        business_media: true,
        users: true,
        services: true,
        reviews: true,
        employees: true,
        subscriptions: { include: { plans: true } },
        ratings_aggregates: true,
      },
      orderBy: { created_at: "desc" },
      skip,
      take,
    }),
    prisma.businesses.count({ where }),
  ]);

  // Pré-calculs agrégés pour enrichir les champs attendus par le front
  const businessIds = salons.map((s) => s.id);
  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // groupBy reservations -> totalBookings
  const reservationsCounts = businessIds.length
    ? await prisma.reservations.groupBy({
        by: ["business_id"],
        where: { business_id: { in: businessIds } },
        _count: { _all: true },
      })
    : [];
  const bookingsMap = Object.fromEntries(reservationsCounts.map((r) => [r.business_id, r._count._all]));

  // groupBy payments in last 30d -> monthlyRevenue in DA
  const paymentsSums = businessIds.length
    ? await prisma.payments.groupBy({
        by: ["business_id"],
        where: { business_id: { in: businessIds }, status: "CAPTURED", created_at: { gte: last30, lt: now } },
        _sum: { amount_cents: true },
      })
    : [];
  const monthlyRevenueMap = Object.fromEntries(
    paymentsSums.map((p) => [p.business_id, Math.round(((p._sum.amount_cents || 0) as number) / 100)])
  );

  // lastActivity via event_logs (take recent and pick first per business)
  const recentLogs = businessIds.length
    ? await prisma.event_logs.findMany({
        where: { business_id: { in: businessIds } },
        orderBy: { occurred_at: "desc" },
        take: 200,
        select: { business_id: true, occurred_at: true },
      })
    : [];
  const lastActivityMap: Record<string, string> = {};
  for (const log of recentLogs) {
    const bid = log.business_id as string | null;
    if (bid && !lastActivityMap[bid]) lastActivityMap[bid] = log.occurred_at.toISOString();
  }

  // Calculs business pour badges/statuts avancés + enrichissements UI
  const salonsWithBadges = salons.map(salon => {
    // rating_avg et rating_count
    const rating_avg = salon.ratings_aggregates?.rating_avg ? Number(salon.ratings_aggregates.rating_avg) : 0;
    const rating_count = salon.ratings_aggregates?.rating_count ?? 0;
    // abonnement principal (nom du plan)
    const subscription = salon.subscriptions?.[0]?.plans?.name || "";
    // statut: en attente si inscription incomplète ou sans abonnement actif, inactif si archivé/supprimé
    const hasLocation = (salon.business_locations || []).length > 0;
    const hasService = (salon.services || []).length > 0;
    const hasEmployee = (salon.employees || []).length > 0;
    const profileComplete = hasLocation && hasService && hasEmployee && Boolean(salon.public_name);
    const hasActiveSubscription = Boolean(salon.subscriptions && salon.subscriptions[0]);
    const status: "en attente" | "inactif" = (salon as any).archived_at || (salon as any).deleted_at
      ? "inactif"
      : "en attente"; // d'après la règle fournie, pas d'état "actif" exposé ici
    return {
      ...salon,
      rating_avg,
      rating_count,
      // Champs attendus par le front
      rating: rating_avg,
      reviewCount: rating_count,
      totalBookings: bookingsMap[salon.id] || 0,
      monthlyRevenue: monthlyRevenueMap[salon.id] || 0, // DA
      joinDate: salon.created_at?.toISOString?.() || (salon as any).created_at,
      lastActivity: lastActivityMap[salon.id] || undefined,
      subscription,
      status,
      isTop: rating_avg >= 4.5,
      isNew: (new Date().getTime() - new Date(salon.created_at).getTime()) < 1000 * 60 * 60 * 24 * 30,
      isPremium: subscription.toLowerCase() === "premium",
    };
  });

  return NextResponse.json({ salons: salonsWithBadges, total, page, pageSize });
}

// Validation Zod
const salonSchema = z.object({
  legal_name: z.string().min(2),
  public_name: z.string().min(2),
  description: z.string().optional(),
  email: z.string().email(),
  phone: z.string().min(6),
  website: z.string().url().optional(),
  vat_number: z.string().optional(),
  category_code: z.string().optional(),
  logo_url: z.string().optional(),
  cover_url: z.string().optional(),
});

export async function POST(req: Request) {
    const authCheck = await requireAdminOrPermission("salons");
    if (authCheck instanceof NextResponse) return authCheck;
    const data = await req.json();
  console.log("[POST /api/admin/salons] data reçu:", data);
  const parse = salonSchema.safeParse(data);
  if (!parse.success) {
    console.error("[POST /api/admin/salons] Validation error:", parse.error);
    return NextResponse.json({ error: "Validation error", details: parse.error }, { status: 400 });
  }
  // Création du user owner si non fourni
  let ownerUserId = data.owner_user_id;
  if (!ownerUserId) {
    try {
      const ownerUser = await prisma.users.create({
        data: {
          email: data.email,
          phone: data.phone,
          first_name: data.public_name,
          last_name: data.legal_name,
        },
      });
      ownerUserId = ownerUser.id;
      console.log("[POST /api/admin/salons] User owner créé:", ownerUser);
    } catch (err) {
      console.error("[POST /api/admin/salons] Erreur création user:", err);
      return NextResponse.json({ error: "Erreur création user", details: err }, { status: 500 });
    }
  }
  // Création salon
  try {
    const salon = await prisma.businesses.create({
      data: {
        owner_user_id: ownerUserId,
        legal_name: data.legal_name,
        public_name: data.public_name,
        description: data.description,
        email: data.email,
        phone: data.phone,
        website: data.website,
        vat_number: data.vat_number,
        category_code: data.category_code,
        logo_url: data.logo_url,
        cover_url: data.cover_url,
        // autres champs si besoin
      },
    });
    console.log("[POST /api/admin/salons] Salon créé:", salon);
    await prisma.event_logs.create({
      data: {
        user_id: (authCheck as any).userId,
        event_name: "salon.create",
        payload: { business_id: salon.id } as any,
      },
    });
    return NextResponse.json({ salon });
  } catch (err) {
    console.error("[POST /api/admin/salons] Erreur création salon:", err);
    return NextResponse.json({ error: "Erreur création salon", details: err }, { status: 500 });
  }
}

export async function PUT(req: Request) {
    const authCheck = await requireAdminOrPermission("salons");
    if (authCheck instanceof NextResponse) return authCheck;
    const data = await req.json();
  console.log("[PUT /api/admin/salons] data reçu:", data);
  if (!data.id) {
    console.error("[PUT /api/admin/salons] Missing salon id");
    return NextResponse.json({ error: "Missing salon id" }, { status: 400 });
  }
  const parse = salonSchema.safeParse(data);
  if (!parse.success) {
    console.error("[PUT /api/admin/salons] Validation error:", parse.error);
    return NextResponse.json({ error: "Validation error", details: parse.error }, { status: 400 });
  }
  try {
    const salon = await prisma.businesses.update({
      where: { id: data.id },
      data: {
        legal_name: data.legal_name,
        public_name: data.public_name,
        description: data.description,
        email: data.email,
        phone: data.phone,
        website: data.website,
        vat_number: data.vat_number,
        category_code: data.category_code,
        logo_url: data.logo_url,
        cover_url: data.cover_url,
        // autres champs si besoin
      },
    });
    console.log("[PUT /api/admin/salons] Salon modifié:", salon);
    await prisma.event_logs.create({
      data: {
        user_id: (authCheck as any).userId,
        event_name: "salon.update",
        payload: { business_id: salon.id } as any,
      },
    });
    return NextResponse.json({ salon });
  } catch (err: any) {
    console.error("[PUT /api/admin/salons] Erreur modification salon:", err);
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Salon non trouvé" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erreur modification salon", details: err }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
    const authCheck = await requireAdminOrPermission("salons");
    if (authCheck instanceof NextResponse) return authCheck;
    const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing salon id" }, { status: 400 });
  try {
    // Soft delete: archive le salon pour intégration avec la page Archives
    const salon = await prisma.businesses.update({ where: { id }, data: { archived_at: new Date() } });
    await prisma.event_logs.create({
      data: {
        user_id: (authCheck as any).userId,
        event_name: "salon.archive",
        payload: { business_id: id } as any,
      },
    });
    return NextResponse.json({ success: true, message: "Salon archivé", salon });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Salon non trouvé" }, { status: 404 });
    }
    if (err?.code === "P2003") {
      return NextResponse.json({ error: "Suppression impossible: contraintes de données" }, { status: 409 });
    }
    console.error("[DELETE /api/admin/salons] Erreur:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}