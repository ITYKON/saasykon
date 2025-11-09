import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { randomBytes, createHash } from "crypto";
import { sendEmail } from "@/lib/email";

function getIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.ip || "";
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const rl = rateLimit(`claim-create:${ip}`, 5, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { full_name, email, phone, business_id, business_name } = body || {};

  if (!full_name || !email || !phone) {
    return NextResponse.json({ error: "Missing required fields: full_name, email, phone" }, { status: 400 });
  }

  if (!business_id) {
    return NextResponse.json({ error: "business_id is required" }, { status: 400 });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  // Check if business exists
  const business = await prisma.businesses.findUnique({ where: { id: business_id } });
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Check if business can be claimed
  // Un salon peut être revendiqué si claim_status = "none" ou null
  // Peu importe qui est le propriétaire actuel (même si c'est un user système)
  if (business.claim_status && business.claim_status !== "none") {
    return NextResponse.json({ error: "Business already claimed or in process" }, { status: 400 });
  }
  
  // Vérifier si le salon a déjà un propriétaire réel (pas système) et n'est pas en attente de revendication
  // Si claim_status = "none", on autorise la revendication même s'il y a un owner_user_id
  // (car cela peut être un user système temporaire)

  // Check if user already exists
  let user = await prisma.users.findUnique({ where: { email: email.toLowerCase() } });

  // Create or update user
  if (!user) {
    user = await prisma.users.create({
      data: {
        email: email.toLowerCase(),
        phone: phone || null,
        first_name: full_name.split(" ")[0] || null,
        last_name: full_name.split(" ").slice(1).join(" ") || null,
        locale: "fr",
      },
    });
  } else {
    // Update user if needed
    await prisma.users.update({
      where: { id: user.id },
      data: {
        phone: phone || user.phone,
        first_name: full_name.split(" ")[0] || user.first_name,
        last_name: full_name.split(" ").slice(1).join(" ") || user.last_name,
      },
    });
  }

  // Check if claim already exists for this business and user
  const existingClaim = await prisma.claims.findFirst({
    where: {
      business_id,
      user_id: user.id,
      status: { in: ["pending", "documents_pending"] },
    },
  });

  if (existingClaim) {
    // Resend email if claim exists
    if (existingClaim.claim_token && existingClaim.token_expires_at && existingClaim.token_expires_at > new Date()) {
      const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const url = `${appUrl}/claims/onboarding?token=${encodeURIComponent(existingClaim.claim_token)}`;

      const html = `
        <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height:1.5;">
          <p>Bonjour ${full_name},</p>
          <p>Vous avez demandé à revendiquer l'établissement <strong>${business.public_name || business_name}</strong>.</p>
          <p>Cliquez sur le lien ci-dessous pour compléter votre demande de revendication :</p>
          <p style="margin:24px 0;">
            <a href="${url}" style="display:inline-block;padding:12px 16px;background:#111;color:#fff;text-decoration:none;border-radius:8px;">Compléter ma revendication</a>
          </p>
          <p>Ce lien est valable 24h. S'il a expiré, vous pouvez faire une nouvelle demande.</p>
          <p>Vous devrez fournir :</p>
          <ul>
            <li>Votre pièce d'identité (recto et verso)</li>
            <li>Le registre de commerce de l'établissement</li>
            <li>Autres documents requis</li>
          </ul>
          <p>Cordialement,<br>L'équipe YOKA</p>
        </div>`;

      await sendEmail({
        to: email,
        subject: `Revendication de votre établissement - ${business.public_name || business_name}`,
        html,
      });

      return NextResponse.json({ ok: true, message: "Email sent" });
    }
  }

  // Generate claim token
  const tokenRaw = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(tokenRaw).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const documentsDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Create claim
  const claim = await prisma.claims.create({
    data: {
      business_id,
      user_id: user.id,
      full_name,
      email: email.toLowerCase(),
      phone,
      role: "owner",
      status: "pending",
      claim_token: tokenHash,
      token_expires_at: expiresAt,
      expires_at: documentsDeadline,
    },
  });

  // Update business claim_status
  await prisma.businesses.update({
    where: { id: business_id },
    data: { claim_status: "pending" },
  });

  // Send email
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${appUrl}/claims/onboarding?token=${encodeURIComponent(tokenRaw)}`;

  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height:1.5;">
      <p>Bonjour ${full_name},</p>
      <p>Vous avez demandé à revendiquer l'établissement <strong>${business.public_name || business_name}</strong>.</p>
      <p>Cliquez sur le lien ci-dessous pour compléter votre demande de revendication :</p>
      <p style="margin:24px 0;">
        <a href="${url}" style="display:inline-block;padding:12px 16px;background:#111;color:#fff;text-decoration:none;border-radius:8px;">Compléter ma revendication</a>
      </p>
      <p>Ce lien est valable 24h. S'il a expiré, vous pouvez faire une nouvelle demande.</p>
      <p>Vous devrez fournir :</p>
      <ul>
        <li>Votre pièce d'identité (recto et verso)</li>
        <li>Le registre de commerce de l'établissement</li>
        <li>Autres documents requis</li>
      </ul>
      <p><strong>Important :</strong> Vous avez 7 jours pour soumettre vos documents. Après ce délai, votre demande sera annulée.</p>
      <p>Cordialement,<br>L'équipe YOKA</p>
    </div>`;

  await sendEmail({
    to: email,
    subject: `Revendication de votre établissement - ${business.public_name || business_name}`,
    html,
  });

  // Event log
  await prisma.event_logs.create({
    data: {
      user_id: user.id,
      business_id,
      event_name: "claim.created",
      payload: { claim_id: claim.id, email, business_id },
    },
  }).catch(() => {});

  return NextResponse.json({ ok: true, message: "Claim created and email sent" });
}

