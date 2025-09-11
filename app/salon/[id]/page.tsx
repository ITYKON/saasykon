"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, MapPin, Clock, Phone, Heart, Share2, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import BookingWizard from "@/components/booking-wizard"

export default function SalonPage({ params }: { params: { id: string } }) {
  const [showBooking, setShowBooking] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)

  const salon = {
    id: params.id,
    name: "PAVANA",
    address: "24 Rue Hadi Ahmed Mohamed, 16000 Hydra",
    rating: 4.9,
    reviewCount: 72,
    distance: "4.9 km",
    phone: "+213 21 XX XX XX",
    images: [
      "/elegant-beauty-salon-interior-with-warm-lighting-a.jpg",
      "/modern-beauty-salon-with-stylish-people-getting-ha.jpg",
      "/modern-beauty-salon-with-professional-hairstylist-.jpg",
    ],
    services: [
      {
        category: "COIFFURE - COIFFAGE",
        items: [
          {
            name: "BRUSHING COURT / MI-LONGS / LONGS à partir de 1200-2000 DA",
            description: "Coiffage uniquement",
            price: "45min",
            duration: "45min",
            id: 1,
          },
          {
            name: "SHAMPOING à partir de 300 DA",
            description: "Shampoing professionnel",
            price: "10min",
            duration: "10min",
            id: 2,
          },
          {
            name: "MASQUE à partir de 400 DA",
            description: "Masque nourrissant",
            price: "10min",
            duration: "10min",
            id: 3,
          },
          {
            name: "COUPE 2,200 DA",
            description: "Coupe personnalisée",
            price: "30min",
            duration: "30min",
            id: 4,
          },
          {
            name: "BRUSHING / SHAMPOING / MASQUE à partir de 1900 DA",
            description: "Prestation complète",
            price: "45min",
            duration: "45min",
            id: 5,
          },
        ],
      },
    ],
    hours: {
      Lundi: "09:00 - 18:00",
      Mardi: "09:00 - 18:00",
      Mercredi: "09:00 - 18:00",
      Jeudi: "09:00 - 18:00",
      Vendredi: "09:00 - 18:00",
      Samedi: "09:00 - 18:00",
      Dimanche: "09:00 - 18:00",
    },
    ratings: {
      overall: 4.9,
      welcome: 4.9,
      cleanliness: 4.9,
      atmosphere: 4.9,
      quality: 4.8,
    },
    reviews: [
      {
        id: 1,
        author: "Sarah B.",
        rating: 5,
        date: "Il y a 2 jours",
        comment: "Excellent service, très professionnel. Je recommande vivement !",
        service: "COUPE + COIFFAGE",
      },
      {
        id: 2,
        author: "Amina K.",
        rating: 5,
        date: "Il y a 1 semaine",
        comment: "Salon très propre, accueil chaleureux. Résultat parfait.",
        service: "BRUSHING",
      },
      {
        id: 3,
        author: "Leila M.",
        rating: 4,
        date: "Il y a 2 semaines",
        comment: "Bon salon, prix corrects. Satisfaite du résultat.",
        service: "MASQUE",
      },
    ],
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % salon.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + salon.images.length) % salon.images.length)
  }

  if (showBooking) {
    return <BookingWizard salon={salon} onClose={() => setShowBooking(false)} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-black tracking-wide">
              PLANITY
            </Link>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="hidden sm:flex bg-transparent">
                Je suis un professionnel de beauté
              </Button>
              <Button size="sm" className="bg-black text-white hover:bg-gray-800">
                Mon compte
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">{salon.name}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center text-gray-600 gap-2 sm:gap-4">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{salon.address}</span>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 text-yellow-500 fill-current" />
                <span className="font-semibold">{salon.rating}</span>
                <span className="ml-1">({salon.reviewCount} avis)</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFavorite(!isFavorite)}
              className={isFavorite ? "text-red-500 border-red-500" : ""}
            >
              <Heart className={`h-4 w-4 mr-1 ${isFavorite ? "fill-current" : ""}`} />
              {isFavorite ? "Retiré" : "Favoris"}
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-1" />
              Partager
            </Button>
            <Button className="bg-black hover:bg-gray-800 text-white" onClick={() => setShowBooking(true)}>
              Prendre RDV
            </Button>
          </div>
        </div>

        <div className="relative mb-8">
          <div className="aspect-video lg:aspect-[21/9] rounded-lg overflow-hidden">
            <Image
              src={salon.images[currentImageIndex] || "/placeholder.svg"}
              alt={`${salon.name} ${currentImageIndex + 1}`}
              fill
              className="object-cover"
            />
          </div>
          {salon.images.length > 1 && (
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
                {salon.images.map((_, index) => (
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
                <h2 className="text-xl font-semibold mb-4">Réserver en ligne pour un RDV chez {salon.name}</h2>
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
                {salon.services.map((category, categoryIndex) => (
                  <Card key={categoryIndex}>
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-4">{category.category}</h3>
                      <div className="space-y-3">
                        {category.items.map((service) => (
                          <div
                            key={service.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex-1 mb-3 sm:mb-0">
                              <p className="font-medium text-black">{service.name}</p>
                              <p className="text-sm text-gray-600">{service.description}</p>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              <span className="text-sm text-gray-600">{service.duration}</span>
                              <Button
                                size="sm"
                                className="bg-black hover:bg-gray-800 text-white"
                                onClick={() => setShowBooking(true)}
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
                {salon.reviews.map((review) => (
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
                  {Object.entries(salon.hours).map(([day, hours]) => (
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
                    <span className="text-sm">{salon.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-3 text-gray-500" />
                    <span className="text-sm">{salon.address}</span>
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
