import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";

function isUuid(id: string) {
  return /^[0-9a-fA-F-]{36}$/.test(id);
}

async function ensureAuth(clientId: string) {
  const ctx = await getAuthContext();
  if (!ctx) return { status: 401 as const, error: "Unauthorized" };
  // Any Pro or Admin can manage clients; if you need stricter scoping, join via reservations or favorites.
  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.length > 0;
  if (!allowed) return { status: 403 as const, error: "Forbidden" };
  if (!isUuid(clientId)) return { status: 400 as const, error: "Invalid client id" };
  // Optionally verify client exists
  const exists = await prisma.clients.findUnique({ where: { id: clientId }, select: { id: true } });
  if (!exists) return { status: 404 as const, error: "Not found" };
  return { status: 200 as const };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { status, error } = await ensureAuth(params.id);
  if (status !== 200) return NextResponse.json({ error }, { status });
  const client = await prisma.clients.findUnique({
    where: { id: params.id },
    select: ({
      id: true,
      first_name: true,
      last_name: true,
      phone: true,
      status: true,
      notes: true,
      users: { select: { email: true, first_name: true, last_name: true } },
      reservations: { select: { id: true, starts_at: true, status: true }, orderBy: { starts_at: "desc" }, take: 10 },
      reviews: { select: { id: true, rating: true, comment: true, created_at: true }, orderBy: { created_at: "desc" }, take: 10 },
    } as any),
  });
  return NextResponse.json({ client });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { status, error } = await ensureAuth(params.id);
  if (status !== 200) return NextResponse.json({ error }, { status });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { first_name, last_name, phone, notes, status: newStatus } = body;
  const statusValue = typeof newStatus === "string" ? newStatus.toUpperCase() : undefined;
  const updated = await prisma.clients.update({ where: { id: params.id }, data: ({ first_name, last_name, phone, notes, ...(statusValue ? { status: statusValue as any } : {}) } as any), select: { id: true } });
  return NextResponse.json({ id: updated.id });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { status, error } = await ensureAuth(params.id);
  if (status !== 200) return NextResponse.json({ error }, { status });
  await prisma.clients.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
