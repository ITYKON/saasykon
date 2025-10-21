import { Calendar, Clock, Users, TrendingUp, DollarSign, Settings, Plus, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import Link from "next/link"
import CreateReservationModal from "@/components/pro/CreateReservationModal"

export default async function ProDashboard() {
  // Load current business from cookie, fallback to first owned business
  const cookieStore = cookies();
  const businessId = cookieStore.get("business_id")?.value;
  let business: { public_name: string; legal_name: string; id: string } | null = null;
  let address: { address_line1?: string | null } | null = null;
  if (businessId) {
    business = await prisma.businesses.findUnique({ where: { id: businessId }, select: { id: true, public_name: true, legal_name: true } });
    const loc = await prisma.business_locations.findFirst({ where: { business_id: businessId, is_primary: true }, select: { address_line1: true } });
    address = loc as any;
  } else {
    // Fallback: pick any business of the logged-in user via session cookie
    const sessionToken = cookieStore.get(process.env.SESSION_COOKIE_NAME || "saas_session")?.value;
    if (sessionToken) {
      const session = await prisma.sessions.findUnique({ where: { token: sessionToken } });
      if (session) {
        const owned = await prisma.businesses.findFirst({ where: { owner_user_id: session.user_id }, select: { id: true, public_name: true, legal_name: true } });
        business = owned as any;
        if (owned) {
          const loc = await prisma.business_locations.findFirst({ where: { business_id: owned.id, is_primary: true }, select: { address_line1: true } });
          address = loc as any;
        }
      }
    }
  }
  // Compute real stats and today's agenda directly via Prisma (no fetch needed)
  let todayItems: Array<{ id: string; starts_at: Date; status: string; client: string; service: string; duration_minutes: number; price_cents: number }> = []
  let stats: { revenueCents: number; bookings: number; newClients: number; rating: number } = { revenueCents: 0, bookings: 0, newClients: 0, rating: 0 }
  if (business?.id) {
    const bizId = business.id
    // Day range
    const start = new Date(); start.setHours(0,0,0,0); const end = new Date(start); end.setDate(end.getDate()+1)
    // Week range (Mon..Sun)
    const now = new Date(); const day = now.getDay(); const diff = (day === 0 ? -6 : 1) - day; const weekStart = new Date(now); weekStart.setDate(now.getDate()+diff); weekStart.setHours(0,0,0,0); const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate()+7)

    const [reservations, paymentsAgg, bookingsCount, firsts, ratingAgg] = await Promise.all([
      prisma.reservations.findMany({
        where: { business_id: bizId, starts_at: { gte: start, lt: end } },
        orderBy: { starts_at: "asc" },
        select: {
          id: true, starts_at: true, ends_at: true, status: true,
          clients: { select: { first_name: true, last_name: true } },
          reservation_items: { select: { price_cents: true, duration_minutes: true, services: { select: { name: true } } } },
        },
      }),
      prisma.payments.aggregate({ _sum: { amount_cents: true }, where: { business_id: bizId, status: { in: ["CAPTURED", "AUTHORIZED"] as any }, created_at: { gte: weekStart, lt: weekEnd } } }),
      prisma.reservations.count({ where: { business_id: bizId, starts_at: { gte: weekStart, lt: weekEnd }, status: { in: ["CONFIRMED", "COMPLETED"] as any } } }),
      prisma.reservations.groupBy({ by: ["client_id"], where: { business_id: bizId, client_id: { not: null } }, _min: { starts_at: true } }),
      prisma.ratings_aggregates.findUnique({ where: { business_id: bizId } }).catch(() => null as any),
    ])

    todayItems = reservations.map((r) => {
      const priceCents = r.reservation_items.reduce((s, it) => s + (it.price_cents || 0), 0)
      const duration = r.reservation_items.reduce((s, it) => s + (it.duration_minutes || 0), 0)
      const serviceNames = r.reservation_items.map((it) => it.services?.name).filter(Boolean).join(" + ")
      const client = [r.clients?.first_name || "", r.clients?.last_name || ""].join(" ").trim() || "Client"
      return { id: r.id, starts_at: r.starts_at, status: r.status as any, client, service: serviceNames, duration_minutes: duration, price_cents: priceCents }
    })

    const newClients = firsts.filter((g) => g._min.starts_at && g._min.starts_at >= weekStart && g._min.starts_at < weekEnd).length
    const rating = ratingAgg?.rating_avg ? Number(ratingAgg.rating_avg) : 0
    stats = { revenueCents: paymentsAgg._sum.amount_cents || 0, bookings: bookingsCount, newClients, rating }
  }
  const formatMoney = (cents: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "DZD" }).format((cents || 0) / 100)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-black">{business?.public_name || business?.legal_name || "Mon salon"}</h2>
                {address?.address_line1 ? (
                  <p className="text-gray-600">{address.address_line1}</p>
                ) : (
                  <p className="text-gray-600">&nbsp;</p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {business?.id && (
                  <CreateReservationModal
                    businessId={business.id}
                    trigger={
                      <Button className="bg-black text-white hover:bg-gray-800">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau RDV
                      </Button>
                    }
                  />
                )}
                <Link href={business?.id ? `/salon/${business.id}` : "#"}>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Voir ma page
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-black">{formatMoney(stats.revenueCents)}</p>
                    <p className="text-gray-600">Cette semaine</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-black">{stats.bookings}</p>
                    <p className="text-gray-600">RDV cette semaine</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-black">{stats.newClients}</p>
                    <p className="text-gray-600">Nouveaux clients</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-black">{stats.rating}</p>
                    <p className="text-gray-600">Note moyenne</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-black">Agenda d'aujourd'hui</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {todayItems.map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center mb-1">
                          <Clock className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="font-semibold text-black">{new Date(booking.starts_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <h3 className="font-medium text-black">{booking.client}</h3>
                        <p className="text-sm text-gray-600">{booking.service}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          booking.status === "CONFIRMED"
                            ? "text-green-600 border-green-600"
                            : "text-orange-600 border-orange-600"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>{booking.duration_minutes}min</span>
                      <span className="font-semibold text-black">{formatMoney(booking.price_cents)}</span>
                    </div>

                    <div className="flex space-x-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
                      >
                        Modifier
                      </Button>
                      <Button variant="outline" size="sm" className="text-gray-600 border-gray-300 bg-transparent">
                        Contacter
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-black">Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {business?.id && (
                  <CreateReservationModal
                    businessId={business.id}
                    trigger={
                      <Button className="w-full bg-black text-white hover:bg-gray-800 h-12">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un RDV
                      </Button>
                    }
                  />
                )}

                <Link href="/pro/services" className="block">
                  <Button
                    variant="outline"
                    className="w-full border-black text-black hover:bg-gray-50 h-12 bg-transparent"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Gérer mes services
                  </Button>
                </Link>

                <Link href="/pro/profil-institut" className="block">
                  <Button
                    variant="outline"
                    className="w-full border-black text-black hover:bg-gray-50 h-12 bg-transparent"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Modifier mes horaires
                  </Button>
                </Link>

                <Link href="/pro/statistiques" className="block">
                  <Button
                    variant="outline"
                    className="w-full border-black text-black hover:bg-gray-50 h-12 bg-transparent"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Voir les statistiques
                  </Button>
                </Link>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-black mb-3">Notifications récentes</h4>
                  <div className="space-y-2 text-sm">
                    <div className="p-2 bg-blue-50 rounded">
                      <p className="text-blue-800">Nouveau RDV confirmé pour demain 14h</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded">
                      <p className="text-green-800">Paiement reçu: 200 DA</p>
                    </div>
                    <div className="p-2 bg-orange-50 rounded">
                      <p className="text-orange-800">RDV annulé: Sarah B. - 16h</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  )
}
