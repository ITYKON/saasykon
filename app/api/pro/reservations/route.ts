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

    // Récupérer les réservations avec les relations nécessaires
    const reservations = await prisma.$queryRaw`
      SELECT 
        r.*,
        c.id as client_id,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.email as client_email,
        c.phone as client_phone,
        e.id as employee_id,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        ri.id as reservation_item_id,
        ri.service_id,
        ri.variant_id,
        ri.price_cents,
        ri.duration_minutes,
        s.name as service_name,
        sv.name as variant_name,
        sv.duration_minutes as variant_duration,
        sv.price_cents as variant_price,
        bl.address_line1 as location_address
      FROM 
        reservations r
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN employees e ON r.employee_id = e.id
      LEFT JOIN reservation_items ri ON r.id = ri.reservation_id
      LEFT JOIN services s ON ri.service_id = s.id
      LEFT JOIN service_variants sv ON ri.variant_id = sv.id
      LEFT JOIN business_locations bl ON r.location_id = bl.id
      WHERE 
        r.business_id = ${businessId}
      ORDER BY 
        r.starts_at DESC
    `;
    
    // Grouper les éléments de réservation par réservation
    const groupedReservations = (reservations as any[]).reduce<Record<string, any>>((acc, row) => {
      const reservationId = row.id;
      if (!acc[reservationId]) {
        acc[reservationId] = {
          id: row.id,
          business_id: row.business_id,
          client_id: row.client_id,
          employee_id: row.employee_id,
          starts_at: row.starts_at,
          ends_at: row.ends_at,
          status: row.status,
          notes: row.notes,
          client: row.client_id ? {
            id: row.client_id,
            first_name: row.client_first_name,
            last_name: row.client_last_name,
            email: row.client_email,
            phone: row.client_phone
          } : null,
          employee: row.employee_id ? {
            id: row.employee_id,
            first_name: row.employee_first_name,
            last_name: row.employee_last_name
          } : null,
          business_locations: row.location_address ? {
            address_line1: row.location_address
          } : null,
          reservation_items: []
        };
      }
      
      if (row.reservation_item_id) {
        acc[reservationId].reservation_items.push({
          id: row.reservation_item_id,
          service_id: row.service_id,
          variant_id: row.variant_id,
          price_cents: row.price_cents,
          duration_minutes: row.duration_minutes,
          services: row.service_id ? {
            id: row.service_id,
            name: row.service_name
          } : null,
          service_variants: row.variant_id ? {
            id: row.variant_id,
            name: row.variant_name,
            duration_minutes: row.variant_duration,
            price_cents: row.variant_price
          } : null
        });
      }
      
      return acc;
    }, {});
    
    const reservationsList = Object.values(groupedReservations);

    // Formater les données pour le frontend
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
        ? [employee.first_name, employee.last_name].filter(Boolean).join(' ') || 'Employé inconnu'
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
        status: reservation.status,
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
