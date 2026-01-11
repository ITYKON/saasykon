import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";
import { sendEmail } from "@/lib/email";
import { generateTemporaryPassword, hashPassword } from "@/lib/auth";

// Type pour un lead avec ses vérifications
interface BusinessLeadWithVerification {
  id: string;
  business_name: string;
  owner_first_name: string;
  owner_last_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  business_verifications: {
    rc_number: string | null;
    rc_document_url: string | null;
    id_document_front_url: string | null;
    id_document_back_url: string | null;
  } | null;
}

export async function GET(req: NextRequest) {
  // Accept either legacy uppercase code or unified lowercase code
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.roles.includes("ADMIN") && !ctx.permissions.includes("LEADS_VIEW") && !ctx.permissions.includes("leads")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const activity = searchParams.get("activity") || undefined;
  const location = searchParams.get("location") || undefined;
  const q = searchParams.get("q") || undefined;
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));

  // Ne récupérer que les leads non convertis et non archivés
  const where: any = {
    converted_by: null,
    archived_at: null
  };
  
  // Ajouter les filtres supplémentaires s'ils sont fournis
  if (status) where.status = status as any;
  if (activity) where.activity_type = activity;
  if (location) where.location = location;
  if (q) {
    where.OR = [
      { business_name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { owner_first_name: { contains: q, mode: "insensitive" } },
      { owner_last_name: { contains: q, mode: "insensitive" } },
    ];
  }
  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) (where.created_at as any).gte = new Date(startDate);
    if (endDate) (where.created_at as any).lte = new Date(endDate);
  }

  const [total, items] = await Promise.all([
    prisma.business_leads.count({ where }),
    prisma.business_leads.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        business_name: true,
        owner_first_name: true,
        owner_last_name: true,
        email: true,
        phone: true,
        activity_type: true,
        location: true,
        status: true,
        created_at: true,
      },
    }),
  ]);

  return NextResponse.json({ total, page, pageSize, items });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.roles.includes("ADMIN") && !ctx.permissions.includes("LEADS_EDIT")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  const { action } = await req.json();

  if (!['approve', 'reject', 'pending'].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    // Récupérer le lead
    const lead = await prisma.business_leads.findUnique({
      where: { id },
      include: { business_verifications: true }
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Mettre à jour le statut du lead
    const updatedLead = await prisma.business_leads.update({
      where: { id },
      data: { 
        status: action.toUpperCase() as any,
        converted_by: action === 'approve' ? ctx.userId : null,
        updated_at: new Date()
      },
      include: { business_verifications: true }
    });

    // Si le lead est approuvé, créer l'entreprise et l'utilisateur associé
    if (action === 'approve') {
      await convertLeadToBusiness(lead, ctx.userId);
    }

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Error updating lead status:', error);
    return NextResponse.json(
      { error: "Failed to update lead status" },
      { status: 500 }
    );
  }
}

async function convertLeadToBusiness(lead: any, adminId: string) {
  // Vérifier si l'email est déjà utilisé
  const existingUser = await prisma.users.findUnique({
    where: { email: lead.email }
  });

  let userId: string;
  let temporaryPassword = '';

  if (existingUser) {
    userId = existingUser.id;
  } else {
    // Créer un mot de passe temporaire
    temporaryPassword = generateTemporaryPassword();
    
    // Créer l'utilisateur
    const newUser = await prisma.users.create({
      data: {
        email: lead.email,
        first_name: lead.owner_first_name,
        last_name: lead.owner_last_name,
        phone: lead.phone || '',
        password_hash: await hashPassword(temporaryPassword),
        is_email_verified: true,
        is_phone_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    userId = newUser.id;
  }

  // Créer l'entreprise
  // Les salons créés depuis les leads ne sont PAS revendicables
  const business = await prisma.$transaction(async (tx) => {
    const newBusiness = await tx.businesses.create({
      data: {
        owner_user_id: userId,
        owner_id: userId,
        legal_name: lead.business_name,
        public_name: lead.business_name,
        email: lead.email,
        phone: lead.phone,
        status: 'active',
        onboarding_completed: true,
        claim_status: "not_claimable", // Les salons créés depuis les leads ne sont pas revendicables
        created_at: new Date(),
        updated_at: new Date(),
        // Copier les informations de vérification si elles existent
        business_verifications: lead.business_verifications ? {
          create: {
            rc_number: lead.business_verifications.rc_number,
            rc_document_url: lead.business_verifications.rc_document_url,
            id_document_front_url: lead.business_verifications.id_document_front_url,
            id_document_back_url: lead.business_verifications.id_document_back_url,
            status: 'verified',
            reviewed_by: adminId,
            reviewed_at: new Date(),
            created_at: new Date(),
            updated_at: new Date()
          }
        } : undefined,
        // Créer un emplacement par défaut
        business_locations: {
          create: {
            address_line1: lead.location || 'Adresse à compléter',
            is_primary: true,
            created_at: new Date(),
            updated_at: new Date()
          }
        }
      }
    });

    // Ajouter le rôle BUSINESS_OWNER à l'utilisateur
    await tx.user_roles.create({
      data: {
        user_id: userId,
        role_id: 2, // ID du rôle BUSINESS_OWNER (à vérifier dans votre base de données)
        business_id: newBusiness.id
      }
    });

    return newBusiness;
  });

  // Envoyer un email de bienvenue avec les informations de connexion
  if (temporaryPassword) {
    await sendEmail({
      to: lead.email,
      subject: 'Votre compte professionnel a été approuvé',
      html: `
        <h1>Votre compte professionnel a été approuvé</h1>
        <p>Bonjour ${lead.owner_first_name},</p>
        <p>Votre demande d'inscription pour l'entreprise <strong>${lead.business_name}</strong> a été approuvée.</p>
        <p>Voici vos identifiants de connexion :</p>
        <p><strong>Email :</strong> ${lead.email}</p>
        <p><strong>Mot de passe temporaire :</strong> ${temporaryPassword}</p>
        <p>Nous vous recommandons de changer votre mot de passe après votre première connexion.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/login">Se connecter à mon espace</a></p>
        <p>Cordialement,<br>L'équipe Yoka</p>
      `,
    });
  }

  return business;
}
