import { NextResponse } from "next/server"
import { getAuthUserFromCookies } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const user = await getAuthUserFromCookies()
  if (!user) return NextResponse.json({ user: null }, { status: 401 })

  // Récupérer les infos du client
  const client = await prisma.clients.findFirst({
    where: { user_id: user.id },
    include: {
      users: true,
    },
  })

  return NextResponse.json({ user: client })
}
