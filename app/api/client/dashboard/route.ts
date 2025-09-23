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

  return NextResponse.json({
    dashboard: {
      upcomingCount,
      monthCount,
      favoritesCount,
    }
  })
}
