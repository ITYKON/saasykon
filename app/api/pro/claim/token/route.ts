import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromCookies } from "@/lib/auth";
import { createHash } from "crypto";

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find active claim for this user
  const claim = await prisma.claims.findFirst({
    where: {
      user_id: user.id,
      status: { in: ["pending", "documents_pending", "documents_submitted"] },
    },
    select: {
      id: true,
      claim_token: true,
      token_expires_at: true,
    },
    orderBy: { created_at: "desc" },
  });

  if (!claim || !claim.claim_token) {
    return NextResponse.json({ error: "No active claim found" }, { status: 404 });
  }

  // Check if token is still valid
  if (claim.token_expires_at && claim.token_expires_at < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 400 });
  }

  // Return a temporary token that can be used to complete the onboarding
  // In a real scenario, you might want to generate a new token or use a different approach
  // For now, we'll return the claim_id which can be used to complete documents
  return NextResponse.json({
    claim_id: claim.id,
    message: "Use this claim_id to complete documents via /api/claims/documents",
  });
}

