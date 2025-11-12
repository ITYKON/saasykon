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

  // Ne pas bloquer si la revendication est déjà approuvée
  if (claim.status === "rejected") {
    return NextResponse.json({ error: "Cette revendication a été rejetée" }, { status: 400 });
  }

  // Calculate days remaining
  const now = new Date();
  const daysRemaining = claim.expires_at
    ? Math.max(0, Math.ceil((claim.expires_at.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 7;

  const responseData = {
    ok: true,
    claim: {
      id: claim.id,
      full_name: claim.full_name,
      email: claim.email,
      phone: claim.phone,
      status: claim.status,
      documents_submitted: claim.documents_submitted,
      rc_number: claim.rc_number,
      rc_document_url: claim.rc_document_url,
      id_document_front_url: claim.id_document_front_url,
      id_document_back_url: claim.id_document_back_url,
      days_remaining: daysRemaining,
      business: claim.businesses,
      user: {
        id: claim.users.id,
        email: claim.users.email,
        has_password: !!claim.users.password_hash,
      },
    },
  };

  // Vérifier si la requête vient déjà d'une redirection pour éviter les boucles
  const isFromRedirect = req.headers.get('x-from-redirect') === 'true';
  
  // Si c'est une requête directe avec token et pas déjà une redirection
  if (token && !isFromRedirect) {
    const onboardingUrl = new URL('/claims/onboarding', req.nextUrl.origin);
    onboardingUrl.searchParams.set('token', token);
    
    // Ajouter un en-tête pour éviter les boucles de redirection
    const response = NextResponse.redirect(onboardingUrl);
    response.headers.set('x-from-redirect', 'true');
    return response;
  }

  // Si c'est une requête AJAX ou déjà une redirection, retourner les données JSON
  return NextResponse.json(responseData);
}

