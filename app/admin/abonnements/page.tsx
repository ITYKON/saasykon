import {
  Crown,
  Star,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AdminAbonnements() {
  const subscriptionStats = {
    totalRevenue: "1,250,000 DA",
    activeSubscriptions: 1247,
    monthlyGrowth: "+12%",
    churnRate: "2.3%",
  }

  const subscriptionPlans = [
    {
      name: "Basic",
      price: "5,000 DA/mois",
      color: "bg-gray-100 text-gray-800",
      icon: Package,
      features: ["Jusqu'à 50 RDV/mois", "Support email", "1 utilisateur"],
      subscribers: 456,
      revenue: "228,000 DA",
    },
    {
      name: "Pro",
      price: "15,000 DA/mois",
      color: "bg-blue-100 text-blue-800",
      icon: Star,
      features: ["RDV illimités", "Support prioritaire", "5 utilisateurs", "Analytics"],
      subscribers: 623,
      revenue: "934,500 DA",
    },
    {
      name: "Premium",
      price: "25,000 DA/mois",
      color: "bg-yellow-100 text-yellow-800",
      icon: Crown,
      features: ["Tout Pro +", "Support 24/7", "Utilisateurs illimités", "API access"],
      subscribers: 168,
      revenue: "420,000 DA",
    },
  ]

  const allSubscriptions = [
    {
      id: 1,
      salonName: "Beauty Studio Alger",
      owner: "Amina Khelifi",
      email: "amina@beautystudio.dz",
      plan: "Pro",
      status: "Actif",
      startDate: "20 Sept 2025",
      nextBilling: "20 Oct 2025",
      amount: "15,000 DA",
      paymentMethod: "Carte bancaire",
      autoRenewal: true,
    },
    {
      id: 2,
      salonName: "Salon Elegance",
      owner: "Sarah Benali",
      email: "sarah@elegance.dz",
      plan: "Premium",
      status: "Actif",
      startDate: "18 Sept 2025",
      nextBilling: "18 Oct 2025",
      amount: "25,000 DA",
      paymentMethod: "Virement",
      autoRenewal: true,
    },
    {
      id: 3,
      salonName: "Coiffure Moderne",
      owner: "Fatima Meziani",
      email: "fatima@moderne.dz",
      plan: "Basic",
      status: "Expiré",
      startDate: "15 Août 2025",
      nextBilling: "15 Sept 2025",
      amount: "5,000 DA",
      paymentMethod: "Carte bancaire",
      autoRenewal: false,
    },
    {
      id: 4,
      salonName: "Spa Wellness",
      owner: "Leila Hamidi",
      email: "leila@spawellness.dz",
      plan: "Pro",
      status: "En attente",
      startDate: "22 Sept 2025",
      nextBilling: "22 Oct 2025",
      amount: "15,000 DA",
      paymentMethod: "Carte bancaire",
      autoRenewal: true,
    },
    {
      id: 5,
      salonName: "Institut Beauté",
      owner: "Nadia Bouali",
      email: "nadia@institut.dz",
      plan: "Basic",
      status: "Suspendu",
      startDate: "10 Sept 2025",
      nextBilling: "10 Oct 2025",
      amount: "5,000 DA",
      paymentMethod: "Virement",
      autoRenewal: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">Gestion des abonnements</h1>
              <p className="text-gray-600">Gérez les plans d'abonnement et les revenus de la plateforme.</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" className="flex items-center bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button className="bg-black text-white hover:bg-gray-800 flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau plan
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-black">{subscriptionStats.totalRevenue}</p>
                  <p className="text-gray-600">Revenus mensuels</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-black">{subscriptionStats.activeSubscriptions}</p>
                  <p className="text-gray-600">Abonnements actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-green-600">{subscriptionStats.monthlyGrowth}</p>
                  <p className="text-gray-600">Croissance mensuelle</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-red-600">{subscriptionStats.churnRate}</p>
                  <p className="text-gray-600">Taux de désabonnement</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subscription Plans */}
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-2xl font-bold text-black">Plans d'abonnement</h2>

            {subscriptionPlans.map((plan) => (
              <Card key={plan.name} className="border-2">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg ${plan.color}`}>
                        <plan.icon className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-bold text-black">{plan.name}</h3>
                        <p className="text-lg font-semibold text-gray-600">{plan.price}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                  </div>

                  <div className="mb-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <div className="w-1.5 h-1.5 bg-black rounded-full mr-3"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-2xl font-bold text-black">{plan.subscribers}</p>
                      <p className="text-sm text-gray-600">Abonnés</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-black">{plan.revenue}</p>
                      <p className="text-sm text-gray-600">Revenus/mois</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl font-bold text-black">Tous les abonnements</CardTitle>
                  <div className="flex space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input placeholder="Rechercher un salon..." className="pl-10 w-64" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-40">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filtrer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="active">Actifs</SelectItem>
                        <SelectItem value="expired">Expirés</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="suspended">Suspendus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Salon</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Prochaine facturation</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allSubscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-black">{subscription.salonName}</p>
                            <p className="text-sm text-gray-600">{subscription.owner}</p>
                            <p className="text-xs text-gray-500">{subscription.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              subscription.plan === "Premium"
                                ? "text-yellow-600 border-yellow-600"
                                : subscription.plan === "Pro"
                                  ? "text-blue-600 border-blue-600"
                                  : "text-gray-600 border-gray-600"
                            }
                          >
                            {subscription.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              subscription.status === "Actif"
                                ? "text-green-600 border-green-600"
                                : subscription.status === "Expiré"
                                  ? "text-red-600 border-red-600"
                                  : subscription.status === "En attente"
                                    ? "text-yellow-600 border-yellow-600"
                                    : "text-orange-600 border-orange-600"
                            }
                          >
                            {subscription.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-black">{subscription.amount}</TableCell>
                        <TableCell className="text-sm text-gray-600">{subscription.nextBilling}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {subscription.status === "Expiré" && (
                              <Button size="sm" className="bg-black text-white hover:bg-gray-800">
                                Renouveler
                              </Button>
                            )}
                            {subscription.status === "Suspendu" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 bg-transparent"
                              >
                                Réactiver
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
