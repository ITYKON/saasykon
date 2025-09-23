import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUserFromCookies } from "@/lib/auth"

export async function GET(request: Request) {
  const user = await getAuthUserFromCookies()
  if (!user) return NextResponse.json({ bookings: [] }, { status: 401 })

  // Filtrer par type si besoin
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")

  // Récupérer les réservations du client
  const client = await prisma.clients.findFirst({ where: { user_id: user.id } })
  if (!client) return NextResponse.json({ bookings: [] }, { status: 404 })

  let where: any = { client_id: client.id }
  if (type === "upcoming") {
    where.starts_at = { gte: new Date() }
  } else if (type === "past") {
    where.starts_at = { lt: new Date() }
  }

  const bookings = await prisma.reservations.findMany({
    where,
    include: {
      businesses: true,
      employees: true,
      reservation_items: {
        include: { services: true }
      },
    },
    orderBy: { starts_at: "asc" },
  })

  return NextResponse.json({ bookings })
}
