import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const data = await req.json();
  // Validation simple
  if (!data.email || !data.phone || !data.firstName || !data.lastName || !data.companyName) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }
  // Crée d'abord un user pour le lead
  const user = await prisma.users.create({
    data: {
      email: data.email,
      phone: `${data.phoneCountry} ${data.phone}`,
      first_name: data.firstName,
      last_name: data.lastName,
      is_email_verified: false,
      is_phone_verified: false,
      password_hash: null,
      provider: "lead-form",
      provider_id: null,
      avatar_url: null,
      locale: "fr",
    },
  });

  // Crée le business lead avec ce user comme owner
  // Les salons créés depuis le formulaire de lead ne sont PAS revendicables
  
  // Generate slug
  const { generateUniqueSlug } = await import("@/lib/salon-slug-server");
  const slug = await generateUniqueSlug(data.companyName, data.city);

  const lead = await prisma.businesses.create({
    data: {
      legal_name: data.companyName,
      public_name: data.companyName,
      email: data.email,
      phone: `${data.phoneCountry} ${data.phone}`,
      description: `Lead pro en attente. Contact: ${data.firstName} ${data.lastName}, ville: ${data.city}, activité: ${data.businessType}`,
      category_code: data.businessType,
      owner_user_id: user.id,
      archived_at: null,
      deleted_at: null,
      status: "pending_verification" as any,
      claim_status: "not_claimable", // Les salons créés depuis les leads ne sont pas revendicables
      slug,
    },
  });

  // Log lead creation
  await prisma.event_logs.create({
    data: { event_name: "lead.created", user_id: user.id, business_id: lead.id, payload: { source: "api/lead", email: user.email } },
  }).catch(() => {});

  // Affecte le rôle PRO à la source (fallback legacy: PROFESSIONNEL)
  try {
    const role = await prisma.roles.findFirst({ where: { code: { in: ["PRO", "PROFESSIONNEL"] } } });
    if (role) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id_business_id: { user_id: user.id, role_id: role.id, business_id: lead.id } as any },
        update: {},
        create: { user_id: user.id, role_id: role.id, business_id: lead.id },
      } as any);
      await prisma.event_logs.create({
        data: { event_name: "role.assigned", user_id: user.id, business_id: lead.id, payload: { role: role.code } },
      }).catch(() => {});
    } else {
      await prisma.event_logs.create({
        data: { event_name: "role.missing", user_id: user.id, business_id: lead.id, payload: { tried: ["PRO", "PROFESSIONNEL"] } },
      }).catch(() => {});
    }
  } catch (e) {
    await prisma.event_logs.create({
      data: { event_name: "role.assign_error", user_id: user.id, business_id: lead.id, payload: { error: (e as any)?.message } },
    }).catch(() => {});
  }
  // TODO: notifier un commercial (email, CRM...)
  return NextResponse.json({ success: true, lead });
}