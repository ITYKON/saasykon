import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";

function isUuid(id: string) { return /^[0-9a-fA-F-]{36}$/.test(id); }

async function requireAccess(employeeId: string) {
  const ctx = await getAuthContext();
  if (!ctx) return { status: 401 as const, error: "Unauthorized" };
  if (!isUuid(employeeId)) return { status: 400 as const, error: "Invalid employee id" };
  const emp = await prisma.employees.findUnique({ where: { id: employeeId }, select: { id: true, business_id: true } });
  if (!emp) return { status: 404 as const, error: "Not found" };
  const allowed = ctx.roles.includes("ADMIN") || ctx.assignments.some((a) => a.business_id === emp.business_id && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
  if (!allowed) return { status: 403 as const, error: "Forbidden" };
  return { status: 200 as const, emp, ctx };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireAccess(params.id);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const where: any = { employee_id: params.id };
  if (from) where.starts_at = { gte: new Date(from) };
  if (to) where.ends_at = { ...(where.ends_at || {}), lte: new Date(to) };
  const rows = await prisma.time_off.findMany({ where, orderBy: { starts_at: "asc" } });
  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireAccess(params.id);
  if (access.status !== 200) return NextResponse.json({ error: access.error }, { status: access.status });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { starts_at, ends_at, reason } = body;
  if (!starts_at || !ends_at) return NextResponse.json({ error: "starts_at and ends_at required" }, { status: 400 });

  const created = await prisma.time_off.create({ data: { employee_id: params.id, starts_at: new Date(starts_at), ends_at: new Date(ends_at), reason: reason || null }, select: { id: true } });
  return NextResponse.json({ id: created.id }, { status: 201 });
}
