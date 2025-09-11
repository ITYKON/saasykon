import { Calendar, MapPin, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function AdminReservations() {
  const reservations = [
    {
      id: 1,
      clientName: "Marie Dupont",
      service: "COUPE chez PAVANA",
      salon: "PAVANA",
      date: "20 sept. 2025 à 10:30",
      price: "2,200 DA",
      status: "Confirmé",
    },
    {
      id: 2,
      clientName: "Sarah Benali",
      service: "MANUCURE chez BELLA VISTA",
      salon: "BELLA VISTA",
      date: "22 sept. 2025 à 14:00",
      price: "1,800 DA",
      status: "En attente",
    },
    {
      id: 3,
      clientName: "Amina Khelifi",
      service: "COIFFURE chez SALON MODERNE",
      salon: "SALON MODERNE",
      date: "18 sept. 2025 à 16:30",
      price: "3,500 DA",
      status: "Confirmé",
    },
    {
      id: 4,
      clientName: "Fatima Meziani",
      service: "BRUSHING chez PAVANA",
      salon: "PAVANA",
      date: "19 sept. 2025 à 11:00",
      price: "1,500 DA",
      status: "Annulé",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmé":
        return "text-green-600"
      case "En attente":
        return "text-orange-600"
      case "Annulé":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black">Gestion des réservations</h1>
          <p className="text-gray-600 mt-1">Surveillez et gérez toutes les réservations de la plateforme.</p>
        </div>
        <Button className="bg-black text-white hover:bg-gray-800">Exporter données</Button>
      </div>

      <div className="space-y-4">
        {reservations.map((reservation) => (
          <Card key={reservation.id} className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <h3 className="text-lg font-semibold text-black">{reservation.clientName}</h3>
                  </div>

                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">{reservation.service}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>{reservation.date}</span>
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <div className="text-2xl font-bold text-black">{reservation.price}</div>
                  <div className={`font-semibold ${getStatusColor(reservation.status)}`}>{reservation.status}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
