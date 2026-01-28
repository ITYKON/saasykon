import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function zonedDate(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {});
  const y = Number(parts.year);
  const m = Number(parts.month);
  const d = Number(parts.day);
  const h = Number(parts.hour === "24" ? "0" : (parts.hour || "0"));
  const min = Number(parts.minute || "0");
  const s = Number(parts.second || "0");
  return new Date(Date.UTC(y, m - 1, d, h, min, s));
}

function applyTimeLocal(baseDay: Date, time: Date) {
  const h = time.getUTCHours();
  const m = time.getUTCMinutes();
  const d = new Date(baseDay);
  d.setUTCHours(h, m, 0, 0);
  return d;
}

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

    // Vérifier les horaires d'ouverture
    const [businessLoc, businessWh] = await Promise.all([
      prisma.business_locations.findFirst({
        where: { business_id: businessId, is_primary: true },
        select: { timezone: true }
      }),
      prisma.working_hours.findMany({
        where: { business_id: businessId, employee_id: null },
        select: { weekday: true, start_time: true, end_time: true }
      })
    ]);

    const tz = businessLoc?.timezone || "Africa/Algiers";
    const zonedStart = zonedDate(startDate, tz);
    const zonedEnd = zonedDate(endDate, tz);
    const weekday = zonedStart.getUTCDay();

    const dayHours = businessWh.filter(wh => wh.weekday === weekday);
    if (dayHours.length === 0) {
      return NextResponse.json({ 
        available: false, 
        message: "L'institut est fermé ce jour-là" 
      });
    }

    const baseDay = new Date(zonedStart);
    baseDay.setUTCHours(0, 0, 0, 0);
    
    const isWithinBusinessHours = dayHours.some(wh => {
      const openTime = applyTimeLocal(baseDay, wh.start_time as any as Date);
      const closeTime = applyTimeLocal(baseDay, wh.end_time as any as Date);
      return zonedStart >= openTime && zonedEnd <= closeTime;
    });

    if (!isWithinBusinessHours) {
      return NextResponse.json({ 
        available: false, 
        message: "L'horaire choisi est en dehors des heures d'ouverture" 
      });
    }

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
