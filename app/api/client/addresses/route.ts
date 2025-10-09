import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromCookies } from "@/lib/auth";

// List addresses of current user
export async function GET() {
  const user = await getAuthUserFromCookies();
  if (!user) return NextResponse.json({ addresses: [] }, { status: 401 });

  const addresses = await prisma.addresses.findMany({
    where: { user_id: user.id },
    orderBy: [{ is_default: "desc" }, { label: "asc" }],
    include: { cities: { select: { name: true } }, countries: { select: { code: true, name: true } } },
  });
  return NextResponse.json({ addresses });
}

// Create address
export async function POST(request: Request) {
  const user = await getAuthUserFromCookies();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const { label, line1, line2, postal_code, city_id, country_code, latitude, longitude, is_default } = body;
  if (!line1) return NextResponse.json({ error: "Missing line1" }, { status: 400 });

  const created = await prisma.$transaction(async (tx) => {
    if (is_default) {
      await tx.addresses.updateMany({ where: { user_id: user.id, is_default: true }, data: { is_default: false } });
    }
    const addr = await tx.addresses.create({
      data: {
        user_id: user.id,
        label: label ?? null,
        line1,
        line2: line2 ?? null,
        postal_code: postal_code ?? null,
        city_id: city_id ?? null,
        country_code: country_code ?? null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        is_default: Boolean(is_default),
      },
    });
    return addr;
  });

  return NextResponse.json({ address: created });
}

// Update address by id (must belong to user)
export async function PUT(request: Request) {
  const user = await getAuthUserFromCookies();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const existing = await prisma.addresses.findUnique({ where: { id } });
  if (!existing || existing.user_id !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.$transaction(async (tx) => {
    if (data.is_default === true) {
      await tx.addresses.updateMany({ where: { user_id: user.id, is_default: true }, data: { is_default: false } });
    }
    const allow: any = {};
    if ("label" in data) allow.label = data.label ?? null;
    if ("line1" in data) allow.line1 = data.line1;
    if ("line2" in data) allow.line2 = data.line2 ?? null;
    if ("postal_code" in data) allow.postal_code = data.postal_code ?? null;
    if ("city_id" in data) allow.city_id = data.city_id ?? null;
    if ("country_code" in data) allow.country_code = data.country_code ?? null;
    if ("latitude" in data) allow.latitude = data.latitude ?? null;
    if ("longitude" in data) allow.longitude = data.longitude ?? null;
    if ("is_default" in data) allow.is_default = Boolean(data.is_default);

    const addr = await tx.addresses.update({ where: { id }, data: allow });
    return addr;
  });

  return NextResponse.json({ address: updated });
}

// Delete address by id (must belong to user)
export async function DELETE(request: Request) {
  const user = await getAuthUserFromCookies();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || (await request.json().catch(() => ({}))).id;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const existing = await prisma.addresses.findUnique({ where: { id } });
  if (!existing || existing.user_id !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.addresses.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
