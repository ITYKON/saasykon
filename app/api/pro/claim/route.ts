import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromCookies } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find active claims for this user
  const claims = await prisma.claims.findMany({
    where: {
      user_id: user.id,
      status: { in: ["pending", "documents_pending", "documents_submitted"] },
    },
    include: {
      businesses: {
        select: {
          id: true,
          public_name: true,
          legal_name: true,
          claim_status: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  if (claims.length === 0) {
    return NextResponse.json({ claim: null });
  }

  const claim = claims[0]; // Get the most recent claim

  // Calculate days remaining
  const now = new Date();
  const daysRemaining = claim.expires_at
    ? Math.max(0, Math.ceil((claim.expires_at.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 7;

  // Check if documents are missing
  const hasAllDocuments = !!(claim.rc_document_url && claim.id_document_front_url && claim.id_document_back_url);
  const isExpired = claim.expires_at && claim.expires_at < now;
  const isBlocked = isExpired && !hasAllDocuments;

  return NextResponse.json({
    claim: {
      id: claim.id,
      status: claim.status,
      documents_submitted: claim.documents_submitted,
      has_all_documents: hasAllDocuments,
      days_remaining: daysRemaining,
      is_expired: isExpired,
      is_blocked: isBlocked,
      business: claim.businesses,
      rc_document_url: claim.rc_document_url,
      id_document_front_url: claim.id_document_front_url,
      id_document_back_url: claim.id_document_back_url,
      expires_at: claim.expires_at,
    },
  });
}

