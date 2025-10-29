import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";

function toDate(value: string) { const d = new Date(value); if (isNaN(d.getTime())) throw new Error("Invalid date"); return d; }

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = params.id;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const reservation = await prisma.reservations.findUnique({
    where: { id },
    include: {
      clients: { select: { id: true, first_name: true, last_name: true, phone: true, users: { select: { email: true } } } },
      employees: { select: { id: true, full_name: true } },
      reservation_items: {
        select: {
          id: true,
          service_id: true,
          variant_id: true,
          employee_id: true,
          price_cents: true,
          duration_minutes: true,
          services: { select: { id: true, name: true } },
          service_variants: { select: { id: true, name: true, duration_minutes: true, price_cents: true } },
        }
      }
    }
  });
  if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === reservation.business_id && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ reservation });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = params.id;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Find reservation to check business and permissions
  const existing = await prisma.reservations.findUnique({ where: { id }, select: { business_id: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bizId = existing.business_id;
  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === bizId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.reservations.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = params.id;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const existing = await prisma.reservations.findUnique({ where: { id }, include: { reservation_items: { select: { duration_minutes: true } } } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bizId = existing.business_id;
  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === bizId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { starts_at, employee_id, status, notes, client_id, items } = body || {};

  // Map status from either enum or localized labels to DB enum
  const STATUS_MAP: Record<string, string> = {
    CONFIRMED: 'CONFIRMED',
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    // French labels
    Confirmé: 'CONFIRMED',
    "En attente": 'PENDING',
    Terminé: 'COMPLETED',
    Annulé: 'CANCELLED',
  };

  let startDate = undefined as Date | undefined;
  if (starts_at) {
    startDate = typeof starts_at === 'string' ? toDate(starts_at) : new Date(starts_at);
  }

  // Recompute end time if start provided or keep same offset from existing
  let ends_at: Date | undefined = undefined;
  if (startDate) {
    const totalMinutes = existing.reservation_items.reduce((s, it) => s + (Number(it.duration_minutes) || 0), 0);
    ends_at = new Date(startDate.getTime() + totalMinutes * 60000);
  }

  // Compute status update and cancelled_at toggle
  const statusEnum = typeof status === 'string' && STATUS_MAP[status] ? STATUS_MAP[status] as any : undefined;
  const cancelFields: any = {};
  if (typeof statusEnum === 'string') {
    if (statusEnum === 'CANCELLED') cancelFields.cancelled_at = new Date();
    else cancelFields.cancelled_at = null;
  }

  const updated = await prisma.reservations.update({
    where: { id },
    data: {
      ...(startDate ? { starts_at: startDate } : {}),
      ...(ends_at ? { ends_at } : {}),
      ...(typeof employee_id !== 'undefined' ? { employee_id: employee_id || null } : {}),
      ...(typeof statusEnum !== 'undefined' ? { status: statusEnum } : {}),
      ...(Object.prototype.hasOwnProperty.call(cancelFields, 'cancelled_at') ? { cancelled_at: cancelFields.cancelled_at } : {}),
      ...(typeof notes !== 'undefined' ? { notes: notes || null } : {}),
      ...(typeof client_id !== 'undefined' ? { client_id: client_id || null } : {}),
    },
    select: { id: true },
  });

  // Update reservation items if provided (support first item update for now)
  if (Array.isArray(items) && items.length > 0) {
    const it = items[0];
    if (it && it.id) {
      await prisma.reservation_items.update({
        where: { id: it.id },
        data: {
          ...(typeof it.service_id !== 'undefined' ? { service_id: it.service_id } : {}),
          ...(typeof it.variant_id !== 'undefined' ? { variant_id: it.variant_id || null } : {}),
          ...(typeof it.employee_id !== 'undefined' ? { employee_id: it.employee_id || null } : {}),
          ...(typeof it.price_cents !== 'undefined' ? { price_cents: Number(it.price_cents || 0) } : {}),
          ...(typeof it.duration_minutes !== 'undefined' ? { duration_minutes: Number(it.duration_minutes || 0) } : {}),
        }
      });
    }
  }

  return NextResponse.json({ id: updated.id });
}
