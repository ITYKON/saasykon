import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrPermission } from "@/lib/authorization";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAdminOrPermission("salons");
  if (authCheck instanceof NextResponse) return authCheck;
  
  try {
    const { id } = params;
    const { status } = await request.json();
    
    if (!status) {
      return NextResponse.json(
        { error: "Le statut est requis" },
        { status: 400 }
      );
    }
    
    // Vérifier que le statut est valide
    const validStatuses = ["approved", "rejected", "actif", "en attente", "inactif"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Statut non valide: ${status}. Statuts valides: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Mapper les statuts si nécessaire
    const statusMapping: Record<string, string> = {
      'approved': 'actif',
      'rejected': 'inactif'
    };
    
    const statusToSave = statusMapping[status] || status;
    
    // Définir le statut de vérification avec le bon type
    type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'expired';
    const verificationStatus = status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending';
    
    // Récupérer d'abord le salon pour conserver les informations existantes
    const existingBusiness = await prisma.businesses.findUnique({
      where: { id },
      include: {
        business_verifications: true
      }
    });

    if (!existingBusiness) {
      return NextResponse.json(
        { error: "Salon non trouvé" },
        { status: 404 }
      );
    }

    // Mettre à jour le statut du salon
    const updatedSalon = await prisma.businesses.update({
      where: { id },
      data: { 
        status: statusToSave,
        claim_status: status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : undefined,
        // Mettre à jour la vérification en utilisant une requête brute pour éviter les problèmes de typage
        ...(existingBusiness.business_verifications.length > 0 && {
          business_verifications: {
            updateMany: {
              where: { business_id: id },
              data: {
                status: status === 'approved' ? 'verified' : status === 'rejected' ? 'rejected' : 'pending',
                reviewed_by: (authCheck as any).userId,
                reviewed_at: new Date()
              }
            }
          }
        })
      },
      include: {
        business_verifications: true
      }
    });
    
    // Journaliser l'action
    await prisma.event_logs.create({
      data: {
        user_id: (authCheck as any).userId,
        event_name: "salon.status_update",
        payload: { business_id: id, status },
      },
    });
    
    return NextResponse.json({ success: true, data: updatedSalon });
    
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour du statut:", error);
    
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Salon non trouvé" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du statut" },
      { status: 500 }
    );
  }
}

export { PATCH as PUT }; // Pour la compatibilité avec les requêtes PUT
