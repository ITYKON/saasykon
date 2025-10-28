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
        business_locations: { select: { address_line1: true } },
        reservation_items: {
          select: {
            id: true,
            service_id: true,
            variant_id: true,
            price_cents: true,
            duration_minutes: true,
            services: { select: { id: true, name: true } },
            service_variants: { select: { id: true, name: true, duration_minutes: true, price_cents: true } },
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
      let totalPrice = 0;
      let serviceNames: string[] = [];

      // Vérifier si reservation_items existe avant de l'itérer
      if (reservation.reservation_items && Array.isArray(reservation.reservation_items)) {
        reservation.reservation_items.forEach((item: {
          service_variants?: { 
            duration_minutes?: number;
            name?: string;
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
          totalPrice += item.price_cents || 0;
          
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

      return {
        id: reservation.id,
        client: clientName,
        email: client?.email || '',
        telephone: client?.phone || '',
        service: serviceNames.join(' + ') || 'Aucun service',
        employe: employeeName,
        date: reservation.starts_at,
        heure: new Date(reservation.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        duree: `${totalDuration} min`,
        prix: (totalPrice / 100).toFixed(2) + ' DA',
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
