import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromCookies } from "@/lib/auth";

// GET: return only the primary (default) address for the user (or first if none flagged)
export async function GET() {
  const user = await getAuthUserFromCookies();
  if (!user) return NextResponse.json({ address: null }, { status: 401 });

  const all = await prisma.addresses.findMany({
    where: { user_id: user.id },
    orderBy: [{ is_default: "desc" }, { label: "asc" }],
    include: { cities: { select: { name: true } }, countries: { select: { code: true, name: true } } },
  });
  const address = all[0] || null;
  return NextResponse.json({ address });
}

// PUT: upsert the user's single primary address (replaces previous)
export async function PUT(request: Request) {
  const user = await getAuthUserFromCookies();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({} as any));
  if (!body.line1) return NextResponse.json({ error: "Missing line1" }, { status: 400 });

  const updated = await prisma.$transaction(async (tx) => {
    // unset previous defaults
    await tx.addresses.updateMany({ where: { user_id: user.id, is_default: true }, data: { is_default: false } });

    if (body.id) {
      // update existing and set default
      const addr = await tx.addresses.update({
        where: { id: body.id },
        data: {
          user_id: user.id,
          label: body.label ?? null,
          line1: body.line1,
          line2: body.line2 ?? null,
          postal_code: body.postal_code ?? null,
          city_id: body.city_id ?? null,
          country_code: body.country_code ?? null,
          latitude: body.latitude ?? null,
          longitude: body.longitude ?? null,
          is_default: true,
        },
      });
      return addr;
    }

    // create new default address
    const addr = await tx.addresses.create({
      data: {
        user_id: user.id,
        label: body.label ?? null,
        line1: body.line1,
        line2: body.line2 ?? null,
        postal_code: body.postal_code ?? null,
        city_id: body.city_id ?? null,
        country_code: body.country_code ?? null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        is_default: true,
      },
    });
    return addr;
  });

  return NextResponse.json({ address: updated });
}
