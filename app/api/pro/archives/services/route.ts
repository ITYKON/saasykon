import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

function requireBusinessContext(ctx: any, req: NextRequest) {
  const cookieStore = cookies();
  const url = new URL(req.url);
  const businessId = url.searchParams.get("business_id") || cookieStore.get("business_id")?.value || ctx.assignments[0]?.business_id;
  return businessId || null;
}

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = requireBusinessContext(ctx, req);
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });

  let allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a: any) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) {
    try {
      const acc = await prisma.employee_accounts.findUnique({ where: { user_id: ctx.userId } }).catch(() => null);
      if (acc) {
        const perms = await prisma.employee_permissions.findMany({
          where: { employee_id: acc.employee_id, business_id: businessId },
          include: { pro_permissions: { select: { code: true } } },
        } as any);
        const codes = new Set<string>(perms.map((p: any) => p.pro_permissions?.code).filter(Boolean));
        allowed = codes.has("archives") || codes.has("archives_view") || codes.has("services") || codes.has("services_manage");
      }
    } catch {}
  }
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const items = await prisma.services.findMany({
    where: { business_id: businessId, is_active: false },
    orderBy: { updated_at: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      category_id: true,
      service_categories: { select: { id: true, name: true } },
      service_variants: {
        select: {
          id: true,
          name: true,
          duration_minutes: true,
          price_cents: true,
          price_min_cents: true,
          price_max_cents: true,
          currency: true,
          is_active: true,
        },
      } as any,
      service_addons: {
        select: {
          id: true,
          name: true,
          duration_minutes: true,
          price_cents: true,
          currency: true,
          is_active: true,
        },
      } as any,
      created_at: true,
      updated_at: true,
    },
  } as any);

  return NextResponse.json({ items });
}

// Restore a service from archives (reactivate)
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = requireBusinessContext(ctx, req);
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const svc = await prisma.services.findUnique({ where: { id }, select: { id: true, business_id: true } });
  if (!svc || svc.business_id !== businessId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a: any) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.services.update({ where: { id }, data: { is_active: true } });
  return NextResponse.json({ ok: true });
}

// Permanently delete a service (may fail on FK constraints)
export async function DELETE(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = requireBusinessContext(ctx, req);
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const svc = await prisma.services.findUnique({ where: { id }, select: { id: true, business_id: true } });
  if (!svc || svc.business_id !== businessId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a: any) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await prisma.services.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.code === "P2003") {
      return NextResponse.json({ error: "Suppression impossible: contraintes de données" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
