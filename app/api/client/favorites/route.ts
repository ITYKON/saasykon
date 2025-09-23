import { NextResponse } from "next/server"
import { getAuthUserFromCookies } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const user = await getAuthUserFromCookies()
  if (!user) return NextResponse.json({ favorites: [] }, { status: 401 })

  // Récupérer les salons favoris du client
  const client = await prisma.clients.findFirst({ where: { user_id: user.id } })
  if (!client) return NextResponse.json({ favorites: [] }, { status: 404 })

  const favorites = await prisma.client_favorites.findMany({
    where: { client_id: client.id },
    include: {
      businesses: true,
    },
  })

  return NextResponse.json({ favorites })
}
