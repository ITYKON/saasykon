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
  const allowed = ctx.roles.includes("ADMIN") || ctx.permissions.includes("pro_portal_access") || ctx.assignments.some((a) => a.business_id === businessId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let permissions = await prisma.pro_permissions.findMany({ select: { id: true, code: true, description: true } });
  
  if (permissions.length === 0) {
    const DEFAULT_PRO_PERMS = [
      { code: "pro_portal_access", description: "Accès à l'espace pro" },
      { code: "agenda_view", description: "Voir l'agenda" },
      { code: "reservations_manage", description: "Gérer les réservations" },
      { code: "clients_manage", description: "Gérer les clients" },
      { code: "services_manage", description: "Gérer les services" },
      { code: "employees_manage", description: "Gérer les employés" },
      { code: "billing_access", description: "Accès à la facturation" },
      { code: "reports_view", description: "Voir les statistiques" },
      { code: "settings_edit", description: "Modifier les paramètres" },
    ];
    
    await prisma.pro_permissions.createMany({
      data: DEFAULT_PRO_PERMS,
      skipDuplicates: true
    });
    
    permissions = await prisma.pro_permissions.findMany({ select: { id: true, code: true, description: true } });
  }

  return NextResponse.json({ permissions });
}
