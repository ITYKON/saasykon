import { Calendar, Clock, MapPin, Star, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ClientReservations() {
  const bookings = [
    {
      id: 1,
      salon: "PAVANA",
      service: "COUPE + COIFFAGE",
      date: "20 septembre 2025",
      time: "10:30",
      duration: "30min",
      price: "200 DA",
      professional: "SOUSSOU HAMICHE",
      address: "16 Rue Hadi Ahmed Mohamed, 16000 Hydra",
      status: "confirmé",
      type: "upcoming",
    },
    {
      id: 2,
      salon: "Beauty Studio",
      service: "BRUSHING + SHAMPOING",
      date: "25 septembre 2025",
      time: "14:00",
      duration: "45min",
      price: "150 DA",
      professional: "Sarah Benali",
      address: "Rue Didouche Mourad, Alger Centre",
      status: "confirmé",
      type: "upcoming",
    },
    {
      id: 3,
      salon: "PAVANA",
      service: "MASQUE + COIFFAGE",
      date: "15 septembre 2025",
      time: "16:00",
      duration: "60min",
      price: "400 DA",
      professional: "SOUSSOU HAMICHE",
      rating: 5,
      status: "terminé",
      type: "past",
    },
    {
      id: 4,
      salon: "Salon Elite",
      service: "COLORATION",
      date: "10 septembre 2025",
      time: "09:00",
      duration: "120min",
      price: "800 DA",
      professional: "Amina Kaci",
      rating: 4,
      status: "terminé",
      type: "past",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-black">Mes réservations</h1>
        <Button className="bg-black text-white hover:bg-gray-800">Nouveau rendez-vous</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input placeholder="Rechercher par salon ou service..." className="w-full" />
            </div>
            <Select>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="upcoming">À venir</SelectItem>
                <SelectItem value="past">Terminés</SelectItem>
                <SelectItem value="cancelled">Annulés</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-black">Rendez-vous à venir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {bookings
            .filter((b) => b.type === "upcoming")
            .map((booking) => (
              <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-black text-lg">{booking.salon}</h3>
                        <p className="text-gray-600">{booking.service}</p>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {booking.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {booking.date} à {booking.time}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        {booking.duration} - {booking.price}
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        avec {booking.professional}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {booking.address}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Past Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-black">Historique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {bookings
            .filter((b) => b.type === "past")
            .map((booking) => (
              <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-black text-lg">{booking.salon}</h3>
                        <p className="text-gray-600">{booking.service}</p>
                      </div>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < booking.rating ? "text-yellow-500 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {booking.date} à {booking.time}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        {booking.duration} - {booking.price}
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        avec {booking.professional}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-black border-black hover:bg-gray-50 bg-transparent"
                    >
                      Reprendre RDV
                    </Button>
                    <Button variant="outline" size="sm" className="text-gray-600 border-gray-300 bg-transparent">
                      Voir détails
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  )
}
