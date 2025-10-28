import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

function getBusinessId(req: NextRequest, ctx: any) {
  const url = new URL(req.url);
  const cookieStore = cookies();
  return (
    url.searchParams.get("business_id") ||
    cookieStore.get("business_id")?.value ||
    ctx?.assignments?.[0]?.business_id ||
    null
  );
}

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = getBusinessId(req, ctx);
  // On n'utilise pas businessId pour filtrer la table clients (demande: tout le contenu),
  // mais on le garde pour les règles d'accès.
  let allowed = ctx.roles.includes("ADMIN") || ctx.assignments.length > 0;
  if (!allowed) {
    try {
      const acc = await prisma.employee_accounts.findUnique({ where: { user_id: ctx.userId } }).catch(() => null);
      if (acc) {
        const perms = await prisma.employee_permissions.findMany({
          where: businessId ? { employee_id: acc.employee_id, business_id: businessId } : { employee_id: acc.employee_id },
          include: { pro_permissions: { select: { code: true } } },
        } as any);
        const codes = new Set<string>(perms.map((p: any) => p.pro_permissions?.code).filter(Boolean));
        allowed = codes.has("clients_view") || codes.has("clients_manage");
      }
    } catch {}
  }
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 1), 200);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0);

  // Recherche directe dans la table clients (tout le contenu), avec jointure users pour email
  const where: any = {};
  if (q) {
    where.OR = [
      { first_name: { contains: q, mode: "insensitive" as any } },
      { last_name: { contains: q, mode: "insensitive" as any } },
      { phone: { contains: q, mode: "insensitive" as any } },
      { users: { email: { contains: q, mode: "insensitive" as any } } as any },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.clients.count({ where } as any),
    prisma.clients.findMany({
      where,
      orderBy: [{ last_name: "asc" as const }, { first_name: "asc" as const }],
      skip: offset,
      take: limit,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        phone: true,
        users: { select: { email: true, first_name: true, last_name: true } },
      },
    } as any),
  ]);

  const items = rows.map((c: any) => ({
    id: c.id,
    name: `${c.first_name || c.users?.first_name || ""} ${c.last_name || c.users?.last_name || ""}`.trim() || "Client",
    email: c.users?.email || null,
    phone: c.phone || null,
  }));

  return NextResponse.json({ items, total });
}
