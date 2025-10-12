import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUserFromCookies } from "@/lib/auth"

// GET: Récupérer l'historique des changements de statut d'une réservation
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthUserFromCookies()
  if (!user) return NextResponse.json({ history: [] }, { status: 401 })

  const client = await prisma.clients.findFirst({ where: { user_id: user.id } })
  if (!client) return NextResponse.json({ history: [] }, { status: 404 })

  // Vérifier que la réservation appartient au client
  const reservation = await prisma.reservations.findUnique({
    where: { id: params.id },
    select: { client_id: true }
  })

  if (!reservation || reservation.client_id !== client.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Récupérer l'historique
  const history = await prisma.reservation_status_history.findMany({
    where: { reservation_id: params.id },
    include: {
      users: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true
        }
      }
    },
    orderBy: { changed_at: "desc" }
  })

  return NextResponse.json({ history })
}
