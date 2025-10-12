import { NextResponse } from "next/server"
import { getAuthUserFromCookies } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: Statistiques détaillées du client
export async function GET() {
  const user = await getAuthUserFromCookies()
  if (!user) return NextResponse.json({ stats: null }, { status: 401 })

  const client = await prisma.clients.findFirst({ where: { user_id: user.id } })
  if (!client) return NextResponse.json({ stats: null }, { status: 404 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  // Statistiques des réservations
  const [
    totalReservations,
    upcomingReservations,
    monthReservations,
    yearReservations,
    completedReservations,
    cancelledReservations,
    totalSpent,
    favoritesCount,
    reviewsCount,
  ] = await Promise.all([
    // Total de réservations
    prisma.reservations.count({ where: { client_id: client.id } }),
    
    // Réservations à venir
    prisma.reservations.count({
      where: { client_id: client.id, starts_at: { gte: now }, status: { not: "CANCELLED" } }
    }),
    
    // Réservations ce mois
    prisma.reservations.count({
      where: {
        client_id: client.id,
        starts_at: { gte: startOfMonth, lt: endOfMonth }
      }
    }),
    
    // Réservations cette année
    prisma.reservations.count({
      where: {
        client_id: client.id,
        starts_at: { gte: startOfYear }
      }
    }),
    
    // Réservations complétées
    prisma.reservations.count({
      where: { client_id: client.id, status: "COMPLETED" }
    }),
    
    // Réservations annulées
    prisma.reservations.count({
      where: { client_id: client.id, status: "CANCELLED" }
    }),
    
    // Montant total dépensé (approximatif via reservation_items)
    prisma.reservation_items.aggregate({
      where: {
        reservations: { client_id: client.id, status: "COMPLETED" }
      },
      _sum: { price_cents: true }
    }),
    
    // Nombre de favoris
    prisma.client_favorites.count({ where: { client_id: client.id } }),
    
    // Nombre d'avis laissés
    prisma.reviews.count({ where: { client_id: client.id } }),
  ])

  // Top 3 des salons les plus visités
  const topBusinesses = await prisma.reservations.groupBy({
    by: ["business_id"],
    where: { client_id: client.id, status: { not: "CANCELLED" } },
    _count: { business_id: true },
    orderBy: { _count: { business_id: "desc" } },
    take: 3,
  })

  const topBusinessesDetails = await Promise.all(
    topBusinesses.map(async (item) => {
      const business = await prisma.businesses.findUnique({
        where: { id: item.business_id },
        select: { id: true, public_name: true, legal_name: true, logo_url: true }
      })
      return {
        business,
        count: item._count.business_id
      }
    })
  )

  // Services les plus réservés
  const topServices = await prisma.reservation_items.groupBy({
    by: ["service_id"],
    where: {
      reservations: { client_id: client.id, status: { not: "CANCELLED" } }
    },
    _count: { service_id: true },
    orderBy: { _count: { service_id: "desc" } },
    take: 5,
  })

  const topServicesDetails = await Promise.all(
    topServices.map(async (item) => {
      const service = await prisma.services.findUnique({
        where: { id: item.service_id },
        select: { id: true, name: true, category: true }
      })
      return {
        service,
        count: item._count.service_id
      }
    })
  )

  // Répartition par statut
  const statusDistribution = await prisma.reservations.groupBy({
    by: ["status"],
    where: { client_id: client.id },
    _count: { status: true }
  })

  return NextResponse.json({
    stats: {
      reservations: {
        total: totalReservations,
        upcoming: upcomingReservations,
        thisMonth: monthReservations,
        thisYear: yearReservations,
        completed: completedReservations,
        cancelled: cancelledReservations,
        statusDistribution: statusDistribution.map(s => ({
          status: s.status,
          count: s._count.status
        }))
      },
      spending: {
        totalCents: totalSpent._sum.price_cents || 0,
        total: (totalSpent._sum.price_cents || 0) / 100,
        currency: "DA"
      },
      favorites: {
        count: favoritesCount
      },
      reviews: {
        count: reviewsCount
      },
      topBusinesses: topBusinessesDetails,
      topServices: topServicesDetails
    }
  })
}
