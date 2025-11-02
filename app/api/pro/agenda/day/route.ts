import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

function zonedDate(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {});
  const y = Number(parts.year);
  const m = Number(parts.month);
  const d = Number(parts.day);
  const h = Number(parts.hour || "0");
  const min = Number(parts.minute || "0");
  const s = Number(parts.second || "0");
  return new Date(Date.UTC(y, m - 1, d, h, min, s));
}
function startOfDayTZ(date: Date, timeZone: string) {
  const z = zonedDate(date, timeZone);
  return new Date(Date.UTC(z.getUTCFullYear(), z.getUTCMonth(), z.getUTCDate(), 0, 0, 0));
}
function endOfDayTZ(date: Date, timeZone: string) {
  const start = startOfDayTZ(date, timeZone);
  const x = new Date(start);
  x.setUTCDate(x.getUTCDate() + 1);
  return x;
}

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cookieStore = cookies();
  const url = new URL(req.url);
  const businessId = url.searchParams.get("business_id") || cookieStore.get("business_id")?.value || ctx.assignments[0]?.business_id;
  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });
  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const dateParam = url.searchParams.get("date"); // yyyy-mm-dd
  const base = dateParam ? new Date(dateParam + "T00:00:00Z") : new Date();
  const primaryLoc = await prisma.business_locations.findFirst({ where: { business_id: businessId, is_primary: true }, select: { timezone: true } });
  const tz = primaryLoc?.timezone || "Europe/Paris";
  const from = startOfDayTZ(base, tz);
  const to = endOfDayTZ(base, tz);

  // Parse filters
  const employeeIds = url.searchParams.getAll("employee_id").filter(Boolean)
  const statuses = url.searchParams.getAll("status").filter(Boolean)
  const search = url.searchParams.get("search") || ""
  const categories = url.searchParams.getAll("category").filter(Boolean)

  const nameFilters = [search, ...categories].filter(Boolean)
  const serviceFilters = url.searchParams.getAll("service").filter(Boolean)

  // Fetch reservations for the day with employee and items
  const reservations = await prisma.reservations.findMany({
    where: {
      business_id: businessId,
      starts_at: { gte: from, lt: to },
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

  // Group by employee
  const byEmployee: Record<string, { employee_id: string | null; employee_name: string; items: any[] }> = {};
  for (const r of reservations) {
    const employeeId = r.employee_id || "none";
    const employeeName = r.employees?.full_name || "Aucun";
    const duration = r.reservation_items.reduce((s: number, it: any) => s + (it.duration_minutes ?? it.service_variants?.duration_minutes ?? 0), 0);
    const price = r.reservation_items.reduce((s: number, it: any) => s + (it.price_cents ?? it.service_variants?.price_cents ?? 0), 0);
    const titleParts = r.reservation_items.map((it) => {
      const sname = it.services?.name || "Service";
      const vname = it.service_variants?.name ? ` - ${it.service_variants.name}` : "";
      return sname + vname;
    }).filter(Boolean);
    const client = [r.clients?.first_name || "", r.clients?.last_name || ""].join(" ").trim();

    if (!byEmployee[employeeId]) byEmployee[employeeId] = { employee_id: r.employee_id || null, employee_name: employeeName, items: [] };
    byEmployee[employeeId].items.push({
      id: r.id,
      start: r.starts_at,
      end: r.ends_at,
      status: r.status,
      title: titleParts.join(" + ") || "Rendez-vous",
      client,
      client_phone: r.clients?.phone || undefined,
      client_email: (r.clients as any)?.users?.email || undefined,
      duration_minutes: duration,
      price_cents: price,
      notes: r.notes || "",
    });
  }

  const employees = Object.values(byEmployee).sort((a,b)=> (a.employee_name||"").localeCompare(b.employee_name||""));
  return NextResponse.json({ date: from.toISOString().slice(0,10), employees });
}
