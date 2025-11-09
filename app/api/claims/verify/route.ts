import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const claim = await prisma.claims.findUnique({
    where: { claim_token: tokenHash },
    include: {
      businesses: {
        select: {
          id: true,
          public_name: true,
          legal_name: true,
        },
      },
      users: {
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          password_hash: true,
        },
      },
    },
  });

  if (!claim) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  if (claim.token_expires_at && claim.token_expires_at < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 400 });
  }

  if (claim.status === "approved" || claim.status === "rejected") {
    return NextResponse.json({ error: "Claim already processed" }, { status: 400 });
  }

  // Calculate days remaining
  const now = new Date();
  const daysRemaining = claim.expires_at
    ? Math.max(0, Math.ceil((claim.expires_at.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 7;

  return NextResponse.json({
    ok: true,
    claim: {
      id: claim.id,
      full_name: claim.full_name,
      email: claim.email,
      phone: claim.phone,
      status: claim.status,
      documents_submitted: claim.documents_submitted,
      days_remaining: daysRemaining,
      business: claim.businesses,
      user: {
        id: claim.users.id,
        email: claim.users.email,
        has_password: !!claim.users.password_hash,
      },
    },
  });
}

