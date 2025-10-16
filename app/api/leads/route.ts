import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email";

function getIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.ip || "";
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const rl = rateLimit(`lead-create:${ip}`, 5, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const business_name = (body?.business_name || "").toString().trim();
  const owner_first_name = (body?.owner_first_name || "").toString().trim();
  const owner_last_name = (body?.owner_last_name || "").toString().trim();
  const email = (body?.email || "").toString().trim();
  const phone = (body?.phone || "").toString().trim() || null;
  const activity_type = (body?.activity_type || "").toString().trim() || null;
  const location = (body?.location || "").toString().trim() || null;
  const notes = (body?.notes || "").toString().trim() || null;

  const errors: Record<string, string> = {};
  if (!owner_first_name) errors.owner_first_name = "Prénom requis";
  if (!owner_last_name) errors.owner_last_name = "Nom requis";
  if (!business_name) errors.business_name = "Nom du salon/institut requis";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Email invalide";
  if (Object.keys(errors).length) return NextResponse.json({ error: "Validation error", errors }, { status: 400 });

  const lead = await prisma.business_leads.create({
    data: {
      business_name,
      owner_first_name,
      owner_last_name,
      email,
      phone: phone || undefined,
      activity_type: activity_type || undefined,
      location: location || undefined,
      notes: notes || undefined,
      status: "pending" as any,
    },
    select: { id: true, business_name: true, email: true, created_at: true },
  });

  await prisma.event_logs.create({
    data: {
      event_name: "lead.created",
      payload: { ip, lead_id: lead.id, email, business_name, activity_type, location },
    },
  }).catch(() => {});

  // Send confirmation to prospect (optional)
  try {
    const salesFrom = process.env.EMAIL_FROM || "no-reply@example.com";
    const appUrl = process.env.APP_URL || "";
    await sendEmail({
      to: email,
      subject: `Merci — Nous vous contactons sous 24h`,
      html: `<p>Bonjour ${owner_first_name},</p><p>Merci pour votre intérêt pour notre solution pro. Un expert va vous recontacter sous 24h.</p><p>Nom du salon: <b>${business_name}</b>${location ? ` — ${location}` : ""}</p>${appUrl ? `<p>Visitez: <a href="${appUrl}">${appUrl}</a></p>` : ""}`,
      text: `Bonjour ${owner_first_name},\n\nMerci pour votre intérêt. Un expert va vous recontacter sous 24h.\nSalon: ${business_name}${location ? ` — ${location}` : ""}${appUrl ? `\nSite: ${appUrl}` : ""}`,
      category: "lead_confirmation",
      sandbox: true,
    });
  } catch {}

  // Send internal notification if configured
  try {
    const notifTo = process.env.SALES_NOTIF_TO;
    if (notifTo) {
      await sendEmail({
        to: notifTo,
        subject: `Nouveau lead: ${business_name}`,
        html: `<p>Nouveau lead</p><ul><li>${owner_first_name} ${owner_last_name}</li><li>${email}${phone ? ` — ${phone}` : ""}</li><li>${business_name}${location ? ` — ${location}` : ""}</li><li>Activité: ${activity_type || "N/A"}</li></ul><p>ID: ${lead.id}</p>`,
        text: `Nouveau lead\n${owner_first_name} ${owner_last_name}\n${email}${phone ? ` — ${phone}` : ""}\n${business_name}${location ? ` — ${location}` : ""}\nActivité: ${activity_type || "N/A"}\nID: ${lead.id}`,
        category: "lead_notification",
        sandbox: true,
      });
    }
  } catch {}

  return NextResponse.json({ ok: true, id: lead.id });
}
