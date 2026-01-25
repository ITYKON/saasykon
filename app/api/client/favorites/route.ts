import { NextResponse } from "next/server"
import { getAuthUserFromCookies } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const user = await getAuthUserFromCookies()
  if (!user) return NextResponse.json({ favorites: [] }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get("page") || 1))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 12)))

  // Récupérer les salons favoris du client
  const client = await prisma.clients.findFirst({ where: { user_id: user.id } })
  if (!client) return NextResponse.json({ favorites: [] }, { status: 404 })

  const [total, rows] = await Promise.all([
    prisma.client_favorites.count({ 
      where: { 
        client_id: client.id,
        businesses: {
          archived_at: null,
          deleted_at: null
        }
      } 
    }),
    prisma.client_favorites.findMany({
      where: { 
        client_id: client.id,
        businesses: {
          archived_at: null,
          deleted_at: null
        }
      },
      include: {
        businesses: {
          select: {
            id: true,
            public_name: true,
            legal_name: true,
            cover_url: true,
            logo_url: true,
            phone: true,
            created_at: true,
            business_locations: {
              where: { is_primary: true },
              select: { address_line1: true, postal_code: true, cities: { select: { name: true } } },
              take: 1,
            },
          }
        },
      },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })
  ])

  // Compatibilité front: alias businesses.name et cover_image_url, et adresse primaire
  const favorites = rows.map((f: any) => {
    const b = f.businesses
    const name = b?.public_name || b?.legal_name || null
    const cover_image_url = b?.cover_url || null
    const loc = b?.business_locations?.[0]
    const city = loc?.cities?.name ?? null
    const address = loc ? `${loc.address_line1 ?? ""}${city ? ", " + city : ""}${loc.postal_code ? " " + loc.postal_code : ""}`.trim() : null
    return {
      ...f,
      businesses: {
        ...b,
        name,
        cover_image_url,
        address,
        city,
      },
    }
  })

  // Retourne à la fois la nouvelle forme et l'ancienne clé 'favorites'
  return NextResponse.json({ items: favorites, total, page, pageSize, favorites })
}

export async function POST(request: Request) {
  const user = await getAuthUserFromCookies()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { business_id } = await request.json().catch(() => ({}))
  if (!business_id) return NextResponse.json({ error: "Missing business_id" }, { status: 400 })

  const client = await prisma.clients.findFirst({ where: { user_id: user.id } })
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  // Upsert-like: ignore if already exists
  await prisma.client_favorites.upsert({
    where: { client_id_business_id: { client_id: client.id, business_id } },
    update: {},
    create: { client_id: client.id, business_id },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const user = await getAuthUserFromCookies()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const business_id = searchParams.get("business_id") || (await request.json().catch(() => ({}))).business_id
  if (!business_id) return NextResponse.json({ error: "Missing business_id" }, { status: 400 })

  const client = await prisma.clients.findFirst({ where: { user_id: user.id } })
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  await prisma.client_favorites.delete({
    where: { client_id_business_id: { client_id: client.id, business_id } },
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
