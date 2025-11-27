import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

// Map a /pro path to required permission codes (any-of)
function requiredForPath(pathname: string): string[] | null {
  // Normalize
  const p = pathname.split("?")[0].replace(/\/$/, "");
  // Let root dashboard be accessible if the user can access any Pro area; specific pages are guarded below
  if (p === "/pro" || p === "/pro/dashboard") return []; // no specific code required
  if (p.startsWith("/pro/agenda")) return ["agenda_view", "agenda_manage", "agenda"];
  if (p.startsWith("/pro/reservations")) return ["reservations_view", "reservations_manage"];
  if (p.startsWith("/pro/clients")) return ["clients_view", "clients_manage"];
  if (p.startsWith("/pro/employes")) return ["employees_manage", "employees"];
  if (p.startsWith("/pro/comptes-employes")) return ["employee_accounts", "pro_accounts", "pro_accounts_manage"];
  if (p.startsWith("/pro/services")) return ["services_manage", "services"];
  if (p.startsWith("/pro/profil-institut")) return ["settings_edit", "settings", "profil"];
  if (p.startsWith("/pro/statistiques")) return ["reports_view", "stats"];
  if (p.startsWith("/pro/abonnement")) return ["subscription_view", "subscription"];
  if (p.startsWith("/pro/archives")) return ["archives_view", "archives"];
  return ["pro_portal_access"]; // default minimal access to any /pro route
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ ok: false, reason: "unauth" }, { status: 401 });

    const url = new URL(req.url);
    const qpPath = url.searchParams.get("path") || "";
    const rawPath = qpPath || url.pathname.replace(/\/api\/pro\/guard$/, "");
    const pathname = (rawPath || "/pro").trim();

    // ADMIN and PRO can access everything in PRO area
    if (ctx.roles.includes("ADMIN") || ctx.roles.includes("PRO")) return NextResponse.json({ ok: true });

    const needed = requiredForPath(pathname);
    if (!needed || needed.length === 0) return NextResponse.json({ ok: true });

    // For pages that require permission checks, we must have a business_id context
    const cookieStore = cookies();
    const businessId = cookieStore.get("business_id")?.value || "";
    if (!businessId) return NextResponse.json({ ok: false, reason: "no_business" }, { status: 400 });

    // Find employee for this user
    const acc = await prisma.employee_accounts.findUnique({ where: { user_id: ctx.userId } }).catch(() => null);
    if (!acc) return NextResponse.json({ ok: false, reason: "no_employee" }, { status: 403 });

    // Load permissions for this employee in current business
    const perms = await prisma.employee_permissions.findMany({
      where: { employee_id: acc.employee_id, business_id: businessId },
      include: { pro_permissions: { select: { code: true } } },
    } as any);
    const codes = new Set<string>(perms.map((p: any) => p.pro_permissions?.code).filter(Boolean));

    const allowed = needed.some((code) => codes.has(code));
    if (!allowed) return NextResponse.json({ ok: false, reason: "forbidden", needed, have: Array.from(codes) }, { status: 403 });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("/api/pro/guard error", { message: error?.message, stack: error?.stack });
    return NextResponse.json({ ok: false, reason: "server_error" }, { status: 500 });
  }
}
