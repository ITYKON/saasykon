"use client"
import { useEffect, useState } from "react"
import { Calendar, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"


type Booking = {
  id: string
  status: string
  starts_at: string
  businesses?: { name?: string }
  employees?: { full_name?: string }
  reservation_items?: Array<{ services?: { name?: string }, price_cents?: number }>
}

export default function ClientDashboard() {
  const [stats, setStats] = useState({ upcomingCount: 0, monthCount: 0, favoritesCount: 0 })
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [userName, setUserName] = useState<string>("")

  useEffect(() => {
    fetch("/api/client/dashboard")
      .then(res => res.json())
      .then(data => {
        if (data.dashboard) setStats(data.dashboard)
      })
    fetch("/api/client/bookings?type=upcoming")
      .then(res => res.json())
      .then(data => {
        setUpcomingBookings(data.bookings || [])
      })
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        if (d?.user) {
          setUserName(`${d.user.first_name || ""} ${d.user.last_name || ""}`.trim())
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-black">Bonjour {userName || "!"}</h1>
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
              <div className="text-4xl font-bold text-black mb-2">{stats.upcomingCount}</div>
              <div className="text-gray-600">Rendez-vous à venir</div>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-none">
            <CardContent className="p-6">
              <div className="text-4xl font-bold text-black mb-2">{stats.monthCount}</div>
              <div className="text-gray-600">Rendez-vous ce mois</div>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-none">
            <CardContent className="p-6">
              <div className="text-4xl font-bold text-black mb-2">{stats.favoritesCount}</div>
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
                      <span className="font-semibold text-black text-lg">{booking.businesses?.name || "Salon"}</span>
                      <Badge className="bg-green-100 text-green-800 border-0">{booking.status}</Badge>
                    </div>

                    <div className="text-gray-600">
                      <p className="font-medium">{booking.reservation_items?.[0]?.services?.name || "Service"}</p>
                      <p className="text-sm">{booking.employees?.full_name || "Professionnel"}</p>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(booking.starts_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(booking.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <div className="text-2xl font-bold text-black">{booking.reservation_items?.[0]?.price_cents ? (booking.reservation_items[0].price_cents / 100 + " DA") : ""}</div>
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
