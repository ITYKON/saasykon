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
    console.log('[Claim Complete] Corps de la requête reçu:', JSON.stringify(body, null, 2));
  } catch (error) {
    console.error('[Claim Complete] Erreur lors de l\'analyse du JSON:', error);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { token, password, rc_number, rc_document_url, id_document_front_url, id_document_back_url, complete_now } = body || {};
  
  console.log('[Claim Complete] Données extraites de la requête:', {
    hasToken: !!token,
    hasPassword: !!password,
    passwordLength: password?.length,
    completeNow: complete_now
  });

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
    updateData.status = "pending_review";
  } else {
    // Utiliser "pending" comme valeur par défaut qui est acceptée par la contrainte check_status
    updateData.status = "pending";
  }

  await prisma.claims.update({
    where: { id: claim.id },
    data: updateData,
  });

  // Mettre à jour le statut de la revendication
  if (complete_now) {
    // Si des documents sont fournis, créer/mettre à jour la vérification
    if (hasAllDocuments) {
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
      } else if (rc_number || rc_document_url || id_document_front_url || id_document_back_url) {
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
    }

    // Mettre à jour le statut de l'entreprise
    const updateBusinessData: any = {
      updated_at: new Date(),
    };

    // Ne mettre à jour claim_status que si des documents ont été soumis
    if (hasAllDocuments) {
      updateBusinessData.claim_status = "documents_submitted";
    } else {
      // Si l'utilisateur choisit de compléter plus tard, marquer comme en attente
      updateBusinessData.claim_status = "pending_documents";
    }

    await prisma.businesses.update({
      where: { id: claim.business_id },
      data: updateBusinessData,
    });
  }

  // Create session if password was set
  let sessionResponse = null;
  if (password) {
    console.log(`[Claim Complete] Mise à jour du mot de passe pour l'utilisateur: ${claim.user_id}`);
    console.log(`[Claim Complete] Mot de passe reçu: ${password ? 'Oui' : 'Non'}`);
    
    // Mettre à jour le mot de passe de l'utilisateur d'abord
    const hashedPassword = await hashPassword(password);
    console.log(`[Claim Complete] Mot de passe haché: ${hashedPassword ? 'Oui' : 'Non'}`);
    
    try {
      const updatedUser = await prisma.users.update({
        where: { id: claim.user_id },
        data: { 
          password_hash: hashedPassword,
          is_email_verified: true,
          updated_at: new Date() 
        },
        select: {
          id: true,
          email: true,
          password_hash: true
        }
      });
      
      console.log(`[Claim Complete] Utilisateur mis à jour:`, {
        id: updatedUser.id,
        email: updatedUser.email,
        hasPassword: !!updatedUser.password_hash
      });
      
      // Vérifier que le mot de passe a bien été enregistré
      const userCheck = await prisma.users.findUnique({
        where: { id: claim.user_id },
        select: { password_hash: true }
      });
      
      console.log(`[Claim Complete] Vérification du mot de passe en base de données:`, {
        hasPassword: !!userCheck?.password_hash
      });
      
    } catch (error) {
      console.error('[Claim Complete] Erreur lors de la mise à jour du mot de passe:', error);
      throw error;
    }

    console.log(`[Claim Complete] Création de la session pour l'utilisateur: ${claim.user_id}`);
    // Créer la session après la mise à jour du mot de passe
    sessionResponse = await createSession(claim.user_id);
    console.log(`[Claim Complete] Session créée avec succès pour l'utilisateur: ${claim.user_id}`);
    
    if (sessionResponse) {
      // Mettre à jour le statut de l'entreprise
      const businessUpdateData: any = {
        status: 'active',
        updated_at: new Date(),
        // Ne marquer l'onboarding comme complété que si tous les documents sont fournis
        onboarding_completed: hasAllDocuments
      };
      
      await prisma.businesses.update({
        where: { id: claim.business_id },
        data: businessUpdateData
      });
      
      // Mettre à jour le statut de la réclamation
      await prisma.claims.update({
        where: { id: claim.id },
        data: {
          status: hasAllDocuments ? 'pending_review' : 'pending',
          documents_submitted: hasAllDocuments,
          documents_submitted_at: hasAllDocuments ? new Date() : null,
          updated_at: new Date()
        }
      });
      
      // Définir les cookies nécessaires
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 an
      
      // Cookie pour l'onboarding
      sessionResponse.cookies.set('onboarding_done', hasAllDocuments ? 'true' : 'false', {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        expires: expiresAt
      });
      
      // Ajouter le rôle PRO à l'utilisateur
      const proRole = await prisma.roles.findUnique({ where: { code: "PRO" } });
      if (proRole) {
        await prisma.user_roles.upsert({
          where: {
            user_id_role_id_business_id: {
              user_id: claim.user_id,
              role_id: proRole.id,
              business_id: claim.business_id,
            },
          },
          update: {},
          create: {
            user_id: claim.user_id,
            role_id: proRole.id,
            business_id: claim.business_id,
          },
        });
        
        // Mettre à jour le cookie des rôles
        const userRoles = await prisma.user_roles.findMany({
          where: { user_id: claim.user_id },
          include: { roles: true },
        });
        
        const roleCodes = userRoles.map(ur => ur.roles?.code).filter(Boolean) as string[];
        if (roleCodes.length > 0) {
          sessionResponse.cookies.set('saas_roles', roleCodes.join(','), {
            httpOnly: false,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            expires: expiresAt
          });
        }
      }
    }
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

