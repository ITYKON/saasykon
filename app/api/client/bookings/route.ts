import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUserFromCookies } from "@/lib/auth"
import { sendEmail } from "@/lib/email"

export async function GET(request: Request) {
  const user = await getAuthUserFromCookies()
  if (!user) return NextResponse.json({ bookings: [] }, { status: 401 })

  // Filtrer par type si besoin
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const page = Math.max(1, Number(searchParams.get("page") || 1))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 10)))

  // Récupérer les réservations du client
  const client = await prisma.clients.findFirst({ where: { user_id: user.id } })
  if (!client) return NextResponse.json({ bookings: [] }, { status: 404 })

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
      include: { reservation_items: { select: { service_id: true, duration_minutes: true, price_cents: true } } },
    })
    if (existing) {
      // comparer l'ensemble des services et le nombre d'items
      const existingSet = new Map<string, number>()
      for (const it of existing.reservation_items) {
        existingSet.set(String(it.service_id), (existingSet.get(String(it.service_id)) || 0) + 1)
      }
      const incomingSet = new Map<string, number>()
      for (const it of items) {
        incomingSet.set(String(it.service_id), (incomingSet.get(String(it.service_id)) || 0) + 1)
      }
      let same = existing.reservation_items.length === items.length && existingSet.size === incomingSet.size
      if (same) {
        for (const [k, v] of incomingSet) {
          if (existingSet.get(k) !== v) { same = false; break }
        }
      }
      if (same) {
        return NextResponse.json({ booking: { id: existing.id } }, { status: 200 })
      }
    }
  } catch {}

  // Calculer la fin en fonction des durées d'items
  const durations: number[] = items.map((i: any) => Number(i?.duration_minutes || 0))
  const totalMinutes = durations.reduce((s, x) => s + (isFinite(x) ? x : 0), 0)
  const ends = new Date(start.getTime() + totalMinutes * 60000)

  // Sélectionner un employé si 'Sans préférence'
  let resolvedEmployeeId: string | null = employee_id || null
  try {
    if (!resolvedEmployeeId && Array.isArray(items) && items.length > 0) {
      const firstServiceId = String(items[0]?.service_id || '')
      if (firstServiceId) {
        // Employés actifs du salon capables de faire ce service
        const emps = await prisma.employees.findMany({
          where: {
            business_id,
            is_active: true,
            employee_services: { some: { service_id: firstServiceId } },
          },
          select: { id: true },
        })
        const candidateIds: any[] = emps.map((e: any) => e.id)
        if (candidateIds.length) {
          // Vérifier disponibilité (pas de chevauchement)
          const available: any[] = []
          for (const eid of candidateIds) {
            const conflict = await prisma.reservations.findFirst({
              where: {
                employee_id: eid,
                status: { in: ["PENDING", "CONFIRMED"] as any },
                starts_at: { lt: ends },
                ends_at: { gt: start },
              },
              select: { id: true },
            })
            if (!conflict) available.push(eid)
          }
          if (available.length) {
            resolvedEmployeeId = available[Math.floor(Math.random() * available.length)]
          }
        }
      }
    }
  } catch {}

  // Créer la réservation + items dans une transaction
  const created = await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservations.create({
      data: {
        business_id,
        client_id: client.id,
        employee_id: resolvedEmployeeId || null,
        location_id: location_id || null,
        booker_user_id: user.id,
        starts_at: start,
        ends_at: ends,
        status: 'PENDING' as any,
        notes: notes || null,
        source: 'WEB',
      },
    })

    for (const it of items) {
      await tx.reservation_items.create({
        data: {
          reservation_id: reservation.id,
          service_id: it.service_id,
          variant_id: it.variant_id || null,
          employee_id: it.employee_id || resolvedEmployeeId || null,
          price_cents: Number(it.price_cents || 0),
          currency: it.currency || 'DZD',
          duration_minutes: Number(it.duration_minutes || 0),
        },
      })
    }

    return reservation
  })

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
