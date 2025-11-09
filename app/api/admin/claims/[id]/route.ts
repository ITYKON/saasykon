import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrPermission } from "@/lib/authorization";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminOrPermission("CLAIMS_VIEW");
  if (auth instanceof NextResponse) return auth;

  const claimId = parseInt(params.id);
  if (isNaN(claimId)) {
    return NextResponse.json({ error: "Invalid claim ID" }, { status: 400 });
  }

  const claim = await prisma.claims.findUnique({
    where: { id: claimId },
    include: {
      businesses: {
        select: {
          id: true,
          public_name: true,
          legal_name: true,
          email: true,
          phone: true,
          status: true,
          claim_status: true,
        },
      },
      users: {
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone: true,
        },
      },
    },
  });

  if (!claim) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }

  return NextResponse.json({
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
  });
}

