import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";

function isUuid(id: string) {
  return /^[0-9a-fA-F-]{36}$/.test(id);
}

async function requireServiceAccess(_req: NextRequest, serviceId: string) {
  const ctx = await getAuthContext();
  if (!ctx) return { status: 401 as const, error: "Unauthorized" };
  if (!isUuid(serviceId)) return { status: 400 as const, error: "Invalid service id" };

  const service = await prisma.services.findUnique({ where: { id: serviceId }, select: { id: true, business_id: true } });
  if (!service) return { status: 404 as const, error: "Not found" };

  const businessId = service.business_id;
  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return { status: 403 as const, error: "Forbidden" };

  return { status: 200 as const, service, ctx };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireServiceAccess(_req, params.id);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });

  const service = await prisma.services.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      business_id: true,
      category_id: true,
      service_categories: { select: { id: true, name: true } },
      name: true,
      description: true,
      is_active: true,
      created_at: true,
      updated_at: true,
      service_variants: { select: { id: true, name: true, duration_minutes: true, price_cents: true, price_min_cents: true, price_max_cents: true, currency: true, is_active: true }, orderBy: { duration_minutes: "asc" } },
      service_addons: { select: { id: true, name: true, duration_minutes: true, price_cents: true, currency: true, is_active: true }, orderBy: { duration_minutes: "asc" } },
    },
  } as any);

  return NextResponse.json({ service });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireServiceAccess(req, params.id);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { name, description, category_id, is_active } = body || {};

  const updated = await prisma.services.update({
    where: { id: params.id },
    data: ({
      ...(typeof name === "string" ? { name } : {}),
      ...(typeof description === "string" || description === null ? { description } : {}),
      ...(typeof category_id === "number" || category_id === null ? { category_id } : {}),
      ...(typeof is_active === "boolean" ? { is_active } : {}),
    } as any),
    select: { id: true },
  });

  return NextResponse.json({ id: updated.id });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireServiceAccess(_req, params.id);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });
  await prisma.services.update({ where: { id: params.id }, data: { is_active: false } });
  return NextResponse.json({ ok: true });
}
