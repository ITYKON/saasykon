import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrPermission } from "@/lib/authorization";

// Default permissions reflecting admin navigation and common features
const DEFAULTS = [
  { code: "dashboard", description: "Accès au tableau de bord" },
  { code: "leads", description: "Gérer les leads" },
  { code: "users", description: "Gérer les utilisateurs" },
  { code: "salons", description: "Gérer les salons" },
  { code: "reservations", description: "Gérer les réservations" },
  { code: "subscriptions", description: "Gérer les abonnements" },
  { code: "statistics", description: "Voir les statistiques" },
  { code: "roles", description: "Gérer les rôles" },
  { code: "archives", description: "Accéder aux archives" },
  { code: "settings", description: "Paramètres de la plateforme" },
  { code: "verifications", description: "Vérifications des entreprises" },
];

export async function GET() {
  const auth = await requireAdminOrPermission("roles");
  if (auth instanceof NextResponse) return auth;
  try {
    // Ensure default permissions exist in DB (idempotent)
    await Promise.all(
      DEFAULTS.map((d) =>
        prisma.permissions.upsert({
          where: { code: d.code },
          update: { description: d.description ?? null },
          create: { code: d.code, description: d.description ?? null },
        })
      )
    );
    const items = await prisma.permissions.findMany({ orderBy: { code: "asc" } });
    const byCode = new Map<string, { id: string; name: string; description: string | null }>();
    // Seed with DB
    items.forEach((p) => byCode.set(p.code, { id: p.code, name: p.code, description: p.description || null }));
    // Merge defaults (do not overwrite DB descriptions)
    DEFAULTS.forEach((d) => {
      if (!byCode.has(d.code)) byCode.set(d.code, { id: d.code, name: d.code, description: d.description || null });
    });
    // Return sorted by id/code
    const permissions = Array.from(byCode.values()).sort((a, b) => a.id.localeCompare(b.id));
    return NextResponse.json({ permissions });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
