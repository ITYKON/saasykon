import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x }
function startOfMonth(d: Date) { const x = startOfDay(d); x.setDate(1); return x }

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cookieStore = cookies();
  const url = new URL(req.url);
  const businessId = url.searchParams.get("business_id") || cookieStore.get("business_id")?.value || ctx.assignments[0]?.business_id;
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });
  const allowed = ctx.roles.includes("ADMIN") || 
                  ctx.permissions.includes("agenda_view") ||
                  ctx.assignments.some((a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const dateParam = url.searchParams.get("date"); // yyyy-mm-dd
  const base = dateParam ? new Date(dateParam + "T00:00:00") : new Date();
  const monthStart = startOfMonth(base);
  const monthEnd = new Date(monthStart); monthEnd.setMonth(monthEnd.getMonth() + 1);

  // Parse filters
  const employeeIds = url.searchParams.getAll("employee_id").filter(Boolean)
  const statuses = url.searchParams.getAll("status").filter(Boolean)
  const search = url.searchParams.get("search") || ""
  const categories = url.searchParams.getAll("category").filter(Boolean)
  const nameFilters = [search, ...categories].filter(Boolean)
  const serviceFilters = url.searchParams.getAll("service").filter(Boolean)

  const reservations = await prisma.reservations.findMany({
    where: {
      business_id: businessId,
      starts_at: { gte: monthStart, lt: monthEnd },
      ...(employeeIds.length ? { employee_id: { in: employeeIds } } : {}),
      ...(statuses.length ? { status: { in: statuses as any } } : {}),
      ...(nameFilters.length ? {
        OR: [
          { reservation_items: { some: { services: { name: { contains: nameFilters[0], mode: 'insensitive' } } } } },
          { reservation_items: { some: { service_variants: { name: { contains: nameFilters[0], mode: 'insensitive' } } } } },
          { clients: { OR: [
            { first_name: { contains: nameFilters[0], mode: 'insensitive' } },
            { last_name: { contains: nameFilters[0], mode: 'insensitive' } },
          ]}},
          ...nameFilters.slice(1).flatMap((q)=> ([
            { reservation_items: { some: { services: { name: { contains: q, mode: 'insensitive' } } } } },
            { reservation_items: { some: { service_variants: { name: { contains: q, mode: 'insensitive' } } } } },
          ] as any))
        ]
      } : {}),
      ...(serviceFilters.length ? {
        OR: [
          ...serviceFilters.map((q)=> ({ reservation_items: { some: { services: { name: { contains: q, mode: 'insensitive' } } } } })),
          ...serviceFilters.map((q)=> ({ reservation_items: { some: { service_variants: { name: { contains: q, mode: 'insensitive' } } } } })),
        ]
      } : {}),
    },
    orderBy: { starts_at: "asc" },
    include: {
      employees: { select: { id: true, full_name: true } },
      clients: { select: { first_name: true, last_name: true, phone: true, users: { select: { email: true } } } },
      reservation_items: {
        select: {
          price_cents: true,
          duration_minutes: true,
          services: { select: { name: true } },
          service_variants: { select: { name: true, duration_minutes: true, price_cents: true } },
        },
      },
    },
  }) as any[];

  const days: Record<string, Array<{ time?: string; title: string; employee?: string; duration_minutes?: number; price_cents?: number; reservation_id: string; client?: string; client_phone?: string; client_email?: string }>> = {};

  for (const r of reservations) {
    const dKey = new Date(r.starts_at).toISOString().slice(0,10);
    const hh = new Date(r.starts_at).getHours().toString().padStart(2,'0');
    const mm = new Date(r.starts_at).getMinutes().toString().padStart(2,'0');
    const time = `${hh}:${mm}`;
    const employeeName = r.employees?.full_name || undefined;
    const duration = r.reservation_items.reduce((s: number, it: any) => s + (it.duration_minutes ?? it.service_variants?.duration_minutes ?? 0), 0);
    const price = r.reservation_items.reduce((s: number, it: any) => s + (it.price_cents ?? it.service_variants?.price_cents ?? 0), 0);
    const titleParts = r.reservation_items.map((it: any) => {
      const sname = it.services?.name || "Service";
      const vname = it.service_variants?.name ? ` - ${it.service_variants.name}` : "";
      return sname + vname;
    }).filter(Boolean);
    const client = [r.clients?.first_name || "", r.clients?.last_name || ""].join(" ").trim();

    if (!days[dKey]) days[dKey] = [];
    days[dKey].push({
      time,
      title: titleParts.join(" + ") || "Rendez-vous",
      employee: employeeName,
      duration_minutes: duration,
      price_cents: price,
      reservation_id: r.id,
      client,
      client_phone: r.clients?.phone || undefined,
      client_email: (r.clients as any)?.users?.email || undefined,
    });
  }

  return NextResponse.json({ month: monthStart.toISOString().slice(0,7), days });
}
