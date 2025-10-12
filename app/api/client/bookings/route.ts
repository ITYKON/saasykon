import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUserFromCookies } from "@/lib/auth"

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
