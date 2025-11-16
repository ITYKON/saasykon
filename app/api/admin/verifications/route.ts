import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrPermission } from "@/lib/authorization";

export async function GET(req: NextRequest) {
  const auth = await requireAdminOrPermission("BUSINESS_VERIFY");
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") || "").toLowerCase();
  const q = searchParams.get("q") || "";

  const where: any = {};
  if (status && status !== "all") where.status = status;
  if (q) {
    where.businesses = { public_name: { contains: q, mode: "insensitive" } } as any;
  }

  const items = await prisma.business_verifications.findMany({
    where,
    orderBy: { created_at: "desc" },
    include: { businesses: true },
    take: 100,
  });

  const data = items.map((v) => ({
    id: v.id,
    business_id: v.business_id,
    business_name: v.businesses?.public_name || v.businesses?.legal_name || "",
    status: v.status,
    rc_number: v.rc_number,
    rc_document_url: v.rc_document_url,
    id_document_front_url: v.id_document_front_url,
    id_document_back_url: v.id_document_back_url,
    reviewed_by: v.reviewed_by,
    reviewed_at: v.reviewed_at?.toISOString() || null,
    created_at: v.created_at.toISOString(),
    claim_status: v.businesses?.claim_status || null,
    business_logo: v.businesses?.logo_url || null,
  }));

  return NextResponse.json({ items: data });
}
