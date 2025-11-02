import { Calendar, Clock, Users, TrendingUp, DollarSign, Settings, Plus, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import CreateReservationModal from "@/components/pro/CreateReservationModal"
import { headers } from "next/headers"

export default async function ProDashboard() {
  // Fetch unified dashboard data from API (server-side)
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  const origin = `${proto}://${host}`;
  const resp = await fetch(`${origin}/api/pro/dashboard`, { cache: "no-store", headers: { cookie: h.get("cookie") || "" } });
  if (!resp.ok) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-red-600">Erreur de chargement du tableau de bord</h2>
      </div>
    )
  }
  const { kpis, todayAgenda, notifications, business, address } = await resp.json();
  const stats = {
    revenueCents: kpis?.revenueCents || 0,
    bookings: kpis?.bookings || 0,
    newClients: kpis?.newClients || 0,
    rating: kpis?.rating || 0,
  }
  const todayItems: Array<{ id: string; starts_at: Date; status: string; client: string; service: string; duration_minutes: number; price_cents: number }> = todayAgenda || []
  const formatMoney = (cents: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: kpis?.currency || "DZD" }).format((cents || 0) / 100)

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
                    {(notifications || []).length === 0 && (
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-gray-700">Aucune notification récente</p>
                      </div>
                    )}
                    {(notifications || []).map((n: any) => {
                      const t = (n.type || "").toLowerCase();
                      const color = t.includes("payment") ? { bg: "bg-green-50", text: "text-green-800" } : t.includes("cancel") ? { bg: "bg-orange-50", text: "text-orange-800" } : { bg: "bg-blue-50", text: "text-blue-800" };
                      const message = typeof n.payload?.message === "string" ? n.payload.message : n.type;
                      return (
                        <div key={n.id} className={`p-2 rounded ${color.bg}`}>
                          <p className={`${color.text}`}>{message}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  )
}
