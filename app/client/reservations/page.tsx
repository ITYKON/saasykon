"use client"
import { useEffect, useMemo, useState } from "react"
import { Calendar, Clock, MapPin, Star, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from 'next/link';

type Booking = {
  id: string
  status: string
  starts_at: string
  duration_minutes?: number | null
  businesses?: { name?: string; address?: string | null }
  employees?: { full_name?: string }
  reservation_items?: Array<{ services?: { name?: string }; price_cents?: number }>
}

export default function ClientReservations() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const loadBookings = () => {
    fetch("/api/client/bookings")
      .then((res) => res.json())
      .then((data) => setBookings(data.bookings || []))
      .catch(() => setBookings([]))
  }

  useEffect(() => {
    loadBookings()
  }, [])

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
        loadBookings()
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

  const upcoming = useMemo(() => bookings.filter((b) => new Date(b.starts_at) >= new Date()), [bookings])
  const past = useMemo(() => bookings.filter((b) => new Date(b.starts_at) < new Date()), [bookings])

  return (
    <div className="min-h-screen bg-gray-50">
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
              {/* <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black">Mes réservations</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Gérez vos réservations beauté en toute simplicité.</p>
            </div>
            <Button className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto">
              <Link href="/institut-de-beaute">Nouveau rendez-vous</Link>
            </Button>
          </div>
        </div> */}

      {/* Main content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full mt-16">
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="w-full">
              <Input placeholder="Rechercher par salon ou service..." className="w-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Select onValueChange={(v) => setStatusFilter(v === "all" ? null : v)}>
                <SelectTrigger className="w-full">
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
                <SelectTrigger className="w-full">
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
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Bookings */}
      <Card className="mb-6">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl font-bold text-black">Rendez-vous à venir</CardTitle>
        </CardHeader>
        <CardContent>
          {(statusFilter === "past" ? [] : upcoming).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-2 text-center">
              <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mb-2" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-700 ">Aucun rendez-vous encore</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6">Prenez votre premier rendez-vous maintenant !</p>
              <Button className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto">
                <Link href="/institut-de-beaute">Prendre RDV</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {(statusFilter === "past" ? [] : upcoming)
            .map((booking) => {
              const isCancelled = booking.status?.toLowerCase().includes("cancel")
              return (
              <div key={booking.id} className={`border border-gray-200 rounded-lg p-4 sm:p-5 hover:shadow-md transition-shadow ${isCancelled ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-green-500'}`}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-black text-base sm:text-lg truncate ${isCancelled ? 'line-through text-gray-600' : ''}`}>{booking.businesses?.name || "Salon"}</h3>
                      <p className={`text-sm sm:text-base ${isCancelled ? 'line-through text-gray-500' : 'text-gray-600'} truncate`}>{booking.reservation_items?.[0]?.services?.name || "Service"}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={isCancelled ? "bg-red-50 text-red-700 border-red-200 whitespace-nowrap" : "text-green-600 border-green-600 whitespace-nowrap"}
                    >
                      {booking.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-2 min-w-0">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{new Date(booking.starts_at).toLocaleDateString()} à {new Date(booking.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{booking.duration_minutes ? `${booking.duration_minutes} min` : "—"} - {booking.reservation_items?.[0]?.price_cents ? `${booking.reservation_items[0].price_cents / 100} DA` : ""}</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">avec {booking.employees?.full_name || "Professionnel"}</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{booking.businesses?.address || "—"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    {!isCancelled && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent w-full sm:w-auto"
                          onClick={() => handleModifyBooking(booking.id)}
                        >
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent w-full sm:w-auto"
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
            )})}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Bookings */}
      <Card>
        <CardHeader className="px-4 py-2 sm:px-4">
          <CardTitle className="text-lg sm:text-xl font-bold text-black px-2">Historique</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {(statusFilter === "upcoming" ? [] : past).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-2 sm:py-2 text-center">
              <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mb-2" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-700">Aucun rendez-vous dans l'historique</h3>
              <p className="text-sm sm:text-base text-gray-600">Vos rendez-vous passés apparaîtront ici.</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {(statusFilter === "upcoming" ? [] : past)
            .map((booking) => (
              <div key={booking.id} className="border border-gray-200 rounded-lg p-4 sm:p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-black text-base sm:text-lg truncate">{booking.businesses?.name || "Salon"}</h3>
                      <p className="text-sm sm:text-base text-gray-600 truncate">{booking.reservation_items?.[0]?.services?.name || "Service"}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < 0 ? "text-yellow-500 fill-current" : "text-gray-300"}`} />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-2 min-w-0">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{new Date(booking.starts_at).toLocaleDateString()} à {new Date(booking.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{booking.duration_minutes ? `${booking.duration_minutes} min` : "—"} - {booking.reservation_items?.[0]?.price_cents ? `${booking.reservation_items[0].price_cents / 100} DA` : ""}</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">avec {booking.employees?.full_name || "Professionnel"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-black border-black hover:bg-gray-50 bg-transparent w-full sm:w-auto"
                    >
                      Reprendre RDV
                    </Button>
                    <Button variant="outline" size="sm" className="text-gray-600 border-gray-300 bg-transparent w-full sm:w-auto">
                      Voir détails
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </div>
  )
}
