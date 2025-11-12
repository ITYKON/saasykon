import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrPermission } from "@/lib/authorization";
import { randomBytes, createHash } from "crypto";
import { sendEmail, inviteEmailTemplate } from "@/lib/email";

function getIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.ip || "";
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminOrPermission("LEADS_MANAGE");
  if (auth instanceof NextResponse) return auth;

  const leadId = params.id;
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    email: emailInput,
    phone,
    owner_first_name,
    owner_last_name,
    business_name,
    plan_code,
    employees_count,
    notes,
    send_invite = true,
  } = body || {};

  const lead = await prisma.business_leads.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const email = (emailInput || lead.email || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  // Upsert user by email
  const user = await prisma.users.upsert({
    where: { email },
    update: {
      phone: phone ?? lead.phone ?? undefined,
      first_name: owner_first_name ?? lead.owner_first_name ?? undefined,
      last_name: owner_last_name ?? lead.owner_last_name ?? undefined,
    },
    create: {
      email,
      phone: phone ?? lead.phone ?? null,
      first_name: owner_first_name ?? lead.owner_first_name ?? null,
      last_name: owner_last_name ?? lead.owner_last_name ?? null,
      locale: "fr",
    },
  });

  // Create business with pending_verification status
  const business = await prisma.businesses.create({
    data: {
      owner_user_id: user.id,
      legal_name: business_name ?? lead.business_name,
      public_name: business_name ?? lead.business_name,
      category_code: null,
      email,
      phone: phone ?? lead.phone ?? null,
      status: "pending_verification" as any,
    },
  });

  // Ensure owner has PRO role for this business
  try {
    const proRole = await prisma.roles.findUnique({ where: { code: "PRO" } });
    if (proRole) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id_business_id: { user_id: user.id, role_id: proRole.id, business_id: business.id } as any },
        update: {},
        create: { user_id: user.id, role_id: proRole.id, business_id: business.id },
      } as any);
    }
  } catch {}

  // Optional: attach plan via subscriptions placeholder (no Stripe yet)
  if (plan_code) {
    const plan = await prisma.plans.findUnique({ where: { code: plan_code } }).catch(() => null);
    if (plan) {
      const now = new Date();
      const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // default 14d trial if plan.trial_days missing
      const periodEnd = plan.trial_days ? new Date(now.getTime() + plan.trial_days * 24 * 60 * 60 * 1000) : end;
      await prisma.subscriptions.create({
        data: {
          business_id: business.id,
          plan_id: plan.id,
          status: (plan.trial_days && plan.trial_days > 0 ? "TRIALING" : "INCOMPLETE") as any,
          current_period_start: now,
          current_period_end: periodEnd,
        },
      });
    }
  }

  // Créer une entrée dans business_locations avec la ville du lead
  if (lead.location) {
    // Essayer de trouver la ville dans la base de données
    const city = await prisma.cities.findFirst({
      where: {
        name: {
          contains: lead.location,
          mode: 'insensitive'
        }
      },
      take: 1
    });

    await prisma.business_locations.create({
      data: {
        business_id: business.id,
        address_line1: lead.location,
        city_id: city?.id || null,
        country_code: 'DZ', // Par défaut Algérie
        is_primary: true,
        timezone: 'Africa/Algiers'
      },
    });
  }

  // Update lead state
  await prisma.business_leads.update({
    where: { id: lead.id },
    data: {
      status: send_invite ? ("invited" as any) : ("validated" as any),
      converted_by: auth.userId,
      updated_at: new Date(),
      notes: notes ?? lead.notes,
    },
  });

  // Event logs
  await prisma.event_logs.create({
    data: {
      user_id: auth.userId,
      business_id: business.id,
      event_name: "lead.converted",
      payload: { lead_id: lead.id, business_id: business.id, user_id: user.id },
    },
  });

  let invitation: { token?: string } = {};
  if (send_invite) {
    const tokenRaw = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(tokenRaw).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.invite_tokens.create({
      data: {
        user_id: user.id,
        email,
        token_hash: tokenHash,
        expires_at: expiresAt,
        used: false,
        created_by: auth.userId,
      },
    });

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const tpl = inviteEmailTemplate({ firstName: user.first_name, appUrl, token: tokenRaw, validityHours: 24 });
    await sendEmail({ to: email, subject: `Votre compte est prêt — activez votre accès`, html: tpl.html, text: tpl.text });

    await prisma.event_logs.create({
      data: {
        user_id: auth.userId,
        business_id: business.id,
        event_name: "invite.sent",
        payload: { lead_id: lead.id, email, expires_at: expiresAt },
      },
    });

    invitation.token = tokenRaw; // not returned by API response
  }

  return NextResponse.json({ ok: true, lead_id: lead.id, business_id: business.id, user_id: user.id });
}
