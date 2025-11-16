import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { createHash } from "crypto";
import { createSession, hashPassword } from "@/lib/auth";

function getIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.ip || "";
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const rl = rateLimit(`claim-complete:${ip}`, 10, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { token, password, rc_number, rc_document_url, id_document_front_url, id_document_back_url, complete_now } = body || {};

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  // Verify token
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const claim = await prisma.claims.findUnique({
    where: { claim_token: tokenHash },
    include: {
      businesses: true,
      users: true,
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

  // Update password if provided
  if (password) {
    if (password.length < 8) {
      return NextResponse.json({ error: "Password too short" }, { status: 400 });
    }
    const newHash = await hashPassword(password);
    await prisma.users.update({
      where: { id: claim.user_id },
      data: { password_hash: newHash, updated_at: new Date() },
    });
  }

  // Update claim with documents if provided
  const updateData: any = {
    updated_at: new Date(),
  };

  if (rc_number) updateData.rc_number = rc_number;
  if (rc_document_url) updateData.rc_document_url = rc_document_url;
  if (id_document_front_url) updateData.id_document_front_url = id_document_front_url;
  if (id_document_back_url) updateData.id_document_back_url = id_document_back_url;

  // Check if all required documents are provided
  const hasAllDocuments = rc_document_url && id_document_front_url && id_document_back_url;

  if (hasAllDocuments) {
    updateData.documents_submitted = true;
    updateData.documents_submitted_at = new Date();
    updateData.status = "documents_submitted";
  } else {
    updateData.status = "documents_pending";
  }

  await prisma.claims.update({
    where: { id: claim.id },
    data: updateData,
  });

  // If complete_now is true and all documents are provided, create business verification
  if (complete_now && hasAllDocuments) {
    // Create or update business verification
    const existingVerification = await prisma.business_verifications.findFirst({
      where: { business_id: claim.business_id },
    });

    if (existingVerification) {
      await prisma.business_verifications.update({
        where: { id: existingVerification.id },
        data: {
          rc_number: rc_number || existingVerification.rc_number,
          rc_document_url: rc_document_url || existingVerification.rc_document_url,
          id_document_front_url: id_document_front_url || existingVerification.id_document_front_url,
          id_document_back_url: id_document_back_url || existingVerification.id_document_back_url,
          status: "pending",
          updated_at: new Date(),
        },
      });
    } else {
      await prisma.business_verifications.create({
        data: {
          business_id: claim.business_id,
          rc_number: rc_number || null,
          rc_document_url: rc_document_url || null,
          id_document_front_url: id_document_front_url || null,
          id_document_back_url: id_document_back_url || null,
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

  // Create session if password was set
  let sessionResponse = null;
  if (password) {
    sessionResponse = await createSession(claim.user_id);
  }

  // Ensure user has PRO role
  try {
    const proRole = await prisma.roles.findUnique({ where: { code: "PRO" } });
    if (proRole) {
      await prisma.user_roles.upsert({
        where: {
          user_id_role_id_business_id: {
            user_id: claim.user_id,
            role_id: proRole.id,
            business_id: claim.business_id,
          } as any,
        },
        update: {},
        create: {
          user_id: claim.user_id,
          role_id: proRole.id,
          business_id: claim.business_id,
        },
      } as any);
    }
  } catch {}

  // Event log
  await prisma.event_logs.create({
    data: {
      user_id: claim.user_id,
      business_id: claim.business_id,
      event_name: "claim.completed",
      payload: { claim_id: claim.id, complete_now, has_all_documents: hasAllDocuments },
    },
  }).catch(() => {});

  if (sessionResponse) {
    return sessionResponse; // Returns { ok: true } with cookies
  }

  return NextResponse.json({
    ok: true,
    message: complete_now && hasAllDocuments
      ? "Documents submitted and verification requested"
      : "Documents saved. You can complete later.",
    has_all_documents: hasAllDocuments,
  });
}

