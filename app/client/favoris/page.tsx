import { Heart, MapPin, Star, Clock, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

export default function ClientFavoris() {
  const favoriteSalons = [
    {
      id: 1,
      name: "PAVANA",
      address: "16 Rue Hadi Ahmed Mohamed, 16000 Hydra",
      rating: 4.9,
      reviewCount: 72,
      image: "/elegant-beauty-salon-interior-with-warm-lighting-a.jpg",
      services: ["Coiffure", "Coiffage", "Coloration"],
      priceRange: "200 - 800 DA",
      openingHours: "09:00 - 18:00",
      phone: "+213 21 XX XX XX",
      distance: "2.5 km",
    },
    {
      id: 2,
      name: "Beauty Studio",
      address: "Rue Didouche Mourad, Alger Centre",
      rating: 4.7,
      reviewCount: 45,
      image: "/modern-beauty-salon-with-stylish-people-getting-ha.jpg",
      services: ["Brushing", "Shampoing", "Masque"],
      priceRange: "150 - 600 DA",
      openingHours: "08:30 - 19:00",
      phone: "+213 21 XX XX XX",
      distance: "1.8 km",
    },
    {
      id: 3,
      name: "Salon Elite",
      address: "Boulevard Zighout Youcef, Alger",
      rating: 4.8,
      reviewCount: 89,
      image: "/modern-beauty-salon-with-professional-hairstylist-.jpg",
      services: ["Coloration", "Mèches", "Lissage"],
      priceRange: "300 - 1200 DA",
      openingHours: "09:30 - 18:30",
      phone: "+213 21 XX XX XX",
      distance: "3.2 km",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black">Mes salons favoris</h1>
        <Badge variant="outline" className="text-gray-600">
          {favoriteSalons.length} salon{favoriteSalons.length > 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {favoriteSalons.map((salon) => (
          <Card key={salon.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48">
              <Image src={salon.image || "/placeholder.svg"} alt={salon.name} fill className="object-cover" />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-500"
              >
                <Heart className="h-4 w-4 fill-current" />
              </Button>
            </div>

            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-bold text-black">{salon.name}</h3>
                  <div className="flex items-center text-gray-600 text-sm mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {salon.address}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                    <span className="font-semibold">{salon.rating}</span>
                  </div>
                  <p className="text-xs text-gray-500">({salon.reviewCount} avis)</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex flex-wrap gap-2">
                  {salon.services.map((service, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {salon.openingHours}
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    {salon.phone}
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Prix: {salon.priceRange}</span>
                  <span className="text-gray-500">À {salon.distance}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-black text-white hover:bg-gray-800">Prendre RDV</Button>
                <Button variant="outline" className="border-black text-black hover:bg-gray-50 bg-transparent">
                  Voir profil
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {favoriteSalons.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun salon favori</h3>
            <p className="text-gray-600 mb-4">
              Ajoutez vos salons préférés à vos favoris pour les retrouver facilement
            </p>
            <Button className="bg-black text-white hover:bg-gray-800">Découvrir des salons</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
