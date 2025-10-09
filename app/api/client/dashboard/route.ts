import { NextResponse } from "next/server"
import { getAuthUserFromCookies } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const user = await getAuthUserFromCookies()
  if (!user) return NextResponse.json({ dashboard: null }, { status: 401 })

  // Récupérer le client
  const client = await prisma.clients.findFirst({ where: { user_id: user.id } })
  if (!client) return NextResponse.json({ dashboard: null }, { status: 404 })

  // Statistiques dashboard
  const upcomingCount = await prisma.reservations.count({
    where: { client_id: client.id, starts_at: { gte: new Date() } }
  })
  const monthCount = await prisma.reservations.count({
    where: {
      client_id: client.id,
      starts_at: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
      }
    }
  })
  const favoritesCount = await prisma.client_favorites.count({ where: { client_id: client.id } })

  // Prochains rendez-vous (les 5 prochains)
  const upcomingBookings = await prisma.reservations.findMany({
    where: { client_id: client.id, starts_at: { gte: new Date() } },
    include: {
      businesses: { select: { id: true, public_name: true, legal_name: true, cover_url: true, logo_url: true } },
      employees: { select: { id: true, full_name: true } },
      reservation_items: {
        include: { services: { select: { id: true, name: true } }, service_variants: true }
      },
      business_locations: { select: { id: true, address_line1: true, postal_code: true, cities: { select: { name: true } } } },
    },
    orderBy: { starts_at: "asc" },
    take: 5,
  })

  // Un échantillon des favoris (jusqu'à 10)
  const favorites = await prisma.client_favorites.findMany({
    where: { client_id: client.id },
    include: { businesses: { select: { id: true, public_name: true, legal_name: true, cover_url: true, logo_url: true } } },
    take: 10,
  })

  return NextResponse.json({
    dashboard: {
      upcomingCount,
      monthCount,
      favoritesCount,
      client: {
        id: client.id,
        first_name: client.first_name,
        last_name: client.last_name,
        user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, avatar_url: user.avatar_url },
      },
      upcomingBookings,
      favorites,
    }
  })
}
