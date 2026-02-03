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
  if (!phone) errors.phone = "Téléphone requis";
  if (!activity_type) errors.activity_type = "Type d'activité requis";
  if (!location) errors.location = "Ville requise";
  if (Object.keys(errors).length) return NextResponse.json({ error: "Champs manquants", errors }, { status: 400 });

  // Vérifier si l'email existe déjà dans les leads
  const existingLead = await prisma.business_leads.findFirst({
    where: { email: email },
    select: { id: true },
  });
  if (existingLead) {
    return NextResponse.json({ error: "Cet email est déjà utilisé. Veuillez utiliser une autre adresse email." }, { status: 409 });
  }

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

  // Email leads
try {
  const salesFrom = process.env.EMAIL_FROM || "no-reply@example.com";
  
  await sendEmail({
    to: email,
    subject: `Bienvenue sur Yoka`,
    html: `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height:1.6; max-width:600px;">
        <p>Bonjour ${owner_first_name},</p>
        
        <p>Merci de l'intérêt que vous portez à <strong>Yoka</strong>.</p>
        
        <p>Votre inscription a bien été enregistrée. Vous faites désormais partie de notre <strong>liste d'accès prioritaire</strong> et serez parmi les premiers informés de notre lancement.</p>
        
        <p>Dès que la plateforme sera disponible, vous recevrez un email contenant :</p>
        <ul>
          <li>Un lien vous permettant de créer vos identifiants de connexion</li>
          <li>Notre guide de démarrage rapide pour prendre en main l'outil en toute autonomie</li>
        </ul>
        
        <p>Nous vous recontactons très prochainement.</p>
        
        <p>Cordialement,<br>L'équipe Yoka</p>
      </div>
    `,
    text: `Bonjour ${owner_first_name},

Merci de l'intérêt que vous portez à Yoka.

Votre inscription a bien été enregistrée. Vous faites désormais partie de notre liste d'accès prioritaire et serez parmi les premiers informés de notre lancement.

Dès que la plateforme sera disponible, vous recevrez un email contenant :
- Un lien vous permettant de créer vos identifiants de connexion
- Notre guide de démarrage rapide pour prendre en main l'outil en toute autonomie

Nous vous recontactons très prochainement.

Cordialement,
L'équipe Yoka`,
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
