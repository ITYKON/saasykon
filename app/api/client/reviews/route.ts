import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUserFromCookies } from "@/lib/auth"

// GET: Récupérer les avis du client
export async function GET(request: Request) {
  const user = await getAuthUserFromCookies()
  if (!user) return NextResponse.json({ reviews: [] }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get("page") || 1))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 10)))
  const business_id = searchParams.get("business_id")

  const client = await prisma.clients.findFirst({ where: { user_id: user.id } })
  if (!client) return NextResponse.json({ reviews: [] }, { status: 404 })

  const where: any = { client_id: client.id }
  if (business_id) where.business_id = business_id

  const [total, reviews] = await Promise.all([
    prisma.reviews.count({ where }),
    prisma.reviews.findMany({
      where,
      include: {
        businesses: { 
          select: { 
            id: true, 
            public_name: true, 
            legal_name: true, 
            logo_url: true 
          } 
        },
        reservations: {
          select: {
            id: true,
            starts_at: true,
            reservation_items: {
              include: { services: { select: { name: true } } }
            }
          }
        }
      },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })
  ])

  return NextResponse.json({ reviews, total, page, pageSize })
}

// POST: Créer un avis
export async function POST(request: Request) {
  const user = await getAuthUserFromCookies()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { reservation_id, business_id, rating, comment } = await request.json().catch(() => ({}))
  
  if (!business_id || !rating) 
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  
  if (rating < 1 || rating > 5) 
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })

  const client = await prisma.clients.findFirst({ where: { user_id: user.id } })
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  // Vérifier que la réservation appartient au client (si fournie)
  if (reservation_id) {
    const reservation = await prisma.reservations.findUnique({ 
      where: { id: reservation_id },
      select: { client_id: true, business_id: true }
    })
    if (!reservation || reservation.client_id !== client.id)
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    
    // Vérifier que le business_id correspond
    if (reservation.business_id !== business_id)
      return NextResponse.json({ error: "Business mismatch" }, { status: 400 })
  }

  // Créer l'avis
  const review = await prisma.reviews.create({
    data: {
      client_id: client.id,
      business_id,
      reservation_id: reservation_id || null,
      rating,
      comment: comment || null,
    },
    include: {
      businesses: { 
        select: { 
          id: true, 
          public_name: true, 
          legal_name: true, 
          logo_url: true 
        } 
      }
    }
  })

  return NextResponse.json({ review })
}

// PUT: Modifier un avis
export async function PUT(request: Request) {
  const user = await getAuthUserFromCookies()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, rating, comment } = await request.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: "Missing review id" }, { status: 400 })

  const client = await prisma.clients.findFirst({ where: { user_id: user.id } })
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  const existing = await prisma.reviews.findUnique({ 
    where: { id },
    select: { id: true, client_id: true }
  })
  if (!existing || existing.client_id !== client.id)
    return NextResponse.json({ error: "Review not found" }, { status: 404 })

  const updateData: any = {}
  if (rating !== undefined) {
    if (rating < 1 || rating > 5) 
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    updateData.rating = rating
  }
  if (comment !== undefined) updateData.comment = comment
  
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const updated = await prisma.reviews.update({
    where: { id },
    data: updateData,
    include: {
      businesses: { 
        select: { 
          id: true, 
          public_name: true, 
          legal_name: true, 
          logo_url: true 
        } 
      }
    }
  })

  return NextResponse.json({ review: updated })
}

// DELETE: Supprimer un avis
export async function DELETE(request: Request) {
  const user = await getAuthUserFromCookies()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id") || (await request.json().catch(() => ({}))).id
  if (!id) return NextResponse.json({ error: "Missing review id" }, { status: 400 })

  const client = await prisma.clients.findFirst({ where: { user_id: user.id } })
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  const existing = await prisma.reviews.findUnique({ 
    where: { id },
    select: { id: true, client_id: true }
  })
  if (!existing || existing.client_id !== client.id)
    return NextResponse.json({ error: "Review not found" }, { status: 404 })

  await prisma.reviews.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
