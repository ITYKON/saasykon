import { Users, Building, DollarSign, TrendingUp, Calendar, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function AdminDashboard() {
  const globalStats = {
    totalSalons: 1247,
    totalUsers: 45632,
    monthlyRevenue: "2,450,000 DA",
    activeBookings: 3421,
  }

  const recentSalons = [
    {
      id: 1,
      name: "Beauty Studio Alger",
      owner: "Amina Khelifi",
      location: "Alger Centre",
      status: "en attente",
      subscription: "Pro",
      joinDate: "20 Sept 2025",
    },
    {
      id: 2,
      name: "Salon Elegance",
      owner: "Sarah Benali",
      location: "Oran",
      status: "actif",
      subscription: "Premium",
      joinDate: "18 Sept 2025",
    },
    {
      id: 3,
      name: "Coiffure Moderne",
      owner: "Fatima Meziani",
      location: "Constantine",
      status: "suspendu",
      subscription: "Basic",
      joinDate: "15 Sept 2025",
    },
  ]

  const systemAlerts = [
    {
      id: 1,
      type: "warning",
      message: "5 salons en attente de validation",
      time: "Il y a 2h",
    },
    {
      id: 2,
      type: "error",
      message: "Problème de paiement détecté",
      time: "Il y a 4h",
    },
    {
      id: 3,
      type: "success",
      message: "Nouveau record de réservations",
      time: "Il y a 6h",
    },
  ]

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 mb-6">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-black">Dashboard Administrateur</h2>
              <p className="text-gray-600">Vue d'ensemble de la plateforme Planity</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline">Exporter données</Button>
              <Button className="bg-black text-white hover:bg-gray-800">Paramètres système</Button>
            </div>
          </div>
        </div>
      </header>
      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Building className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-black">{globalStats.totalSalons}</p>
                    <p className="text-gray-600">Salons inscrits</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-black">{globalStats.totalUsers}</p>
                    <p className="text-gray-600">Utilisateurs actifs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-black">{globalStats.monthlyRevenue}</p>
                    <p className="text-gray-600">Revenus ce mois</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-black">{globalStats.activeBookings}</p>
                    <p className="text-gray-600">RDV actifs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Salons */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-black">Salons récents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentSalons.map((salon) => (
                  <div key={salon.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-black">{salon.name}</h3>
                        <p className="text-sm text-gray-600">Par {salon.owner}</p>
                        <p className="text-sm text-gray-500">{salon.location}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            salon.status === "actif"
                              ? "text-green-600 border-green-600"
                              : salon.status === "en attente"
                                ? "text-orange-600 border-orange-600"
                                : "text-red-600 border-red-600"
                          }
                        >
                          {salon.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">{salon.subscription}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Inscrit le {salon.joinDate}</span>
                    </div>

                    <div className="flex space-x-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
                      >
                        Voir détails
                      </Button>
                      {salon.status === "en attente" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-600 hover:bg-green-50 bg-transparent"
                        >
                          Valider
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* System Alerts & Quick Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-black">Alertes système</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {systemAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                      {alert.type === "warning" && <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />}
                      {alert.type === "error" && <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />}
                      {alert.type === "success" && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />}
                      <div className="flex-1">
                        <p className="text-sm text-black">{alert.message}</p>
                        <p className="text-xs text-gray-500">{alert.time}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-black">Actions rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-black text-white hover:bg-gray-800">
                    <Building className="h-4 w-4 mr-2" />
                    Valider les salons en attente
                  </Button>

                  <Button variant="outline" className="w-full border-black text-black hover:bg-gray-50 bg-transparent">
                    <Users className="h-4 w-4 mr-2" />
                    Gérer les utilisateurs
                  </Button>

                  <Button variant="outline" className="w-full border-black text-black hover:bg-gray-50 bg-transparent">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Rapports financiers
                  </Button>

                  <Button variant="outline" className="w-full border-black text-black hover:bg-gray-50 bg-transparent">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Statistiques détaillées
                  </Button>
                </CardContent>
              </Card>
            </div>
        </div>
      </>
    )
}
