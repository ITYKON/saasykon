"use client"; // 👈 must be the first line
import { Calendar, MapPin, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getStatusLabel(status: string) {
  switch (status) {
    case "CONFIRMED": return "Confirmé"
    case "PENDING": return "En attente"
    case "CANCELLED": return "Annulé"
    case "COMPLETED": return "Terminé"
    default: return status
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "CONFIRMED": return "text-green-600"
    case "PENDING": return "text-orange-600"
    case "CANCELLED": return "text-red-600"
    default: return "text-gray-600"
  }
}

export default function AdminReservations() {
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/reservations")
      .then(res => res.json())
      .then(data => {
        setReservations(data.reservations || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <header className="bg-white border-b border-gray-200 mb-6">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-black">Gestion des réservations</h1>
              <p className="text-gray-600 mt-1">Surveillez et gérez toutes les réservations de la plateforme.</p>
            </div>
            <Button className="bg-black text-white hover:bg-gray-800">Exporter données</Button>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-gray-500">Chargement...</div>
        ) : reservations.length === 0 ? (
          <div className="text-center text-gray-500">Aucune réservation trouvée.</div>
        ) : reservations.map((reservation) => (
          <Card key={reservation.id} className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <h3 className="text-lg font-semibold text-black">{reservation.client || "-"}</h3>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">{reservation.service ? `${reservation.service} chez ${reservation.salon}` : "-"}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(reservation.date)}</span>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="text-2xl font-bold text-black">{reservation.price ? `${reservation.price.toLocaleString()} DA` : "-"}</div>
                  <div className={`font-semibold ${getStatusColor(reservation.status)}`}>{getStatusLabel(reservation.status)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
