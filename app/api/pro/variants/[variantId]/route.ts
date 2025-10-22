import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";

function isUuid(id: string) {
  return /^[0-9a-fA-F-]{36}$/.test(id);
}

async function requireVariantAccess(_req: NextRequest, variantId: string) {
  const ctx = await getAuthContext();
  if (!ctx) return { status: 401 as const, error: "Unauthorized" };
  if (!isUuid(variantId)) return { status: 400 as const, error: "Invalid variant id" };

  const variant = await prisma.service_variants.findUnique({
    where: { id: variantId },
    select: { id: true, services: { select: { business_id: true } } },
  } as any);
  if (!variant) return { status: 404 as const, error: "Not found" };

  const businessId = (variant as any).services.business_id as string;
  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return { status: 403 as const, error: "Forbidden" };

  return { status: 200 as const, businessId, ctx };
}

export async function PATCH(req: NextRequest, { params }: { params: { variantId: string } }) {
  const access = await requireVariantAccess(req, params.variantId);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { name, duration_minutes, price_cents, price_min_cents, price_max_cents, currency, buffer_before_minutes, buffer_after_minutes, is_active } = body || {};

  const updated = await prisma.service_variants.update({
    where: { id: params.variantId },
    data: ({
      ...(typeof name === "string" || name === null ? { name } : {}),
      ...(typeof duration_minutes === "number" ? { duration_minutes } : {}),
      ...(typeof price_cents === "number" || price_cents === null ? { price_cents } : {}),
      ...(typeof price_min_cents === "number" || price_min_cents === null ? { price_min_cents } : {}),
      ...(typeof price_max_cents === "number" || price_max_cents === null ? { price_max_cents } : {}),
      ...(typeof currency === "string" ? { currency } : {}),
      ...(typeof buffer_before_minutes === "number" ? { buffer_before_minutes } : {}),
      ...(typeof buffer_after_minutes === "number" ? { buffer_after_minutes } : {}),
      ...(typeof is_active === "boolean" ? { is_active } : {}),
    } as any),
    select: { id: true },
  });

  return NextResponse.json({ id: updated.id });
}

export async function DELETE(_req: NextRequest, { params }: { params: { variantId: string } }) {
  const access = await requireVariantAccess(_req, params.variantId);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });
  await prisma.service_variants.update({ where: { id: params.variantId }, data: { is_active: false } });
  return NextResponse.json({ ok: true });
}
