import { Building, MapPin, Star, DollarSign, Filter, Plus, Eye, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"

export default function AdminSalons() {
  const salons = [
    {
      id: 1,
      name: "PAVANA",
      owner: "SOUSSOU HAMICHE",
      email: "pavana@email.com",
      phone: "+213 21 XX XX XX",
      address: "16 Rue Hadi Ahmed Mohamed, 16000 Hydra",
      city: "Alger",
      rating: 4.9,
      reviewCount: 72,
      totalBookings: 245,
      monthlyRevenue: 45000,
      status: "actif",
      subscription: "Premium",
      joinDate: "15 janvier 2024",
      lastActivity: "Il y a 2h",
      image: "/elegant-beauty-salon-interior-with-warm-lighting-a.jpg",
      services: ["Coiffure", "Coiffage", "Coloration"],
    },
    {
      id: 2,
      name: "Beauty Studio",
      owner: "Amina Khelifi",
      email: "beauty.studio@email.com",
      phone: "+213 21 XX XX XX",
      address: "Rue Didouche Mourad, Alger Centre",
      city: "Alger",
      rating: 4.7,
      reviewCount: 45,
      totalBookings: 189,
      monthlyRevenue: 32000,
      status: "actif",
      subscription: "Pro",
      joinDate: "3 mars 2024",
      lastActivity: "Il y a 1j",
      image: "/modern-beauty-salon-with-stylish-people-getting-ha.jpg",
      services: ["Brushing", "Shampoing", "Masque"],
    },
    {
      id: 3,
      name: "Salon Elite",
      owner: "Fatima Meziani",
      email: "salon.elite@email.com",
      phone: "+213 21 XX XX XX",
      address: "Boulevard Zighout Youcef, Alger",
      city: "Alger",
      rating: 4.8,
      reviewCount: 89,
      totalBookings: 156,
      monthlyRevenue: 28000,
      status: "en attente",
      subscription: "Basic",
      joinDate: "20 septembre 2025",
      lastActivity: "Il y a 3j",
      image: "/modern-beauty-salon-with-professional-hairstylist-.jpg",
      services: ["Coloration", "Mèches", "Lissage"],
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "actif":
        return "bg-green-100 text-green-800"
      case "en attente":
        return "bg-orange-100 text-orange-800"
      case "suspendu":
        return "bg-red-100 text-red-800"
      case "inactif":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSubscriptionColor = (subscription: string) => {
    switch (subscription) {
      case "Premium":
        return "bg-yellow-100 text-yellow-800"
      case "Pro":
        return "bg-blue-100 text-blue-800"
      case "Basic":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
            <header className="bg-white border-b border-gray-200 mb-6">
        <div className="px-6 py-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
        <h1 className="text-2xl font-bold text-black">Gestion des salons</h1>
         <p className="text-gray-600 mt-1">Surveillez et gérez toutes les salons de la plateforme.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
          <Button className="bg-black text-white hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter salon
          </Button>
        </div>
      </div>
         </div>
         </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-black">{salons.length}</p>
                <p className="text-gray-600">Total salons</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">{salons.filter((s) => s.status === "actif").length}</span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-black">Actifs</p>
                <p className="text-gray-600">Salons actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold">
                  {salons.filter((s) => s.status === "en attente").length}
                </span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-black">En attente</p>
                <p className="text-gray-600">À valider</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-black">
                  {Math.round(salons.reduce((acc, s) => acc + s.monthlyRevenue, 0) / 1000)}k DA
                </p>
                <p className="text-gray-600">Revenus totaux</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input placeholder="Rechercher un salon..." className="w-full" />
            </div>
            <Select>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="en attente">En attente</SelectItem>
                <SelectItem value="suspendu">Suspendu</SelectItem>
                <SelectItem value="inactif">Inactif</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Abonnement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Ville" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="alger">Alger</SelectItem>
                <SelectItem value="oran">Oran</SelectItem>
                <SelectItem value="constantine">Constantine</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Salons List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {salons.map((salon) => (
          <Card key={salon.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48">
              <Image src={salon.image || "/placeholder.svg"} alt={salon.name} fill className="object-cover" />
              <div className="absolute top-2 right-2 flex gap-2">
                <Badge className={getStatusColor(salon.status)}>{salon.status}</Badge>
                <Badge className={getSubscriptionColor(salon.subscription)}>{salon.subscription}</Badge>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-black">{salon.name}</h3>
                  <p className="text-gray-600">Par {salon.owner}</p>
                  <div className="flex items-center text-gray-600 text-sm mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {salon.address}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                    <span className="font-semibold">{salon.rating}</span>
                  </div>
                  <p className="text-xs text-gray-500">({salon.reviewCount} avis)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-600">RDV total</p>
                  <p className="font-semibold text-black">{salon.totalBookings}</p>
                </div>
                <div>
                  <p className="text-gray-600">Revenus/mois</p>
                  <p className="font-semibold text-black">{salon.monthlyRevenue.toLocaleString()} DA</p>
                </div>
                <div>
                  <p className="text-gray-600">Inscrit le</p>
                  <p className="font-semibold text-black">{salon.joinDate}</p>
                </div>
                <div>
                  <p className="text-gray-600">Dernière activité</p>
                  <p className="font-semibold text-black">{salon.lastActivity}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Services:</p>
                <div className="flex flex-wrap gap-1">
                  {salon.services.map((service, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Eye className="h-4 w-4 mr-1" />
                  Voir
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
                {salon.status === "en attente" && (
                  <Button size="sm" className="bg-green-600 text-white hover:bg-green-700">
                    Valider
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
