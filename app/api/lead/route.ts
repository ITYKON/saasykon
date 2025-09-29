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
    },
  });

  // Affecte le rôle "PROFESSIONNEL" à ce user avec le business fraichement créé
  const proRole = await prisma.roles.findFirst({ where: { code: { equals: "PROFESSIONNEL" } } });
  if (proRole) {
    await prisma.user_roles.create({
      data: {
        user_id: user.id,
        role_id: proRole.id,
        business_id: lead.id,
      }
    });
  }
  // TODO: notifier un commercial (email, CRM...)
  return NextResponse.json({ success: true, lead });
}