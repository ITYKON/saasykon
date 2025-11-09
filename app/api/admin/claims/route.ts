import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireAdminOrPermission } from "@/lib/authorization";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.roles.includes("ADMIN") && !ctx.permissions.includes("CLAIMS_VIEW") && !ctx.permissions.includes("claims")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));

  const where: any = {};
  if (status) where.status = status;

  const [total, items] = await Promise.all([
    prisma.claims.count({ where }),
    prisma.claims.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        businesses: {
          select: {
            id: true,
            public_name: true,
            legal_name: true,
            email: true,
            phone: true,
          },
        },
        users: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pageSize,
    items: items.map((claim) => ({
      id: claim.id,
      full_name: claim.full_name,
      email: claim.email,
      phone: claim.phone,
      status: claim.status,
      documents_submitted: claim.documents_submitted,
      documents_submitted_at: claim.documents_submitted_at,
      rc_number: claim.rc_number,
      rc_document_url: claim.rc_document_url,
      id_document_front_url: claim.id_document_front_url,
      id_document_back_url: claim.id_document_back_url,
      created_at: claim.created_at,
      updated_at: claim.updated_at,
      expires_at: claim.expires_at,
      business: claim.businesses,
      user: claim.users,
    })),
  });
}

