import { NextResponse } from "next/server"
import { getAuthUserFromCookies } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const user = await getAuthUserFromCookies()
  if (!user) return NextResponse.json({ user: null }, { status: 401 })

  // Récupérer les infos du client
  let client = await prisma.clients.findFirst({
    where: { user_id: user.id },
    include: {
      users: true,
    },
  })

  // Créer automatiquement un client s'il n'existe pas encore
  if (!client) {
    client = await prisma.clients.create({
      data: {
        user_id: user.id,
        first_name: user.first_name ?? null,
        last_name: user.last_name ?? null,
        phone: user.phone ?? null,
      },
      include: { users: true },
    })
  }

  const addresses = await prisma.addresses.findMany({
    where: { user_id: user.id },
    orderBy: [{ is_default: "desc" }, { label: "asc" }],
    include: { cities: { select: { name: true } }, countries: { select: { code: true, name: true } } },
  })

  return NextResponse.json({ user: client, addresses })
}

export async function PUT(request: Request) {
  const user = await getAuthUserFromCookies()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const payload = await request.json().catch(() => ({}))
  const { user: userData, client: clientData } = payload

  const client = await prisma.clients.findFirst({ where: { user_id: user.id } })
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  const updated = await prisma.$transaction(async (tx) => {
    let updatedUser = null
    if (userData) {
      const allowUser: any = {}
      if ("first_name" in userData) allowUser.first_name = userData.first_name
      if ("last_name" in userData) allowUser.last_name = userData.last_name
      if ("phone" in userData) allowUser.phone = userData.phone
      if ("avatar_url" in userData) allowUser.avatar_url = userData.avatar_url
      if (Object.keys(allowUser).length > 0) {
        updatedUser = await tx.users.update({ where: { id: user.id }, data: allowUser })
      }
    }

    let updatedClient = null
    if (clientData) {
      const allowClient: any = {}
      if ("first_name" in clientData) allowClient.first_name = clientData.first_name
      if ("last_name" in clientData) allowClient.last_name = clientData.last_name
      if ("phone" in clientData) allowClient.phone = clientData.phone
      if ("notes" in clientData) allowClient.notes = clientData.notes
      if (Object.keys(allowClient).length > 0) {
        updatedClient = await tx.clients.update({ where: { id: client.id }, data: allowClient })
      }
    }

    return { updatedUser, updatedClient }
  })

  return NextResponse.json({ ok: true, ...updated })
}
