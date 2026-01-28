import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Récupérer l'ID de l'entreprise depuis les paramètres de requête ou le contexte d'authentification
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('business_id') || ctx.assignments[0]?.business_id;
  
  if (!businessId) {
    return NextResponse.json({ error: "business_id is required" }, { status: 400 });
  }

  try {
    // Vérifier les autorisations
    const hasPermission = ctx.roles.includes("ADMIN") || 
      ctx.assignments.some(a => a.business_id === businessId && (a.role === "PRO" || a.role === "PROFESSIONNEL"));
    
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Récupérer les réservations avec Prisma ORM pour plus de fiabilité
    const reservationsList = await prisma.reservations.findMany({
      where: { business_id: businessId },
      orderBy: { starts_at: 'desc' },
      include: {
        clients: { select: { id: true, first_name: true, last_name: true, phone: true, users: { select: { email: true } } } },
        employees: { select: { id: true, full_name: true } },
        business_locations: { select: { address_line1: true, timezone: true } },
        reservation_items: {
          select: {
            id: true,
            service_id: true,
            variant_id: true,
            price_cents: true,
            duration_minutes: true,
            services: { 
              select: { 
                id: true, 
                name: true,
                service_variants: { take: 1, orderBy: { duration_minutes: 'asc' }, select: { price_min_cents: true, price_max_cents: true } }
              } 
            },
            service_variants: { select: { id: true, name: true, duration_minutes: true, price_cents: true, price_min_cents: true, price_max_cents: true } },
          },
        },
      },
    } as any);

    // Formater les données pour le frontend
    const STATUS_FR: Record<string, string> = {
      CONFIRMED: 'Confirmé',
      PENDING: 'En attente',
      COMPLETED: 'Terminé',
      CANCELLED: 'Annulé',
    };

    const formattedReservations = reservationsList.map((reservation: any) => {
      // Calculer la durée totale et le prix total
      let totalDuration = 0;
      let minTotal = 0;
      let maxTotal = 0;
      let counted = false;
      let serviceNames: string[] = [];

      // Vérifier si reservation_items existe avant de l'itérer
      if (reservation.reservation_items && Array.isArray(reservation.reservation_items)) {
        reservation.reservation_items.forEach((item: {
          service_variants?: { 
            duration_minutes?: number;
            name?: string;
            price_min_cents?: number | null;
            price_max_cents?: number | null;
          };
          services?: { 
            duration_minutes?: number;
            name?: string;
          };
          duration_minutes?: number;
          price_cents?: number;
        }) => {
          const variantDuration = item.service_variants?.duration_minutes || item.services?.duration_minutes || 0;
          const duration = item.duration_minutes || variantDuration;
          totalDuration += duration;
          const hasRange = typeof item.service_variants?.price_min_cents === 'number' && typeof item.service_variants?.price_max_cents === 'number'
          const svcVar = (item as any)?.services?.service_variants?.[0]
          const hasFallbackRange = typeof svcVar?.price_min_cents === 'number' && typeof svcVar?.price_max_cents === 'number'
          // Debug log to verify data coming from DB
          if (typeof item.price_cents === 'number' && item.price_cents > 0) { minTotal += item.price_cents; maxTotal += item.price_cents; counted = true; }
          else if (hasRange && item.service_variants) { 
            minTotal += (item.service_variants.price_min_cents as number); 
            maxTotal += (item.service_variants.price_max_cents as number); 
            counted = true; 
          } else if (hasFallbackRange && svcVar) {
            // Fallback to service's first variant range
            minTotal += (svcVar.price_min_cents as number)
            maxTotal += (svcVar.price_max_cents as number)
            counted = true
          }
          
          const serviceName = item.services?.name || 'Service inconnu';
          const variantName = item.service_variants?.name ? ` - ${item.service_variants.name}` : '';
          serviceNames.push(`${serviceName}${variantName}`);
        });
      }

      const client = reservation.clients;
      const employee = reservation.employees;
      const location = reservation.business_locations;

      const clientName = client 
        ? [client.first_name, client.last_name].filter(Boolean).join(' ') || 'Client inconnu'
        : 'Client non spécifié';

      const employeeName = employee
        ? (employee.full_name || 'Employé inconnu')
        : 'Aucun employé';

      const prixText = !counted
        ? '—'
        : (minTotal === maxTotal)
          ? (Math.round(minTotal / 100) + ' DA')
          : (`${Math.round(minTotal / 100)}–${Math.round(maxTotal / 100)} DA`)
      const tz = location?.timezone || 'Africa/Algiers';
      return {
        id: reservation.id,
        client: clientName,
        email: client?.email || '',
        telephone: client?.phone || '',
        service: serviceNames.join(' + ') || 'Aucun service',
        employe: employeeName,
        date: reservation.starts_at,
        heure: new Date(reservation.starts_at).toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: tz
        }),
        duree: `${totalDuration} min`,
        prix: prixText,
        status: STATUS_FR[reservation.status] || reservation.status,
        notes: reservation.notes || '',
        location: location?.address_line1 || 'Adresse non spécifiée',
      };
    });

    return NextResponse.json({ reservations: formattedReservations });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching reservations' },
      { status: 500 }
    );
  }
}
