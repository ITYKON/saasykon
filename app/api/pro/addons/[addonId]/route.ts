import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";

function isUuid(id: string) {
  return /^[0-9a-fA-F-]{36}$/.test(id);
}

async function requireAddonAccess(_req: NextRequest, addonId: string) {
  const ctx = await getAuthContext();
  if (!ctx) return { status: 401 as const, error: "Unauthorized" };
  if (!isUuid(addonId)) return { status: 400 as const, error: "Invalid addon id" };

  const addon = await prisma.service_addons.findUnique({
    where: { id: addonId },
    select: { id: true, services: { select: { business_id: true } } },
  } as any);
  if (!addon) return { status: 404 as const, error: "Not found" };

  const businessId = (addon as any).services.business_id as string;
  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return { status: 403 as const, error: "Forbidden" };

  return { status: 200 as const, businessId, ctx };
}

export async function PATCH(req: NextRequest, { params }: { params: { addonId: string } }) {
  const access = await requireAddonAccess(req, params.addonId);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { name, duration_minutes, price_cents, currency, is_active } = body || {};

  const updated = await prisma.service_addons.update({
    where: { id: params.addonId },
    data: ({
      ...(typeof name === "string" ? { name } : {}),
      ...(typeof duration_minutes === "number" ? { duration_minutes } : {}),
      ...(typeof price_cents === "number" ? { price_cents } : {}),
      ...(typeof currency === "string" ? { currency } : {}),
      ...(typeof is_active === "boolean" ? { is_active } : {}),
    } as any),
    select: { id: true },
  });

  return NextResponse.json({ id: updated.id });
}

export async function DELETE(_req: NextRequest, { params }: { params: { addonId: string } }) {
  const access = await requireAddonAccess(_req, params.addonId);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });
  await prisma.service_addons.update({ where: { id: params.addonId }, data: { is_active: false } });
  return NextResponse.json({ ok: true });
}
