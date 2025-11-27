export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrPermission } from "@/lib/authorization";

function getMonthBounds(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  return { start, end };
}

export async function GET() {
  try {
    const auth = await requireAdminOrPermission("dashboard");
    if (auth instanceof NextResponse) return auth;

    const now = new Date();
    const { start, end } = getMonthBounds(now);

    const [totalSalons, totalUsers, revenueAgg, activeBookings] = await Promise.all([
      prisma.businesses.count(),
      prisma.users.count({ where: { deleted_at: null } }),
      prisma.payments.aggregate({
        _sum: { amount_cents: true },
        where: { status: "CAPTURED", created_at: { gte: start, lt: end } },
      }),
      prisma.reservations.count({ where: { status: "CONFIRMED", starts_at: { gte: now } } }),
    ]);

    // Recent salons with owner, location, subscription
    const recentRaw = await prisma.businesses.findMany({
      orderBy: { created_at: "desc" },
      take: 5,
      include: {
        users_businesses_owner_user_idTousers: { select: { first_name: true, last_name: true } },
        business_locations: {
          take: 1,
          include: { cities: { select: { name: true } } },
          orderBy: { created_at: "desc" },
        },
        subscriptions: {
          take: 1,
          orderBy: { created_at: "desc" },
          include: { plans: { select: { code: true, name: true } } },
        },
        services: { select: { id: true }, take: 1 },
        employees: { select: { id: true }, take: 1 },
      },
    });

    const recentSalons = recentRaw.map((b) => {
      const hasActiveSubscription = Boolean(b.subscriptions?.[0]);
      const hasLocation = Boolean(b.business_locations?.length);
      const hasService = Boolean((b as any).services?.length);
      const hasEmployee = Boolean((b as any).employees?.length);
      const profileComplete = hasLocation && hasService && hasEmployee && Boolean(b.public_name);

      let status: "en attente" | "inactif" = "en attente";
      if (b.archived_at || b.deleted_at) status = "inactif" as const;
      else if (!hasActiveSubscription || !profileComplete) status = "en attente" as const;

      return {
        id: b.id,
        name: b.public_name || b.legal_name,
        owner: `${b.users_businesses_owner_user_idTousers?.first_name ?? ""} ${b.users_businesses_owner_user_idTousers?.last_name ?? ""}`.trim() || undefined,
        location: b.business_locations?.[0]?.cities?.name || undefined,
        status,
        subscription: b.subscriptions?.[0]?.plans?.name || b.subscriptions?.[0]?.plans?.code || "-",
        joinDate: b.created_at?.toISOString(),
      };
    });

    // Simple system alerts
    const pendingValidationCount = await prisma.businesses.count({
      where: {
        created_at: { gte: new Date(now.getTime() - 72 * 60 * 60 * 1000) },
        subscriptions: { none: { status: "ACTIVE" } },
      },
    }).catch(() => 0);

    const failedPaymentsCount = await prisma.payments.count({
      where: { status: "FAILED", created_at: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
    }).catch(() => 0);

    const todayReservations = await prisma.reservations.count({
      where: {
        starts_at: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()), lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) },
      },
    });
    const last7DaysTotal = await prisma.reservations.count({
      where: { starts_at: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
    });
    const avgPerDay = Math.max(1, Math.round(last7DaysTotal / 7));

    const systemAlerts = [
      pendingValidationCount > 0 && {
        id: 1,
        type: "warning",
        message: `${pendingValidationCount} salons en attente de validation`,
        time: "dernières 72h",
      },
      failedPaymentsCount > 0 && {
        id: 2,
        type: "error",
        message: `${failedPaymentsCount} paiement(s) échoué(s) détecté(s)`,
        time: "dernières 24h",
      },
      todayReservations > avgPerDay && {
        id: 3,
        type: "success",
        message: "Nouveau record de réservations aujourd'hui",
        time: "aujourd'hui",
      },
    ].filter(Boolean);

    const monthlyRevenueCents = revenueAgg._sum.amount_cents ?? 0;

    return NextResponse.json({
      globalStats: {
        totalSalons,
        totalUsers,
        monthlyRevenueCents,
        activeBookings,
      },
      recentSalons,
      systemAlerts,
    });
  } catch (e) {
    console.error("[GET /api/admin/dashboard] Error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
