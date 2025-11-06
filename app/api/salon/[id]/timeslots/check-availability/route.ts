import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { starts_at, ends_at, employee_id } = await req.json();
    const businessId = params.id;

    if (!starts_at || !ends_at) {
      return NextResponse.json(
        { error: "Les dates de début et de fin sont requises" },
        { status: 400 }
      );
    }

    const startDate = new Date(starts_at);
    const endDate = new Date(ends_at);

    // Vérifier les réservations existantes qui se chevauchent
    const whereClause: any = {
      business_id: businessId,
      status: { in: ["PENDING", "CONFIRMED"] },
      OR: [
        // La réservation commence pendant le créneau demandé
        { 
          starts_at: { lt: endDate },
          ends_at: { gt: startDate }
        },
        // La réservation se termine pendant le créneau demandé
        {
          starts_at: { lt: endDate },
          ends_at: { gt: startDate }
        },
        // La réservation contient complètement le créneau demandé
        {
          starts_at: { lte: startDate },
          ends_at: { gte: endDate }
        },
        // La réservation est contenue dans le créneau demandé
        {
          starts_at: { gte: startDate },
          ends_at: { lte: endDate }
        }
      ]
    };

    // Si un employé est spécifié, vérifier uniquement ses réservations
    if (employee_id) {
      whereClause.employee_id = employee_id;
    }

    const conflict = await prisma.reservations.findFirst({
      where: whereClause,
      select: { 
        id: true, 
        status: true, 
        starts_at: true, 
        ends_at: true,
        clients: { select: { first_name: true, last_name: true } },
        employees: { select: { full_name: true } }
      },
    });

    if (conflict) {
      const clientName = conflict.clients 
        ? `${conflict.clients.first_name || ''} ${conflict.clients.last_name || ''}`.trim() 
        : 'Client inconnu';
      
      const employeeName = conflict.employees?.full_name || 'Employé non spécifié';
      
      return NextResponse.json({
        available: false,
        message: `Le créneau est déjà réservé par ${clientName} (${employeeName})`,
        conflict: {
          id: conflict.id,
          status: conflict.status,
          starts_at: conflict.starts_at,
          ends_at: conflict.ends_at,
          client_name: clientName,
          employee_name: employeeName
        }
      });
    }

    return NextResponse.json({ 
      available: true,
      message: "Le créneau est disponible"
    });

  } catch (error) {
    console.error("Erreur lors de la vérification de disponibilité:", error);
    return NextResponse.json(
      { 
        available: false,
        error: "Une erreur est survenue lors de la vérification de disponibilité" 
      },
      { status: 500 }
    );
  }
}
