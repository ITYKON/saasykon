import { Calendar, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ClientDashboard() {
  const upcomingBookings = [
    {
      id: 1,
      salon: "PAVANA",
      service: "COUPE",
      date: "Samedi 20 septembre 2025",
      time: "10:30 (30min)",
      price: "2,200 DA",
      professional: "avec SOUSSOU HAMICHE",
      address: "24 Rue Hadj Ahmed Mohamed, 16000 Hydra",
      status: "Confirmé",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-black">Bonjour Marie !</h1>
              <p className="text-gray-600 mt-1">Gérez vos rendez-vous beauté en toute simplicité.</p>
            </div>
            <Button className="bg-black text-white hover:bg-gray-800">Prendre rendez-vous</Button>
          </div>
        </div>
      </header>

      <div className="p-8">
        <div className="grid grid-cols-3 gap-8 mb-8">
          <Card className="text-center border-0 shadow-none">
            <CardContent className="p-6">
              <div className="text-4xl font-bold text-black mb-2">2</div>
              <div className="text-gray-600">Rendez-vous à venir</div>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-none">
            <CardContent className="p-6">
              <div className="text-4xl font-bold text-black mb-2">2</div>
              <div className="text-gray-600">Rendez-vous ce mois</div>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-none">
            <CardContent className="p-6">
              <div className="text-4xl font-bold text-black mb-2">2</div>
              <div className="text-gray-600">Salons favoris</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-black">Prochains rendez-vous</h2>
            <Button className="bg-black text-white hover:bg-gray-800">Prendre rendez-vous</Button>
          </div>

          {upcomingBookings.map((booking) => (
            <Card key={booking.id} className="border-l-4 border-l-green-500 mb-4">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold text-black text-lg">{booking.salon}</span>
                      <Badge className="bg-green-100 text-green-800 border-0">{booking.status}</Badge>
                    </div>

                    <div className="text-gray-600">
                      <p className="font-medium">{booking.service}</p>
                      <p className="text-sm">{booking.professional}</p>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {booking.date}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {booking.time}
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <div className="text-2xl font-bold text-black">{booking.price}</div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="bg-transparent">
                        Modifier
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-600 bg-transparent">
                        Annuler
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
