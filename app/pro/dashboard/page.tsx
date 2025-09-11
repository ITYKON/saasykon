import { Calendar, Clock, Users, TrendingUp, DollarSign, Settings, Plus, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ProDashboard() {
  const todayBookings = [
    {
      id: 1,
      time: "09:00",
      client: "Sarah Benali",
      service: "COUPE + COIFFAGE",
      duration: "30min",
      price: "200 DA",
      status: "confirmé",
    },
    {
      id: 2,
      time: "10:30",
      client: "Amina Khelifi",
      service: "BRUSHING",
      duration: "45min",
      price: "150 DA",
      status: "confirmé",
    },
    {
      id: 3,
      time: "14:00",
      client: "Fatima Meziani",
      service: "MASQUE + COIFFAGE",
      duration: "60min",
      price: "400 DA",
      status: "en attente",
    },
  ]

  const weekStats = {
    revenue: "12,500 DA",
    bookings: 28,
    newClients: 5,
    rating: 4.8,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-black tracking-wide">PLANITY PRO</h1>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            <a href="#" className="flex items-center px-4 py-2 text-black bg-gray-100 rounded-lg">
              <TrendingUp className="h-5 w-5 mr-3" />
              Dashboard
            </a>
            <a href="/pro/agenda" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Calendar className="h-5 w-5 mr-3" />
              Agenda
            </a>
            <a href="/pro/clients" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Users className="h-5 w-5 mr-3" />
              Clients
            </a>
            <a href="/pro/services" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Settings className="h-5 w-5 mr-3" />
              Services
            </a>
            <a href="/pro/paiments" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <DollarSign className="h-5 w-5 mr-3" />
              Paiements
            </a>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-black">PAVANA</h2>
                <p className="text-gray-600">16 Rue Hadi Ahmed Mohamed, 16000 Hydra</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button className="bg-black text-white hover:bg-gray-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau RDV
                </Button>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Voir ma page
                </Button>
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
                    <p className="text-2xl font-bold text-black">{weekStats.revenue}</p>
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
                    <p className="text-2xl font-bold text-black">{weekStats.bookings}</p>
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
                    <p className="text-2xl font-bold text-black">{weekStats.newClients}</p>
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
                    <p className="text-2xl font-bold text-black">{weekStats.rating}</p>
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
                {todayBookings.map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center mb-1">
                          <Clock className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="font-semibold text-black">{booking.time}</span>
                        </div>
                        <h3 className="font-medium text-black">{booking.client}</h3>
                        <p className="text-sm text-gray-600">{booking.service}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          booking.status === "confirmé"
                            ? "text-green-600 border-green-600"
                            : "text-orange-600 border-orange-600"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>{booking.duration}</span>
                      <span className="font-semibold text-black">{booking.price}</span>
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
                <Button className="w-full bg-black text-white hover:bg-gray-800 h-12">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un RDV
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-black text-black hover:bg-gray-50 h-12 bg-transparent"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Gérer mes services
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-black text-black hover:bg-gray-50 h-12 bg-transparent"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Modifier mes horaires
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-black text-black hover:bg-gray-50 h-12 bg-transparent"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Voir les statistiques
                </Button>

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
    </div>
  )
}
