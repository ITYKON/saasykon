import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { getAuthUserFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { token, claim_id, rc_number, rc_document_url, id_document_front_url, id_document_back_url } = body || {};

  let claim;
  
  // Support both token and claim_id
  if (claim_id) {
    const claimIdNum = typeof claim_id === "string" ? parseInt(claim_id, 10) : claim_id;
    if (isNaN(claimIdNum)) {
      return NextResponse.json({ error: "Invalid claim_id" }, { status: 400 });
    }
    claim = await prisma.claims.findUnique({
      where: { id: claimIdNum },
    });
    
    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }
    
    if (claim.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  } else if (token) {
    // Verify token
    const tokenHash = createHash("sha256").update(token).digest("hex");
    claim = await prisma.claims.findUnique({
      where: { claim_token: tokenHash },
    });

    if (!claim) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    if (claim.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: "Token or claim_id required" }, { status: 400 });
  }

  if (claim.status === "approved" || claim.status === "rejected") {
    return NextResponse.json({ error: "Claim already processed" }, { status: 400 });
  }

  // Update claim with documents
  const updateData: any = {
    updated_at: new Date(),
  };

  if (rc_number) updateData.rc_number = rc_number;
  if (rc_document_url) updateData.rc_document_url = rc_document_url;
  if (id_document_front_url) updateData.id_document_front_url = id_document_front_url;
  if (id_document_back_url) updateData.id_document_back_url = id_document_back_url;

  // Check if all required documents are provided
  const hasAllDocuments = (rc_document_url || claim.rc_document_url) &&
    (id_document_front_url || claim.id_document_front_url) &&
    (id_document_back_url || claim.id_document_back_url);

  if (hasAllDocuments) {
    updateData.documents_submitted = true;
    updateData.documents_submitted_at = new Date();
    updateData.status = "documents_submitted";
  } else {
    updateData.status = "pending";
  }

  await prisma.claims.update({
    where: { id: claim.id },
    data: updateData,
  });

  // Create or update business verification
  if (hasAllDocuments) {
    const existingVerification = await prisma.business_verifications.findFirst({
      where: { business_id: claim.business_id },
    });

    if (existingVerification) {
      await prisma.business_verifications.update({
        where: { id: existingVerification.id },
        data: {
          rc_number: rc_number || claim.rc_number || existingVerification.rc_number,
          rc_document_url: rc_document_url || claim.rc_document_url || existingVerification.rc_document_url,
          id_document_front_url: id_document_front_url || claim.id_document_front_url || existingVerification.id_document_front_url,
          id_document_back_url: id_document_back_url || claim.id_document_back_url || existingVerification.id_document_back_url,
          status: "pending",
          updated_at: new Date(),
        },
      });
    } else {
      await prisma.business_verifications.create({
        data: {
          business_id: claim.business_id,
          rc_number: rc_number || claim.rc_number || null,
          rc_document_url: rc_document_url || claim.rc_document_url || null,
          id_document_front_url: id_document_front_url || claim.id_document_front_url || null,
          id_document_back_url: id_document_back_url || claim.id_document_back_url || null,
          status: "pending",
        },
      });
    }

    // Update business claim_status
    await prisma.businesses.update({
      where: { id: claim.business_id },
      data: {
        claim_status: "documents_submitted",
        updated_at: new Date(),
      },
    });
  }

  return NextResponse.json({
    ok: true,
    has_all_documents: hasAllDocuments,
    message: hasAllDocuments
      ? "All documents submitted. Waiting for verification."
      : "Documents updated. Please submit all required documents.",
  });
}

