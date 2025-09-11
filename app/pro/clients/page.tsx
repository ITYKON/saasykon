import { Users, Filter, Phone, Mail, Calendar, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ProClients() {
  const clients = [
    {
      id: 1,
      name: "Sarah Benali",
      email: "sarah.benali@email.com",
      phone: "+213 XX XX XX XX",
      totalBookings: 12,
      lastVisit: "15 septembre 2025",
      totalSpent: 2400,
      averageRating: 4.8,
      favoriteServices: ["COUPE + COIFFAGE", "BRUSHING"],
      status: "VIP",
    },
    {
      id: 2,
      name: "Amina Khelifi",
      email: "amina.khelifi@email.com",
      phone: "+213 XX XX XX XX",
      totalBookings: 8,
      lastVisit: "18 septembre 2025",
      totalSpent: 1600,
      averageRating: 4.9,
      favoriteServices: ["BRUSHING", "MASQUE"],
      status: "Régulier",
    },
    {
      id: 3,
      name: "Fatima Meziani",
      email: "fatima.meziani@email.com",
      phone: "+213 XX XX XX XX",
      totalBookings: 3,
      lastVisit: "10 septembre 2025",
      totalSpent: 900,
      averageRating: 5.0,
      favoriteServices: ["COLORATION"],
      status: "Nouveau",
    },
    {
      id: 4,
      name: "Leila Boumediene",
      email: "leila.boumediene@email.com",
      phone: "+213 XX XX XX XX",
      totalBookings: 15,
      lastVisit: "20 septembre 2025",
      totalSpent: 3200,
      averageRating: 4.7,
      favoriteServices: ["COUPE + COIFFAGE", "COLORATION", "MÈCHES"],
      status: "VIP",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VIP":
        return "bg-yellow-100 text-yellow-800"
      case "Régulier":
        return "bg-green-100 text-green-800"
      case "Nouveau":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-black">Mes clients</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-black">{clients.length}</p>
                <p className="text-gray-600">Clients total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-black">{clients.filter((c) => c.status === "VIP").length}</p>
                <p className="text-gray-600">Clients VIP</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-black">{clients.filter((c) => c.status === "Nouveau").length}</p>
                <p className="text-gray-600">Nouveaux clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold">
                  {Math.round((clients.reduce((acc, c) => acc + c.averageRating, 0) / clients.length) * 10) / 10}
                </span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-black">Note moyenne</p>
                <p className="text-gray-600">Satisfaction</p>
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
              <Input placeholder="Rechercher un client..." className="w-full" />
            </div>
            <Select>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="regular">Régulier</SelectItem>
                <SelectItem value="new">Nouveau</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nom</SelectItem>
                <SelectItem value="lastVisit">Dernière visite</SelectItem>
                <SelectItem value="totalSpent">Montant dépensé</SelectItem>
                <SelectItem value="totalBookings">Nombre de RDV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {clients.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>
                      {client.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-black text-lg">{client.name}</h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                      {client.averageRating}
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  {client.email}
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  {client.phone}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Dernière visite: {client.lastVisit}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-600">Total RDV</p>
                  <p className="font-semibold text-black">{client.totalBookings}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total dépensé</p>
                  <p className="font-semibold text-black">{client.totalSpent} DA</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Services préférés:</p>
                <div className="flex flex-wrap gap-1">
                  {client.favoriteServices.map((service, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Calendar className="h-4 w-4 mr-1" />
                  Nouveau RDV
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Phone className="h-4 w-4 mr-1" />
                  Contacter
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
