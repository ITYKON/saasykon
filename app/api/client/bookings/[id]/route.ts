import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUserFromCookies } from "@/lib/auth"

// GET: Récupérer les détails d'une réservation spécifique
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthUserFromCookies()
  if (!user) return NextResponse.json({ booking: null }, { status: 401 })

  const client = await prisma.clients.findFirst({ where: { user_id: user.id } })
  if (!client) return NextResponse.json({ booking: null }, { status: 404 })

  const booking = await prisma.reservations.findUnique({
    where: { id: params.id },
    include: {
      businesses: { 
        select: { 
          id: true, 
          public_name: true, 
          legal_name: true, 
          phone: true, 
          email: true,
          cover_url: true,
          logo_url: true
        } 
      },
      employees: { 
        select: { 
          id: true, 
          full_name: true
        } 
      },
      reservation_items: {
        include: { 
          services: { 
            select: { 
              id: true, 
              name: true, 
              description: true
            } 
          },
          service_variants: true
        }
      },
      business_locations: { 
        select: { 
          id: true,
          address_line1: true, 
          address_line2: true,
          postal_code: true, 
          latitude: true,
          longitude: true,
          cities: { select: { name: true } } 
        } 
      },
      clients: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          phone: true
        }
      }
    },
  })

  if (!booking || booking.client_id !== client.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Compatibilité front: alias businesses.name et address
  const name = booking.businesses?.public_name || booking.businesses?.legal_name || null
  const loc = booking.business_locations
  const address = loc ? `${loc.address_line1 ?? ""}${loc.address_line2 ? ", " + loc.address_line2 : ""}${loc.cities?.name ? ", " + loc.cities.name : ""}${loc.postal_code ? " " + loc.postal_code : ""}`.trim() : null

  const result: any = {
    ...booking,
    businesses: booking.businesses ? {
      ...booking.businesses,
      name,
      address,
    } : null,
  }

  return NextResponse.json({ booking: result })
}
