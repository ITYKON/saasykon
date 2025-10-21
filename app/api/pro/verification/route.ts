import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromCookies } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUserFromCookies();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await prisma.businesses.findFirst({ where: { owner_user_id: user.id } });
  if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

  const verif = await prisma.business_verifications.findFirst({
    where: { business_id: business.id },
    orderBy: { created_at: "desc" },
  });

  const item = verif
    ? {
        id: verif.id,
        business_id: verif.business_id,
        status: verif.status,
        rc_number: verif.rc_number,
        rc_document_url: verif.rc_document_url,
        id_document_front_url: verif.id_document_front_url,
        id_document_back_url: verif.id_document_back_url,
        reviewed_by: verif.reviewed_by,
        reviewed_at: verif.reviewed_at?.toISOString() || null,
        created_at: verif.created_at.toISOString(),
      }
    : null;

  return NextResponse.json({ item, business_id: business.id });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromCookies();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await prisma.businesses.findFirst({ where: { owner_user_id: user.id } });
  if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const data = {
    rc_number: body?.rc_number ?? null,
    rc_document_url: body?.rc_document_url ?? null,
    id_document_front_url: body?.id_document_front_url ?? null,
    id_document_back_url: body?.id_document_back_url ?? null,
    status: "pending" as any,
    reviewed_by: null as any,
    reviewed_at: null as any,
    updated_at: new Date(),
  };

  const existing = await prisma.business_verifications.findFirst({ where: { business_id: business.id } });
  if (existing) {
    await prisma.business_verifications.update({ where: { id: existing.id }, data });
  } else {
    await prisma.business_verifications.create({ data: { business_id: business.id, ...data } });
  }

  await prisma.businesses.update({ where: { id: business.id }, data: { status: "pending_verification" as any } });

  return NextResponse.json({ ok: true });
}
