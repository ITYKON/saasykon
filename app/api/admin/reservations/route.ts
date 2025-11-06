import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrPermission } from "@/lib/authorization";

// GET: Liste toutes les réservations avec infos client, service, salon
export async function GET() {
	try {
		const authCheck = await requireAdminOrPermission("reservations");
		if (authCheck instanceof NextResponse) return authCheck;
		const reservations = await prisma.reservations.findMany({
			orderBy: { starts_at: "desc" },
			include: {
				clients: true,
				businesses: true,
				reservation_items: {
					include: {
						services: true,
						employees: true,
					},
				},
			},
		});
		// Formatage pour l'affichage admin (nom, service, salon, date, statut, prix)
			const formatted = reservations.map(r => {
				const item = r.reservation_items[0];
				return {
					id: r.id,
					client: r.clients ? `${r.clients.first_name || ''} ${r.clients.last_name || ''}`.trim() : '',
					service: item?.services?.name ? String(item.services.name) : '',
					salon: r.businesses?.public_name ? String(r.businesses.public_name) : '',
					date: r.starts_at ? String(r.starts_at) : '',
					status: r.status ? String(r.status) : '',
					price: item?.price_cents ? Number(item.price_cents) / 100 : null,
				};
			});
		return NextResponse.json({ reservations: formatted });
	} catch (e) {
		console.error("[GET /api/admin/reservations] Erreur:", e);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}

// Fonction utilitaire pour vérifier la disponibilité d'un créneau
async function isSlotAvailable(businessId: string, employeeId: string | null, startsAt: Date, endsAt: Date, excludeReservationId?: string) {
  // S'assurer que les dates sont bien des objets Date valides
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  // Vérifier les réservations existantes qui se chevauchent
  const whereClause: any = {
    business_id: businessId,
    status: { in: ["PENDING", "CONFIRMED"] },
    // Vérifier les chevauchements
    OR: [
      // La réservation commence pendant le créneau demandé
      { 
        starts_at: { lt: end },
        ends_at: { gt: start }
      },
      // La réservation se termine pendant le créneau demandé
      {
        starts_at: { lt: end },
        ends_at: { gt: start }
      },
      // La réservation contient complètement le créneau demandé
      {
        starts_at: { lte: start },
        ends_at: { gte: end }
      },
      // La réservation est contenue dans le créneau demandé
      {
        starts_at: { gte: start },
        ends_at: { lte: end }
      }
    ]
  };

  // Si un employé est spécifié, vérifier uniquement ses réservations
  if (employeeId) {
    whereClause.employee_id = employeeId;
  }

  // Exclure une réservation existante (pour la mise à jour)
  if (excludeReservationId) {
    whereClause.NOT = {
      id: excludeReservationId
    };
  }

  const conflict = await prisma.reservations.findFirst({
    where: whereClause,
    select: { 
      id: true, 
      status: true, 
      starts_at: true, 
      ends_at: true,
      clients: { select: { first_name: true, last_name: true } }
    },
  });

  return {
    available: !conflict,
    conflict: conflict ? {
      id: conflict.id,
      status: conflict.status,
      starts_at: conflict.starts_at,
      ends_at: conflict.ends_at,
      client_name: conflict.clients ? `${conflict.clients.first_name || ''} ${conflict.clients.last_name || ''}`.trim() : 'Client inconnu'
    } : null
  };
}

// POST: Crée une réservation manuelle
interface CreateReservationRequest {
  business_id: string;
  client_id: string;
  employee_id?: string | null;
  service_id: string;
  starts_at: string;
  duration_minutes: number;
  price_cents: number;
  notes?: string;
}

export async function POST(req: Request) {
  try {
    const authCheck = await requireAdminOrPermission("reservations");
    if (authCheck instanceof NextResponse) return authCheck;

    // Récupérer les données de la requête
    const body: CreateReservationRequest = await req.json();
    const { 
      business_id, 
      client_id, 
      employee_id, 
      service_id, 
      starts_at, 
      duration_minutes, 
      price_cents, 
      notes 
    } = body;

    // Validation des champs requis
    if (!business_id || !client_id || !service_id || !starts_at || !duration_minutes || !price_cents) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être renseignés" }, 
        { status: 400 }
      );
    }

    // Convertir la date de début en objet Date
    const startsAt = new Date(starts_at);
    if (isNaN(startsAt.getTime())) {
      return NextResponse.json(
        { error: "Format de date invalide" }, 
        { status: 400 }
      );
    }

    // Calculer la date de fin
    const endsAt = new Date(startsAt.getTime() + duration_minutes * 60000);

    // Vérifier la disponibilité du créneau
    console.log('Vérification du créneau:', { business_id, employee_id, startsAt, endsAt });
    const { available, conflict } = await isSlotAvailable(business_id, employee_id || null, startsAt, endsAt);
    
    console.log('Résultat de la vérification:', { available, conflict });
    
    if (!available) {
      if (conflict) {
        console.log('Conflit détecté:', JSON.stringify(conflict, null, 2));
        return NextResponse.json(
          { 
            error: "Créneau indisponible", 
            conflict: {
              message: `Conflit avec une réservation existante (${conflict.status}) pour ${conflict.client_name} de ${new Date(conflict.starts_at).toLocaleString()} à ${new Date(conflict.ends_at).toLocaleString()}`,
              details: conflict
            }
          }, 
          { status: 409 }
        );
      } else {
        console.error('Conflit détecté mais non disponible dans la réponse');
        return NextResponse.json(
          { error: "Créneau indisponible (conflit non spécifié)" },
          { status: 409 }
        );
      }
    }

    // Créer la réservation
    const reservation = await prisma.$transaction(async (prisma) => {
      // Créer la réservation
      const newReservation = await prisma.reservations.create({
        data: {
          business_id,
          client_id,
          employee_id: employee_id || null,
          starts_at: startsAt,
          ends_at: endsAt,
          status: "CONFIRMED",
          notes: notes || null,
          reservation_items: {
            create: [{
              service_id,
              price_cents: Math.round(price_cents * 100), // Convertir en centimes
              currency: "DZD",
              duration_minutes,
              employee_id: employee_id || null,
            }],
          },
        },
        include: {
          clients: true,
          employees: { select: { id: true, full_name: true } },
          businesses: { select: { id: true, public_name: true } },
          reservation_items: { 
            include: { 
              services: true,
              service_variants: true
            } 
          },
        },
      });

      // Ajouter une entrée dans l'historique des statuts
      await prisma.reservation_status_history.create({
        data: {
          reservation_id: newReservation.id,
          from_status: null,
          to_status: 'CONFIRMED',
          changed_by_user_id: authCheck.userId || null,
          changed_at: new Date(),
          reason: 'Réservation créée manuellement depuis l\'administration'
        }
      });

      return newReservation;
    });

    return NextResponse.json({ 
      success: true, 
      message: "Réservation créée avec succès",
      reservation 
    });

  } catch (e) {
    console.error("[POST /api/admin/reservations] Erreur:", e);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création de la réservation" }, 
      { status: 500 }
    );
  }
}
