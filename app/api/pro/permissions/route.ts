import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const cookieStore = cookies();
  const businessId = url.searchParams.get("business_id") || cookieStore.get("business_id")?.value || ctx.assignments[0]?.business_id;
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });
  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const permissions = await prisma.permissions.findMany({ select: { id: true, code: true, description: true } });
  return NextResponse.json({ permissions });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Only platform admins can seed roles/permissions
  if (!ctx.roles.includes("ADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Seed a default set of permissions and role mappings for the pro space
  // Mark which permissions belong to pro vs admin space
  const PERMS: { code: string; description: string; space: 'admin' | 'pro' }[] = [
    { code: "pro_portal_access", description: "Accès à l'espace pro", space: 'pro' },
    { code: "agenda_view", description: "Voir l'agenda", space: 'pro' },
    { code: "reservations_manage", description: "Gérer les réservations", space: 'pro' },
    { code: "clients_manage", description: "Gérer les clients", space: 'pro' },
    { code: "services_manage", description: "Gérer les services", space: 'pro' },
    { code: "employees_manage", description: "Gérer les employés", space: 'pro' },
    { code: "billing_access", description: "Accès à la facturation", space: 'pro' },
    { code: "reports_view", description: "Voir les statistiques", space: 'pro' },
    { code: "settings_edit", description: "Modifier les paramètres", space: 'pro' },
    { code: "support", description: "Support Client", space: 'pro' },
    { code: "admin", description: "Administration complète", space: 'admin' },
  ];

  const ROLES: { code: string; name: string; permissions: string[]; space: 'admin' | 'pro' }[] = [
    { code: "ADMIN", name: "Admin", permissions: ["admin"], space: 'admin' },
    { code: "support", name: "Support Client", permissions: ["support", "pro_portal_access"], space: 'pro' },
    // Institute-specific employee roles (business-scoped)
    { code: "admin_institut", name: "Admin Institut", permissions: [
      "pro_portal_access",
      "agenda_view",
      "reservations_manage",
      "clients_manage",
      "services_manage",
      "employees_manage",
      "billing_access",
      "reports_view",
      "settings_edit",
    ], space: 'pro' },
    { code: "manager", name: "Manager", permissions: [
      "pro_portal_access",
      "agenda_view",
      "reservations_manage",
      "clients_manage",
      "services_manage",
      "employees_manage",
      "reports_view",
    ], space: 'pro' },
    { code: "gestionnaire", name: "Gestionnaire", permissions: [
      "pro_portal_access",
      "agenda_view",
      "reservations_manage",
      "clients_manage",
      "services_manage",
      "reports_view",
    ], space: 'pro' },
    ] },
    { code: "receptionniste", name: "Réceptionniste", permissions: [
      "pro_portal_access",
      "agenda_view",
      "reservations_manage",
    ] },
    { code: "praticien", name: "Praticien", permissions: [
      "pro_portal_access",
      "agenda_view",
    ] },
    { code: "agent_commercial", name: "Agent commercial", permissions: [
      "pro_portal_access",
      "reports_view",
    ] },
    {
      code: "PRO",
      name: "Professionnel",
      permissions: [
        "pro_portal_access",
        "agenda_view",
        "reservations_manage",
        "clients_manage",
        "services_manage",
        "reports_view",
      ],
    },
    {
      code: "PROFESSIONNEL",
      name: "Professionnel (étendu)",
      permissions: [
        "pro_portal_access",
        "agenda_view",
        "reservations_manage",
        "clients_manage",
        "services_manage",
        "reports_view",
        "employees_manage",
      ],
    },
    { code: "receptionniste", name: "Réceptionniste", permissions: ["pro_portal_access", "agenda_view", "reservations_manage"] },
    { code: "praticien", name: "Praticien", permissions: ["pro_portal_access", "agenda_view"] },
    { code: "gestion_clients", name: "Gestion clients", permissions: ["pro_portal_access", "clients_manage"] },
    { code: "agent_commercial", name: "Agent commercial", permissions: ["pro_portal_access", "reports_view"] },
  ];

  await prisma.$transaction(async (tx) => {
    // Upsert permissions
    for (const p of PERMS) {
      const existing = await tx.permissions.findUnique({ where: { code: p.code } });
      if (existing) {
        await tx.permissions.update({ where: { code: p.code }, data: { description: p.description, space: p.space as any } });
      } else {
        await tx.permissions.create({ data: { code: p.code, description: p.description, space: p.space as any } });
      }
    }

    // Upsert roles and link permissions
    for (const r of ROLES) {
      const role = await tx.roles.upsert({
        where: { code: r.code },
        update: { name: r.name, space: r.space as any },
        create: { code: r.code, name: r.name, space: r.space as any },
      });
      // clear existing links
      await tx.role_permissions.deleteMany({ where: { role_id: role.id } });
      if (r.permissions.length) {
        const perms = await tx.permissions.findMany({ where: { code: { in: r.permissions } } });
        if (perms.length) {
          await tx.role_permissions.createMany({ data: perms.map((p) => ({ role_id: role.id, permission_id: p.id })) });
        }
      }
    }
  });

  return NextResponse.json({ ok: true });
}
