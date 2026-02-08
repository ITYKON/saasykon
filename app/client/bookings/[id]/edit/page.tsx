"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"

type PageParams = {
  id: string
}
import { Calendar, Clock, MapPin, User, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

type Booking = {
  id: string
  status: string
  starts_at: string
  ends_at: string
  notes?: string | null
  businesses?: { name?: string; phone?: string }
  employees?: { id: string; full_name?: string }
  reservation_items?: Array<{ services?: { name?: string }; price_cents?: number }>
  business_locations?: { address_line1?: string; cities?: { name?: string } }
}

export default function EditBookingPage() {
  const params = useParams() as PageParams
  const router = useRouter()
  const { toast } = useToast()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    starts_at: "",
    notes: ""
  })

  useEffect(() => {
    const bookingId = params?.id
    if (!bookingId) return
    
    fetch(`/api/client/bookings/${bookingId}`)
      .then(res => res.json())
      .then(data => {
        if (data.booking) {
          setBooking(data.booking)
          const startsAt = new Date(data.booking.starts_at)
          const toDatetimeLocal = (d: Date) => {
            const pad = (n: number) => String(n).padStart(2, '0')
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
          }

          setFormData({
            starts_at: toDatetimeLocal(startsAt),
            notes: data.booking.notes || ""
          })
        }
        setLoading(false)
      })
      .catch(() => {
        toast({
          title: "Erreur",
          description: "Impossible de charger la réservation.",
          variant: "destructive"
        })
        setLoading(false)
      })
  }, [params?.id, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/client/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: params?.id,
          starts_at: new Date(formData.starts_at).toISOString(),
          notes: formData.notes
        })
      })

      if (response.ok) {
        toast({
          title: "Réservation modifiée",
          description: "Votre réservation a été modifiée avec succès.",
        })
        router.push("/client/reservations")
      } else {
        const error = await response.json()
        toast({
          title: "Erreur",
          description: error.error || "Impossible de modifier la réservation.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la modification.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Chargement...</div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="p-8">
        <div className="text-center">Réservation introuvable</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/client/reservations">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-black">Modifier la réservation</h1>
          <p className="text-gray-600 mt-1">Modifiez les détails de votre rendez-vous.</p>
        </div>
      </header>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informations actuelles */}
          <Card>
            <CardHeader>
              <CardTitle>Informations actuelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-black">{booking.businesses?.name || "Salon"}</p>
                  <p className="text-sm text-gray-600">
                    {booking.business_locations?.address_line1 || ""}
                    {booking.business_locations?.cities?.name ? `, ${booking.business_locations.cities.name}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-black">Professionnel</p>
                  <p className="text-sm text-gray-600">{booking.employees?.full_name || "Non assigné"}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-black">Service</p>
                  <p className="text-sm text-gray-600">{booking.reservation_items?.[0]?.services?.name || "Service"}</p>
                  <p className="text-sm font-medium text-black mt-1">
                    {booking.reservation_items?.[0]?.price_cents ? `${booking.reservation_items[0].price_cents / 100} DA` : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulaire de modification */}
          <Card>
            <CardHeader>
              <CardTitle>Modifier les détails</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="starts_at">Date et heure</Label>
                  <Input
                    id="starts_at"
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Actuel: {new Date(booking.starts_at).toLocaleString("fr-FR")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Ajoutez des notes pour votre rendez-vous..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-black text-white hover:bg-gray-800"
                    disabled={saving}
                  >
                    {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/client/reservations")}
                    disabled={saving}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-black mb-1">Politique de modification</h3>
                <p className="text-sm text-gray-600">
                  Vous pouvez modifier votre réservation jusqu'à 24 heures avant l'heure prévue. 
                  Pour toute modification dans les 24 heures précédant votre rendez-vous, veuillez contacter directement le salon au {booking.businesses?.phone || "numéro indiqué"}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
