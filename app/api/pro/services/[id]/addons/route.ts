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

  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === service.business_id && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return { status: 403 as const, error: "Forbidden" };

  return { status: 200 as const, service, ctx };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireServiceAccess(_req, params.id);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });

  const addons = await prisma.service_addons.findMany({
    where: { service_id: params.id, is_active: true },
    orderBy: { duration_minutes: "asc" },
    select: { id: true, name: true, duration_minutes: true, price_cents: true, currency: true, is_active: true },
  });
  return NextResponse.json({ addons });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireServiceAccess(req, params.id);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { name, duration_minutes, price_cents, currency, is_active } = body || {};
  if (!name || typeof name !== "string") return NextResponse.json({ error: "name required" }, { status: 400 });
  if (typeof duration_minutes !== "number" || duration_minutes <= 0) return NextResponse.json({ error: "duration_minutes must be > 0" }, { status: 400 });
  if (typeof price_cents !== "number" || price_cents < 0) return NextResponse.json({ error: "price_cents must be >= 0" }, { status: 400 });

  const created = await prisma.service_addons.create({
    data: {
      service_id: params.id,
      name,
      duration_minutes,
      price_cents,
      currency: currency ?? "EUR",
      ...(typeof is_active === "boolean" ? { is_active } : {}),
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
