import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getAuthContext } from "@/lib/authorization";

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
        allowed = codes.has("clients_view") || codes.has("clients_manage");
      }
    } catch {}
  }
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const sort = url.searchParams.get("sort") || "lastVisit"; // name | lastVisit | totalBookings
  const statusFilter = (url.searchParams.get("status") || "").toUpperCase(); // VIP|REGULIER|NOUVEAU|AUCUN
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);
  const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);

  // Fetch reservations for this business and aggregate per client
  const reservations = await prisma.reservations.findMany({
    where: { business_id: businessId, client_id: { not: null } },
    select: { client_id: true, starts_at: true, id: true },
    orderBy: { starts_at: "desc" },
  });
  const reservationClientIds = Array.from(new Set(reservations.map((r) => r.client_id!).filter(Boolean)));

  // Also include clients explicitly linked to this business (favorites as association)
  const favorites = await prisma.client_favorites.findMany({
    where: { business_id: businessId },
    select: { client_id: true },
  });
  const favoriteClientIds = Array.from(new Set(favorites.map((f) => f.client_id)));

  const clientIds = Array.from(new Set([...reservationClientIds, ...favoriteClientIds]));

  // Basic client info
  let clients: any[] = await prisma.clients.findMany({
    where: {
      id: { in: clientIds },
      ...(statusFilter && { status: statusFilter as any }),
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      phone: true,
      status: true,
      users: { select: { email: true, first_name: true, last_name: true } },
    },
  } as any);

  // Search filter (name/email/phone)
  if (q) {
    const qLower = q.toLowerCase();
    clients = clients.filter((c) => {
      const name = `${c.first_name || c.users?.first_name || ""} ${c.last_name || c.users?.last_name || ""}`.toLowerCase();
      const email = (c.users?.email || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      return name.includes(qLower) || email.includes(qLower) || phone.includes(qLower);
    });
  }

  // Aggregates: lastVisit and totalBookings per client
  const lastVisitMap = new Map<string, Date>();
  const bookingsCount = new Map<string, number>();
  for (const r of reservations) {
    const cid = r.client_id!;
    bookingsCount.set(cid, (bookingsCount.get(cid) || 0) + 1);
    if (!lastVisitMap.has(cid) || (lastVisitMap.get(cid) as Date) < r.starts_at) {
      lastVisitMap.set(cid, r.starts_at);
    }
  }

  // Build rows
  type Row = { id: string; name: string; email: string | null; phone: string | null; lastVisit: Date | null; totalBookings: number; totalSpent: number; status?: string | null };
  const rows: Row[] = clients.map((c) => ({
    id: c.id,
    name: `${c.first_name || c.users?.first_name || ""} ${c.last_name || c.users?.last_name || ""}`.trim() || "Client",
    email: c.users?.email || null,
    phone: c.phone || null,
    lastVisit: lastVisitMap.get(c.id) || null,
    totalBookings: bookingsCount.get(c.id) || 0,
    totalSpent: 0, // Optional: compute via payments if needed later
    status: c.status || null,
  }));

  // Sort
  rows.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "totalBookings") return (b.totalBookings - a.totalBookings) || a.name.localeCompare(b.name);
    // lastVisit default
    const da = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
    const db = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
    return db - da;
  });

  const paged = rows.slice(offset, offset + limit);
  return NextResponse.json({ items: paged, total: rows.length });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Not strictly tied to a business; clients are global. But we keep auth for Pro/Admin only.
  let allowed = ctx.roles.includes("ADMIN") || ctx.assignments.length > 0;
  if (!allowed) {
    try {
      const acc = await prisma.employee_accounts.findUnique({ where: { user_id: ctx.userId } }).catch(() => null);
      if (acc) {
        // No business context here; accept if employee has any clients_manage in any assignment for safety, or skip check.
        const perms = await prisma.employee_permissions.findMany({
          where: { employee_id: acc.employee_id },
          include: { pro_permissions: { select: { code: true } } },
        } as any);
        const codes = new Set<string>(perms.map((p: any) => p.pro_permissions?.code).filter(Boolean));
        allowed = codes.has("clients_manage");
      }
    } catch {}
  }
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { first_name, last_name, email, phone, notes, status } = body;
  if (!first_name && !last_name && !email) return NextResponse.json({ error: "first_name, last_name or email required" }, { status: 400 });

  let userId: string | undefined = undefined;
  if (email) {
    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) userId = existing.id;
  }

  const statusValue = typeof status === "string" ? status.toUpperCase() : undefined;
  const created = await prisma.clients.create({
    data: ({ first_name, last_name, phone, notes, user_id: userId, ...(statusValue ? { status: statusValue as any } : {}) } as any),
    select: { id: true },
  });
  // Link to current business so it shows up in list immediately
  try {
    const businessId = getBusinessId(req, ctx);
    if (businessId) {
      await prisma.client_favorites.create({ data: { client_id: created.id, business_id: businessId } }).catch(() => {});
    }
  } catch {}
  return NextResponse.json({ id: created.id }, { status: 201 });
}
