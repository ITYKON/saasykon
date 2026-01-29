import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUserFromCookies } from "@/lib/auth"
import { sendEmail } from "@/lib/email"

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

export async function GET(request: Request) {
  const user = await getAuthUserFromCookies()
  if (!user) return NextResponse.json({ bookings: [] }, { status: 401 })

  // Filtrer par type si besoin
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const page = Math.max(1, Number(searchParams.get("page") || 1))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 10)))

  // Récupérer les réservations du client
  let client = await prisma.clients.findFirst({ where: { user_id: user.id } })
  if (!client) {
    // Lazy creation
    client = await prisma.clients.create({
      data: {
        user_id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        status: 'NOUVEAU',
      }
    });
  }

  let where: any = { client_id: client.id }
  if (type === "upcoming") {
    where.starts_at = { gte: new Date() }
  } else if (type === "past") {
    where.starts_at = { lt: new Date() }
  }

  const [total, rows] = await Promise.all([
    prisma.reservations.count({ where }),
    prisma.reservations.findMany({
      where,
      include: {
        businesses: { select: { id: true, public_name: true, legal_name: true, phone: true } },
        employees: true,
        reservation_items: {
          include: { services: true }
        },
        business_locations: { select: { address_line1: true, postal_code: true, cities: { select: { name: true } } } },
      },
      orderBy: { starts_at: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  // Compatibilité front: alias businesses.name et businesses.address
  const bookings = rows.map((b: any) => {
    const name = b.businesses?.public_name || b.businesses?.legal_name || null
    const loc = b.business_locations
    const address = loc ? `${loc.address_line1 ?? ""}${loc.cities?.name ? ", " + loc.cities.name : ""}${loc.postal_code ? " " + loc.postal_code : ""}`.trim() : null
    return {
      ...b,
      businesses: {
        ...b.businesses,
        name,
        address,
      },
    }
  })

  // Retourne à la fois la nouvelle forme et l'ancienne clé 'bookings'
  return NextResponse.json({ items: bookings, total, page, pageSize, bookings })
}

// Créer une réservation par le client
export async function POST(request: Request) {
  const user = await getAuthUserFromCookies()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const { business_id, starts_at, items, notes, employee_id, location_id } = body || {}
  if (!business_id) return NextResponse.json({ error: "business_id required" }, { status: 400 })
  if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: "items required" }, { status: 400 })
  if (!starts_at) return NextResponse.json({ error: "starts_at required" }, { status: 400 })

  // Retrouver le client lié à l'utilisateur (créer s'il n'existe pas)
  let client = await prisma.clients.findFirst({ where: { user_id: user.id } })
  if (!client) {
    const u = await prisma.users.findUnique({ where: { id: user.id }, select: { first_name: true, last_name: true, phone: true } })
    client = await prisma.clients.create({
      data: {
        user_id: user.id,
        first_name: u?.first_name || null,
        last_name: u?.last_name || null,
        phone: u?.phone || null,
        status: 'NOUVEAU' as any,
      },
    })
  }

  const start = new Date(starts_at)
  if (isNaN(start.getTime())) return NextResponse.json({ error: "Invalid starts_at" }, { status: 400 })

  // Déduplication: éviter les doublons si même utilisateur/salon/horaire et mêmes items
  try {
    const minStart = new Date(start.getTime() - 60_000)
    const maxStart = new Date(start.getTime() + 60_000)
    const recent = new Date(Date.now() - 60_000)
    const existing = await prisma.reservations.findFirst({
      where: {
        client_id: client.id,
        business_id,
        starts_at: { gte: minStart, lte: maxStart },
        created_at: { gte: recent },
        status: { in: ["PENDING", "CONFIRMED"] as any },
      },
      include: { reservation_items: { select: { service_id: true } } },
    })
    if (existing) {
      // Si la première prestation correspond, on considère que c'est un doublon (cas des clics multiples sur un panier)
      const firstIncoming = String(items[0]?.service_id || '')
      const hasFirstMatch = existing.reservation_items.some((it: any) => String(it.service_id) === firstIncoming)
      if (hasFirstMatch) {
        return NextResponse.json({ booking: { id: existing.id } }, { status: 200 })
      }
    }
  } catch {}

  // Récupérer les horaires d'ouverture et la timezone
  const [businessLoc, businessWh] = await Promise.all([
    prisma.business_locations.findFirst({
      where: { business_id, is_primary: true },
      select: { timezone: true }
    }),
    prisma.working_hours.findMany({
      where: { business_id, employee_id: null },
      select: { weekday: true, start_time: true, end_time: true }
    })
  ]);

  const tz = businessLoc?.timezone || "Africa/Algiers";

  // Créer des réservations séparées pour chaque item dans une transaction
  let currentStart = new Date(start)
  const createdReservations: any[] = []

  // Validation des horaires avant de commencer la transaction
  for (const it of items) {
    const itemStart = it.starts_at ? new Date(it.starts_at) : currentStart;
    const duration = Number(it.duration_minutes || 0);
    const itemEnd = new Date(itemStart.getTime() + duration * 60000);
    
    const zonedStart = zonedDate(itemStart, tz);
    const zonedEnd = zonedDate(itemEnd, tz);
    const weekday = zonedStart.getUTCDay(); // 0-6

    // On considère d'abord les horaires de l'entreprise
    const dayHours = (businessWh as any[]).filter((wh: any) => wh.weekday === weekday);
    if (dayHours.length === 0) {
      return NextResponse.json({ error: "L'institut est fermé ce jour-là" }, { status: 400 });
    }

    // Vérifier si le créneau est dans au moins une plage d'ouverture
    const baseDay = new Date(zonedStart);
    baseDay.setUTCHours(0, 0, 0, 0);
    
    const isWithinBusinessHours = dayHours.some((wh: any) => {
      const openTime = applyTimeLocal(baseDay, wh.start_time as any as Date);
      const closeTime = applyTimeLocal(baseDay, wh.end_time as any as Date);
      return zonedStart >= openTime && zonedEnd <= closeTime;
    });

    if (!isWithinBusinessHours) {
      return NextResponse.json({ error: "L'horaire choisi est en dehors des heures d'ouverture" }, { status: 400 });
    }

    // Si un employé est spécifié, on pourrait aussi vérifier ses horaires propres
    // Mais pour le client, on se base principalement sur les horaires de l'entreprise affichés.
    // L'attribution de l'employé se fera ensuite avec vérification de conflit.

    currentStart = itemEnd;
  }

  // Reset currentStart for the actual creation loop
  currentStart = new Date(start);

  await prisma.$transaction(async (tx) => {
    for (const it of items) {
      if (it.starts_at) {
        currentStart = new Date(it.starts_at)
      }
      const duration = Number(it.duration_minutes || 0)
      const currentEnd = new Date(currentStart.getTime() + duration * 60000)
      const serviceId = String(it.service_id || '')

      // Résolution de l'employé pour CET item spécifique
      let itemEmployeeId: string | null = it.employee_id || employee_id || null

      // Vérifier si l'employé choisi (ou global) peut faire ce service
      if (itemEmployeeId) {
        const canDo = await tx.employee_services.findFirst({
          where: { employee_id: itemEmployeeId, service_id: serviceId }
        })
        if (!canDo) {
          itemEmployeeId = null // On invalide pour forcer une nouvelle recherche
        }
      }

      // Si pas d'employé ou incapable, on en cherche un disponible et compétent
      if (!itemEmployeeId) {
        const capableEmps = await tx.employees.findMany({
          where: {
            business_id,
            is_active: true,
            employee_services: { some: { service_id: serviceId } },
          },
          select: { id: true },
        })

        const candidateIds = capableEmps.map(e => e.id)
        for (const eid of candidateIds) {
          const conflict = await tx.reservations.findFirst({
            where: {
              employee_id: eid,
              status: { in: ["PENDING", "CONFIRMED"] as any },
              starts_at: { lt: currentEnd },
              ends_at: { gt: currentStart },
            },
            select: { id: true },
          })
          if (!conflict) {
            itemEmployeeId = eid
            break
          }
        }
      }

      const reservation = await tx.reservations.create({
        data: {
          business_id,
          client_id: client.id,
          employee_id: itemEmployeeId,
          location_id: location_id || null,
          booker_user_id: user.id,
          starts_at: currentStart,
          ends_at: currentEnd,
          status: 'PENDING' as any,
          notes: notes || null,
          source: 'WEB',
        },
      })

      await tx.reservation_items.create({
        data: {
          reservation_id: reservation.id,
          service_id: serviceId,
          variant_id: it.variant_id || null,
          employee_id: itemEmployeeId,
          price_cents: Number(it.price_cents || 0),
          currency: it.currency || 'DZD',
          duration_minutes: duration,
        },
      })

      createdReservations.push(reservation)
      currentStart = currentEnd
    }
  })

  const created = createdReservations[0]

  // Fire-and-forget email notification
  ;(async () => {
    try {
      const u = await prisma.users.findUnique({ where: { id: user.id }, select: { email: true, first_name: true } })
      if (!u?.email) return
      const business = await prisma.businesses.findUnique({ where: { id: body.business_id }, select: { public_name: true, legal_name: true } })
      const name = business?.public_name || business?.legal_name || 'Votre institut'
      const date = new Date(starts_at)
      const dateStr = date.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
      const timeStr = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
      await sendEmail({
        to: u.email,
        subject: `Merci pour votre réservation chez ${name}`,
        html: `<div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;line-height:1.6">
          <p>${u.first_name ? `Bonjour ${u.first_name},` : 'Bonjour,'}</p>
          <p>Merci pour votre réservation chez <strong>${name}</strong>.</p>
          <p>Votre rendez-vous est prévu le <strong>${dateStr}</strong> à <strong>${timeStr}</strong>.</p>
          <p>Si vous devez modifier ou annuler votre rendez-vous, répondez à cet email.</p>
          <p>À très bientôt,</p>
          <p>L'équipe ${name}</p>
        </div>`,
        category: 'booking-confirmation',
      })
    } catch {}
  })()

  return NextResponse.json({ booking: { id: created.id } }, { status: 201 })
}

// Modifier une réservation par le client (reprogrammer)
export async function PUT(request: Request) {
  const user = await getAuthUserFromCookies()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, starts_at, employee_id, notes } = await request.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: "Missing reservation id" }, { status: 400 })

  const client = await prisma.clients.findFirst({ where: { user_id: user.id } })
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  const reservation = await prisma.reservations.findUnique({ 
    where: { id }, 
    select: { id: true, client_id: true, status: true, starts_at: true, employee_id: true } 
  })
  if (!reservation || reservation.client_id !== client.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (reservation.status === "CANCELLED")
    return NextResponse.json({ error: "Cannot modify cancelled reservation" }, { status: 400 })

  // Préparer les données à mettre à jour
  const updateData: any = { updated_at: new Date() }
  if (starts_at) updateData.starts_at = new Date(starts_at)
  if (employee_id) updateData.employee_id = employee_id
  if (notes !== undefined) updateData.notes = notes

  // Mettre à jour la réservation + historiser
  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.reservations.update({ 
      where: { id }, 
      data: updateData,
      include: {
        businesses: { select: { id: true, public_name: true, legal_name: true, phone: true } },
        employees: true,
        reservation_items: { include: { services: true } },
        business_locations: { select: { address_line1: true, postal_code: true, cities: { select: { name: true } } } },
      }
    })
    
    // Historiser le changement
    await tx.reservation_status_history.create({
      data: {
        reservation_id: id,
        from_status: reservation.status as any,
        to_status: reservation.status as any,
        changed_by_user_id: user.id,
        reason: "modified-by-client",
      },
    })
    return res
  })

  return NextResponse.json({ booking: updated })
}

// Annuler une réservation par le client
export async function PATCH(request: Request) {
  const user = await getAuthUserFromCookies()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, reason } = await request.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: "Missing reservation id" }, { status: 400 })

  const client = await prisma.clients.findFirst({ where: { user_id: user.id } })
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  const reservation = await prisma.reservations.findUnique({ where: { id }, select: { id: true, client_id: true, status: true } })
  if (!reservation || reservation.client_id !== client.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (reservation.status === "CANCELLED")
    return NextResponse.json({ booking: reservation })

  // Mettre à jour le statut + historiser
  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.reservations.update({ where: { id }, data: { status: "CANCELLED", cancelled_at: new Date(), updated_at: new Date() } })
    await tx.reservation_status_history.create({
      data: {
        reservation_id: id,
        from_status: reservation.status as any,
        to_status: "CANCELLED",
        changed_by_user_id: user.id,
        reason: reason ?? "cancelled-by-client",
      },
    })
    return res
  })

  return NextResponse.json({ booking: updated })
}
