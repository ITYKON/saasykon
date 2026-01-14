import { NextResponse } from "next/server";
import { getAuthUserFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

// Fonction utilitaire pour logger les erreurs
const logError = (step: string, error: any, details?: Record<string, any>) => {
  console.error(`[Business Verification API] Erreur à l'étape ${step}:`, {
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    ...details,
  });
};

// Fonction utilitaire pour formater les réponses d'erreur
const errorResponse = (message: string, status: number, details?: any) => {
  logError("errorResponse", new Error(message), { status, details });
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details && { details }),
    },
    { status }
  );
};

// Types pour les statuts basés sur le schéma Prisma
type VerificationStatus = "pending" | "verified" | "rejected";
type BusinessStatus =
  | "pending_verification"
  | "verified"
  | "rejected"
  | "blocked";

// Surcharge du type pour accepter notre statut personnalisé
type CustomVerificationStatus = VerificationStatus | string;

declare global {
  namespace Prisma {
    // Surcharge de l'interface verification_status pour accepter notre statut personnalisé
    interface verification_status {
      equals?: CustomVerificationStatus;
      in?: CustomVerificationStatus[];
      notIn?: CustomVerificationStatus[];
      not?: CustomVerificationStatus;
    }
  }
}

// Configuration des types pour les fichiers
type FileWithName = {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

// Fonction utilitaire pour sauvegarder un fichier
async function saveFile(
  file: FileWithName,
  directory: string
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Créer le répertoire s'il n'existe pas
  const uploadDir = join(process.cwd(), "public/uploads", directory);
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }

  // Générer un nom de fichier unique
  const timestamp = Date.now();
  const extension = file.name.split(".").pop();
  const filename = `${timestamp}-${Math.random()
    .toString(36)
    .substring(2, 15)}.${extension}`;
  const filePath = join(uploadDir, filename);

  await writeFile(filePath, buffer);

  return `/uploads/${directory}/${filename}`;
}

export async function GET() {
  try {
    const user = await getAuthUserFromCookies();
    if (!user) {
      return errorResponse("Non autorisé: utilisateur non connecté", 401);
    }

    // Récupérer l'entreprise de l'utilisateur
    const business = await prisma.businesses.findFirst({
      where: {
        OR: [
          { owner_user_id: user.id },
          { owner_id: user.id },
          {
            user_roles: {
              some: {
                user_id: user.id,
                roles: {
                  code: "PRO",
                },
              },
            },
          },
        ],
      },
    });

    if (!business) {
      return errorResponse("Aucune entreprise trouvée", 404);
    }

    // Récupérer la vérification
    const verification = await prisma.business_verifications.findFirst({
      where: { business_id: business.id },
      orderBy: { created_at: "desc" },
    });

    const result = verification
      ? {
          id: verification.id,
          business_id: verification.business_id,
          status: verification.status,
          rc_number: verification.rc_number,
          rc_document_url: verification.rc_document_url,
          id_document_front_url: verification.id_document_front_url,
          id_document_back_url: verification.id_document_back_url,
          reviewed_by: verification.reviewed_by,
          reviewed_at: verification.reviewed_at?.toISOString() || null,
          created_at: verification.created_at.toISOString(),
        }
      : null;

    return NextResponse.json({
      success: true,
      verification: result,
      business_id: business.id,
    });
  } catch (error) {
    logError("GET verification", error);
    return errorResponse(
      "Erreur lors de la récupération des informations de vérification",
      500
    );
  }
}

export async function POST(request: Request) {

  try {
    // Récupérer l'utilisateur authentifié
    const user = await getAuthUserFromCookies();
    if (!user) {
      return errorResponse("Non autorisé: utilisateur non connecté", 401);
    }



    // Récupérer l'entreprise de l'utilisateur

    // Debug: Vérifier les rôles et claims de l'utilisateur
    const userRoles = await prisma.user_roles.findMany({
      where: { user_id: user.id },
      include: { roles: true, businesses: true },
    });
    const userClaims = await prisma.claims.findMany({
      where: { user_id: user.id },
      include: { businesses: true },
    });

    // Vérifier d'abord avec owner_user_id, puis avec owner_id, puis via les rôles PRO
    const business = await prisma.businesses.findFirst({
      where: {
        OR: [
          { owner_user_id: user.id },
          { owner_id: user.id },
          {
            // Inclure les entreprises où l'utilisateur a un rôle PRO
            user_roles: {
              some: {
                user_id: user.id,
                roles: {
                  code: "PRO",
                },
              },
            },
          },
        ],
      },
      include: {
        user_roles: {
          where: {
            user_id: user.id,
            roles: {
              code: "PRO",
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    if (!business) {
      return errorResponse(
        "Aucune entreprise trouvée pour votre compte. Veuillez d'abord créer ou réclamer une entreprise.",
        400,
        {
          userId: user.id,
          errorCode: "NO_BUSINESS_FOUND",
          checkedFields: ["owner_user_id", "owner_id", "PRO_roles"],
        }
      );
    }



    // Récupérer les vérifications existantes avec les statuts valides
    const existingVerifications = await prisma.business_verifications.findMany({
      where: {
        business_id: business.id,
        status: {
          in: ["pending", "verified", "rejected"],
        },
      },
      orderBy: { created_at: "desc" },
      take: 1,
    });

    const existingVerification = existingVerifications[0] || null;

    // Récupération des données du formulaire
    const formData = await request.formData();

    // Récupération des champs
    const rcNumber = formData.get("rcNumber") as string;
    const rcDocument = formData.get("rcDocument") as FileWithName;
    const idDocumentFront = formData.get("idDocumentFront") as FileWithName;
    const idDocumentBack = formData.get("idDocumentBack") as FileWithName;

    // Validation des entrées
    if (!rcNumber || typeof rcNumber !== "string" || rcNumber.trim() === "") {
      return errorResponse("Le numéro RC est requis", 400, {
        errorCode: "MISSING_RC_NUMBER",
        field: "rcNumber",
      });
    }

    // Vérification des fichiers requis
    const missingFiles = [];
    if (!rcDocument) missingFiles.push("rcDocument");
    if (!idDocumentFront) missingFiles.push("idDocumentFront");
    if (!idDocumentBack) missingFiles.push("idDocumentBack");

    if (missingFiles.length > 0) {
      return errorResponse("Tous les documents sont requis", 400, {
        errorCode: "MISSING_REQUIRED_FILES",
        missingFiles,
        requiredFiles: ["rcDocument", "idDocumentFront", "idDocumentBack"],
      });
    }

    // Vérification des types et tailles des fichiers
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    const files = [
      { file: rcDocument, name: "rcDocument", field: "rcDocument" },
      {
        file: idDocumentFront,
        name: "Pièce d'identité (recto)",
        field: "idDocumentFront",
      },
      {
        file: idDocumentBack,
        name: "Pièce d'identité (verso)",
        field: "idDocumentBack",
      },
    ];

    for (const { file, name, field } of files) {
      // Vérification du type de fichier
      if (!allowedTypes.includes(file.type)) {
        return errorResponse(
          `Le format du fichier ${name} n'est pas pris en charge. Formats acceptés: PDF, JPG, PNG`,
          400,
          {
            errorCode: "INVALID_FILE_TYPE",
            field,
            fileType: file.type,
            allowedTypes,
          }
        );
      }

      // Vérification de la taille du fichier
      if (file.size > maxFileSize) {
        return errorResponse(
          `Le fichier ${name} est trop volumineux (${(
            file.size /
            (1024 * 1024)
          ).toFixed(2)} MB). Taille maximale: 5MB`,
          400,
          {
            errorCode: "FILE_TOO_LARGE",
            field,
            fileSize: file.size,
            maxFileSize,
          }
        );
      }
    }

    // Sauvegarder les fichiers

    // Créer un dossier pour les documents de cette entreprise
    const uploadDir = `business-verification/${business.id}`;

    let rcDocumentUrl: string;
    let idFrontDocumentUrl: string;
    let idBackDocumentUrl: string;

    try {
      // Sauvegarder chaque fichier
      rcDocumentUrl = await saveFile(rcDocument, uploadDir);

      idFrontDocumentUrl = await saveFile(idDocumentFront, uploadDir);

      idBackDocumentUrl = await saveFile(idDocumentBack, uploadDir);
    } catch (error) {
      console.error(
        "[Business Verification API] Erreur lors de la sauvegarde des fichiers:",
        error
      );
      return errorResponse("Erreur lors de la sauvegarde des fichiers", 500, {
        errorCode: "FILE_SAVE_ERROR",
        details: error instanceof Error ? error.message : String(error),
      });
    }

    let verification;
    try {
      // Mettre à jour ou créer une nouvelle vérification
      if (existingVerification) {

        verification = await prisma.business_verifications.update({
          where: { id: existingVerification.id },
          data: {
            rc_number: rcNumber,
            rc_document_url: rcDocumentUrl,
            id_document_front_url: idFrontDocumentUrl,
            id_document_back_url: idBackDocumentUrl,
            status: "pending" as const,
            reviewed_at: null,
            reviewed_by: null,
            notes: null,
            updated_at: new Date(),
          },
        });
      } else {

        verification = await prisma.business_verifications.create({
          data: {
            business_id: business.id,
            rc_number: rcNumber,
            rc_document_url: rcDocumentUrl,
            id_document_front_url: idFrontDocumentUrl,
            id_document_back_url: idBackDocumentUrl,
            status: "pending" as const,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }



      // Mettre à jour le statut de l'entreprise

      await prisma.businesses.update({
        where: { id: business.id },
        data: {
          status: "pending_verification" as const,
          verification_status: "pending" as const,
          updated_at: new Date(),
        },
      });

      // Mettre à jour la réclamation pour indiquer que les documents ont été soumis

      await prisma.claims.updateMany({
        where: {
          business_id: business.id,
          status: { in: ["pending", "documents_submitted"] },
        },
        data: {
          status: "documents_submitted",
          documents_submitted: true,
          documents_submitted_at: new Date(),
          rc_document_url: rcDocumentUrl,
          id_document_front_url: idFrontDocumentUrl,
          id_document_back_url: idBackDocumentUrl,
          updated_at: new Date(),
        },
      });

      // Forcer le rafraîchissement du cache côté client
      const response = NextResponse.json({
        success: true,
        message: "Documents soumis avec succès. Vérification en cours.",
        verificationId: verification.id,
        timestamp: new Date().toISOString(), // Ajout d'un timestamp pour éviter le cache
      });

      // Ajouter des en-têtes pour éviter la mise en cache
      response.headers.set("Cache-Control", "no-store, max-age=0");
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");

      return response;
    } catch (error) {
      logError("updateVerification", error, { businessId: business.id });

      // Vérifier si c'est une erreur de base de données
      if (error instanceof Error && error.message.includes("prisma")) {
        return errorResponse(
          "Une erreur est survenue lors de la mise à jour des informations dans la base de données",
          500,
          {
            errorCode: "DATABASE_ERROR",
            details:
              process.env.NODE_ENV === "development"
                ? error.message
                : undefined,
          }
        );
      }

      // Autre type d'erreur
      return errorResponse(
        "Une erreur est survenue lors de la mise à jour des informations de vérification",
        500,
        {
          errorCode: "VERIFICATION_UPDATE_ERROR",
          details: error instanceof Error ? error.message : String(error),
        }
      );
    }

    // Le code de mise à jour du statut a été déplacé dans le bloc try précédent
    // pour avoir accès à la variable verification
  } catch (error) {
    logError("global", error);

    // Vérifier si c'est une erreur de validation connue
    if (error instanceof Error && error.message.includes("validation")) {
      return errorResponse("Erreur de validation des données", 400, {
        errorCode: "VALIDATION_ERROR",
        details: error.message,
      });
    }

    // Erreur inattendue
    return errorResponse(
      "Une erreur inattendue est survenue lors du traitement de votre demande",
      500,
      {
        errorCode: "INTERNAL_SERVER_ERROR",
        // Ne pas exposer les détails de l'erreur en production
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      }
    );
  }
}
