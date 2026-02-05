"use client"
import { useEffect, useState, useCallback } from "react"
import { Calendar, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

import { Menu, X } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { usePathname } from "next/navigation"

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
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const loadData = useCallback(() => {
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

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) return
    
    setCancellingId(bookingId)
    try {
      const response = await fetch("/api/client/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bookingId, reason: "cancelled-by-client" })
      })
      
      if (response.ok) {
        toast({
          title: "Réservation annulée",
          description: "Votre réservation a été annulée avec succès.",
        })
        loadData() // Recharger les données
      } else {
        const error = await response.json()
        toast({
          title: "Erreur",
          description: error.error || "Impossible d'annuler la réservation.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'annulation.",
        variant: "destructive"
      })
    } finally {
      setCancellingId(null)
    }
  }

  const handleModifyBooking = (bookingId: string) => {
    router.push(`/client/bookings/${bookingId}/edit`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header (fixed full-width overlay that continues behind the sidebar) */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:pl-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold tracking-wide transition-colors text-black hover:text-gray-800">
                YOKA
              </Link>
            </div>
            <Button className="w-full sm:w-auto bg-black text-white hover:bg-gray-800" asChild>
              <Link href="/institut-de-beaute">Prendre rendez-vous</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Spacer matching header height so content is not hidden behind the fixed header */}
      <div className="h-16" />

      <div>
 <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold text-black">Bonjour {userName || "!"}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="text-center border-0 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="text-3xl sm:text-4xl font-bold text-black mb-1 sm:mb-2">{stats.upcomingCount}</div>
              <div className="text-sm sm:text-base text-gray-600">Rendez-vous à venir</div>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="text-3xl sm:text-4xl font-bold text-black mb-1 sm:mb-2">{stats.monthCount}</div>
              <div className="text-sm sm:text-base text-gray-600">Rendez-vous ce mois</div>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="text-3xl sm:text-4xl font-bold text-black mb-1 sm:mb-2">{stats.favoritesCount}</div>
              <div className="text-sm sm:text-base text-gray-600">Salons favoris</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-black">Prochains rendez-vous</h2>
            <Button className="w-full sm:w-auto bg-black text-white hover:bg-gray-800" asChild>
              <Link href="/institut-de-beaute">Prendre rendez-vous</Link>
            </Button>
          </div>

          {upcomingBookings.map((booking) => {
            const isCancelled = booking.status?.toLowerCase().includes("cancel")
            return (
            <Card key={booking.id} className={isCancelled ? "border-l-4 border-l-red-500 mb-4" : "border-l-4 border-l-green-500 mb-4"}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="space-y-2 flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className={`font-semibold text-black text-base sm:text-lg break-words ${isCancelled ? 'line-through text-gray-600' : ''}`}>
                        {booking.businesses?.name || "Salon"}
                      </span>
                      <Badge className={isCancelled ? "bg-red-50 text-red-700 border-red-200 text-xs sm:text-sm" : "bg-green-100 text-green-800 border-0 text-xs sm:text-sm"}>
                        {booking.status}
                      </Badge>
                    </div>

                    <div className="text-gray-600">
                      <p className={`font-medium text-sm sm:text-base ${isCancelled ? 'line-through text-gray-500' : ''}`}>
                        {booking.reservation_items?.[0]?.services?.name || "Service"}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {booking.employees?.full_name || "Professionnel"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                        {new Date(booking.starts_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                        {new Date(booking.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto sm:text-right space-y-2 mt-3 sm:mt-0">
                    <div className="text-xl sm:text-2xl font-bold text-black">
                      {booking.reservation_items?.[0]?.price_cents ? (booking.reservation_items[0].price_cents / 100 + " DA") : ""}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      {!isCancelled && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-transparent w-full sm:w-auto"
                            onClick={() => handleModifyBooking(booking.id)}
                          >
                            Modifier
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 border-red-600 bg-transparent w-full sm:w-auto"
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancellingId === booking.id}
                          >
                            {cancellingId === booking.id ? "Annulation..." : "Annuler"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )})}
        </div>
      </div>
    </div>
  )
}
