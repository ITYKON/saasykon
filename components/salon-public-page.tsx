"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, MapPin, Clock, Phone, Heart, Share2, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import BookingWizard from "@/components/booking-wizard"
import { useRouter } from "next/navigation"
import { buildSalonSlug, extractSalonId } from "@/lib/salon-slug"

interface SalonPublicPageProps {
  salonId: string
  initialData?: any // Optionnel : pour hydrater si on fait du SSR plus tard
}

export default function SalonPublicPage({ salonId }: SalonPublicPageProps) {
  const router = useRouter()
  const [showBooking, setShowBooking] = useState(false)
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState<{
    id: string
    name: string
    duration_minutes: number
    price_cents?: number | null
  } | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any | null>(null)

  // On utilise l'ID passé en prop
  const businessId = salonId

  // Vérifier si le salon est dans les favoris au chargement
  useEffect(() => {
    if (!businessId) return
    let mounted = true
    const checkFavorite = async () => {
      try {
        const response = await fetch('/api/client/favorites')
        if (response.ok) {
          const { favorites } = await response.json()
          if (mounted) {
            setIsFavorite(favorites.some((fav: any) => fav.businesses?.id === businessId))
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des favoris:', error)
      }
    }
    checkFavorite()
    return () => { mounted = false }
  }, [businessId])

  useEffect(() => {
    if (!businessId) return
    let mounted = true
    setLoading(true)
    fetch(`/api/salon/${businessId}`, { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(j?.error || "Erreur de chargement")
        return j
      })
      .then((j) => {
        if (!mounted) return
        setData(j)
        setError(null)
      })
      .catch((e) => {
        if (!mounted) return
        setError(e?.message || "Erreur de chargement")
      })
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [businessId])

  /* 
  // Redirection canonique désactivée ici car gérée par le composant parent ou la structure d'URL
  useEffect(() => {
    if (!data?.name || !businessId) return
    const canonicalSlug = buildSalonSlug(data.name, businessId, data.city)
    // Logique de redirection à adapter selon le contexte d'usage
  }, [data?.name, businessId, router])
  */

  const salon = useMemo(() => {
    if (!data) return null
    const ratings = {
      overall: Number(data.rating || 0) || 0,
      welcome: Number(data.rating || 0) || 0,
      cleanliness: Number(data.rating || 0) || 0,
      atmosphere: Number(data.rating || 0) || 0,
      quality: Number(data.rating || 0) || 0,
    }
    // Map services to UI shape
    const services = (data.services || []).map((c: any) => ({
      category: c.category,
      items: (c.items || []).map((it: any) => ({
        id: it.id,
        name: it.name,
        description: it.description || "",
        // Raw fields preserved for booking
        duration_minutes: it.duration_minutes || 30,
        price_cents: it.price_cents ?? null,
        ...(typeof it.price_min_cents === 'number' ? { price_min_cents: it.price_min_cents } : {}),
        ...(typeof it.price_max_cents === 'number' ? { price_max_cents: it.price_max_cents } : {}),
        // Display fields
        duration: `${it.duration_minutes || 30}min`,
        price: (typeof it.price_min_cents === 'number' && typeof it.price_max_cents === 'number')
          ? `${Math.round(it.price_min_cents / 100)}–${Math.round(it.price_max_cents / 100)} DA`
          : (it.price_cents != null ? `${Math.round(it.price_cents / 100)} DA` : "—"),
      })),
    }))
    const hours: Record<string, string> = (data.hours as Record<string, string>) || {
      Lundi: "Fermé",
      Mardi: "Fermé",
      Mercredi: "Fermé",
      Jeudi: "Fermé",
      Vendredi: "Fermé",
      Samedi: "Fermé",
      Dimanche: "Fermé",
    }
    const reviews = (data.reviews || []).map((r: any) => ({
      id: r.id,
      author: r.author || "Client",
      rating: r.rating || 0,
      date: new Date(r.date).toLocaleDateString("fr-FR"),
      comment: r.comment || "",
      service: "",
    }))
    return {
      id: data.id,
      name: data.name,
      city: data.city ?? null,
      address: data.address,
      rating: ratings.overall,
      reviewCount: data.reviewCount || reviews.length,
      distance: "",
      phone: data.phone || "",
      images: data.images?.length ? data.images : ["/placeholder.svg"],
      services,
      hours,
      ratings,
      reviews,
    }
  }, [data])

  const nextImage = () => {
    const len = salon?.images?.length || 1
    setCurrentImageIndex((prev) => (prev + 1) % len)
  }

  const prevImage = () => {
    const len = salon?.images?.length || 1
    setCurrentImageIndex((prev) => (prev - 1 + len) % len)
  }

  if (showBooking && salon) {
    return <BookingWizard salon={salon} initialService={selectedServiceForBooking} onClose={() => setShowBooking(false)} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">Chargement…</div>
    )
  }

  if (error || !salon) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-600">{error || "Salon introuvable"}</div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">{salon?.name || (loading ? "Chargement..." : "Salon")}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center text-gray-600 gap-2 sm:gap-4">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{salon?.address || (loading ? "Chargement..." : "")}</span>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 text-yellow-500 fill-current" />
                <span className="font-semibold">{salon?.rating ?? 0}</span>
                <span className="ml-1">({salon?.reviewCount ?? 0} avis)</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (isFavoriteLoading) return;
                setIsFavoriteLoading(true);
                try {
                  if (isFavorite) {
                    await fetch(`/api/client/favorites?business_id=${businessId}`, {
                      method: 'DELETE',
                    });
                  } else {
                    await fetch('/api/client/favorites', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ business_id: businessId }),
                    });
                  }
                  setIsFavorite(!isFavorite);
                } catch (error) {
                  console.error('Erreur lors de la mise à jour des favoris:', error);
                } finally {
                  setIsFavoriteLoading(false);
                }
              }}
              className={isFavorite ? "text-red-500 border-red-500" : ""}
            >
              <Heart className={`h-4 w-4 mr-1 ${isFavorite ? "fill-current" : ""} ${isFavoriteLoading ? "opacity-50" : ""}`} />
              {isFavoriteLoading ? "Chargement..." : (isFavorite ? "Retiré" : "Favoris")}
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-1" />
              Partager
            </Button>
            {data?.claimStatus === 'none' ? (
              <Link href={`/claims?business_id=${businessId}&business_name=${encodeURIComponent(salon?.name || '')}`}>
                <Button variant="outline" size="sm" className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200">
                  Revendiquer mon établissement
                </Button>
              </Link>
            ) : (
              <Button className="bg-black hover:bg-gray-800 text-white" disabled={!salon} onClick={() => setShowBooking(true)}>
                Prendre RDV
              </Button>
            )}
          </div>
        </div>

        <div className="relative mb-8">
          <div className="aspect-video lg:aspect-[21/6] rounded-lg overflow-hidden">
            <Image
              src={
                businessId === '71831c69-7b17-4344-b873-583e4a976f07' 
                  ? "/institutbykm.jpg" 
                  : (salon?.images?.[currentImageIndex]) || "/placeholder.svg"
              }
              alt={`${salon?.name || "Salon"} ${currentImageIndex + 1}`}
              fill
              className="object-cover"
              priority
            />
          </div>
          {businessId !== '71831c69-7b17-4344-b873-583e4a976f07' && salon?.images?.length > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={prevImage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={nextImage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {(salon?.images || []).map((_: any, index: number) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full ${index === currentImageIndex ? "bg-white" : "bg-white/50"}`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Réserver en ligne pour un RDV chez {salon?.name || "ce salon"}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>24h/24</span>
                  <span>•</span>
                  <span>Gratuitement</span>
                  <span>•</span>
                  <span>Paiement sur place</span>
                  <span>•</span>
                  <span>Confirmation immédiate</span>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="services" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="services">Choix de la prestation</TabsTrigger>
                <TabsTrigger value="reviews">Avis</TabsTrigger>
              </TabsList>

              <TabsContent value="services" className="space-y-6">
                {(salon?.services || []).map((category: any, categoryIndex: number) => (
                  <Card key={categoryIndex}>
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-4 uppercase text-gray-700">{category.category}</h3>
                      <div className="divide-y divide-gray-200">
                        {category.items.map((service: any, index: number) => (
                          <div
                            key={service.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between py-4 first:pt-0"
                          >
                            <div className="flex-1 mb-3 sm:mb-0">
                              <p className="font-normal text-gray-900">
                                {service.name} {service.price && service.price !== "—" && service.price}
                              </p>
                              {service.description && (
                                <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                              )}
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              <span className="text-sm text-gray-600">{service.duration}</span>
                              <Button
                                size="sm"
                                className="bg-black hover:bg-gray-800 text-white"
                                onClick={() => {
                                  setSelectedServiceForBooking({
                                    id: service.id,
                                    name: service.name,
                                    duration_minutes: Number(service.duration_minutes || 30),
                                    price_cents: service.price_cents ?? null,
                                    ...(typeof service.price_min_cents === 'number' ? { price_min_cents: service.price_min_cents } : {}),
                                    ...(typeof service.price_max_cents === 'number' ? { price_max_cents: service.price_max_cents } : {}),
                                  })
                                  setShowBooking(true)
                                }}
                              >
                                Choisir
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4">
                {(salon?.reviews || []).map((review: any) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-black">{review.author}</p>
                          <p className="text-sm text-gray-600">{review.service}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? "text-yellow-500 fill-current" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">{review.date}</p>
                        </div>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rating Card */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-black mb-2">{salon.ratings.overall}</div>
                  <div className="flex justify-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">{salon.reviewCount} clients ont donné leur avis</p>
                </div>

                <div className="space-y-3">
                  {Object.entries({
                    Accueil: salon.ratings.welcome,
                    Propreté: salon.ratings.cleanliness,
                    "Cadre & Ambiance": salon.ratings.atmosphere,
                    "Qualité de la prestation": salon.ratings.quality,
                  }).map(([category, rating]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{category}</span>
                      <div className="flex items-center">
                        <span className="text-sm font-medium mr-2">{rating}</span>
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Hours Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Horaires d'ouverture
                </h3>
                <div className="space-y-2">
                  {Object.entries((salon?.hours || {}) as Record<string, string>).map(([day, hours]) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{day}</span>
                      <span className={hours === "Fermé" ? "text-red-600" : "text-gray-600"}>{hours}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Contact</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-3 text-gray-500" />
                    <span className="text-sm">{salon?.phone || ""}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-3 text-gray-500" />
                    <span className="text-sm">{salon?.address || ""}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
