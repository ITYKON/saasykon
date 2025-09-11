import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import { MapPin, Star, Filter, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface PageProps {
  params: {
    ville: string
  }
}

const validCities = [
  "paris",
  "marseille",
  "lyon",
  "toulouse",
  "nice",
  "nantes",
  "montpellier",
  "strasbourg",
  "bordeaux",
  "lille",
]

const cityNames: Record<string, string> = {
  paris: "Paris",
  marseille: "Marseille",
  lyon: "Lyon",
  toulouse: "Toulouse",
  nice: "Nice",
  nantes: "Nantes",
  montpellier: "Montpellier",
  strasbourg: "Strasbourg",
  bordeaux: "Bordeaux",
  lille: "Lille",
}

const filters = ["Coupe", "Rasage", "Taille de barbe", "Soins visage", "Traditionnel"]

const salons = [
  {
    id: 1,
    name: "Barbershop Vintage",
    address: "25 Rue de la Paix, 75002 Paris",
    rating: 4.9,
    reviewCount: 234,
    priceRange: "€€",
    image: "/traditional-barbershop-vintage-chairs-mirrors.jpg",
    featured: true,
    timeSlots: {
      morning: ["09:00", "10:30", "11:00"],
      afternoon: ["14:00", "15:30", "16:00"],
    },
  },
  {
    id: 2,
    name: "Modern Barber",
    address: "18 Boulevard Saint-Germain, 75005 Paris",
    rating: 4.7,
    reviewCount: 167,
    priceRange: "€€€",
    image: "/modern-barbershop-contemporary-style.jpg",
    featured: true,
    timeSlots: {
      morning: ["09:30", "10:00", "11:30"],
      afternoon: ["14:30", "15:00", "16:30"],
    },
  },
  {
    id: 3,
    name: "Gentleman's Cut",
    address: "7 Rue du Faubourg Saint-Honoré, 75008 Paris",
    rating: 4.8,
    reviewCount: 189,
    priceRange: "€€€€",
    image: "/luxury-barbershop-elegant-interior.jpg",
    featured: false,
    timeSlots: {
      morning: ["09:00", "10:00", "11:00"],
      afternoon: ["14:00", "15:00", "16:00"],
    },
  },
]

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cityName = cityNames[params.ville]
  if (!cityName) return { title: "Ville non trouvée" }

  return {
    title: `Barbier ${cityName} - Réservation en ligne | Planity`,
    description: `Trouvez et réservez votre barbier à ${cityName}. Les meilleurs barbershops avec réservation en ligne 24h/24.`,
  }
}

export default function BarbierVillePage({ params }: PageProps) {
  if (!validCities.includes(params.ville)) {
    notFound()
  }

  const cityName = cityNames[params.ville]

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Button variant="outline" className="border-gray-300 bg-transparent">
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </Button>
          {filters.map((filter) => (
            <Button key={filter} variant="outline" className="border-gray-300 hover:bg-gray-50 bg-transparent">
              {filter}
            </Button>
          ))}
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sélectionnez un salon</h1>
          <p className="text-gray-600 mb-2">
            Les meilleurs barbiers aux alentours de {cityName} : Réservation en ligne
          </p>
          <button className="text-blue-600 hover:text-blue-700 text-sm flex items-center">
            Classement des résultats à la une
            <Info className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Salons List */}
        <div className="space-y-8">
          {salons.map((salon) => (
            <div
              key={salon.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row">
                {/* Image */}
                <div className="relative lg:w-80 h-64 lg:h-auto">
                  <Image src={salon.image || "/placeholder.svg"} alt={salon.name} fill className="object-cover" />
                  {salon.featured && (
                    <Badge className="absolute top-3 left-3 bg-blue-100 text-blue-800 hover:bg-blue-100">
                      À la une
                    </Badge>
                  )}
                  {/* Image dots indicator */}
                  <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? "bg-white" : "bg-white/50"}`} />
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{salon.name}</h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">{salon.address}</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm font-medium">{salon.rating}</span>
                        <span className="text-sm text-gray-500 ml-1">({salon.reviewCount} avis)</span>
                        <span className="text-sm text-gray-400 ml-3">{salon.priceRange}</span>
                      </div>
                    </div>
                    <Button className="bg-black hover:bg-gray-800 text-white">Prendre RDV</Button>
                  </div>

                  {/* Time Slots */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700 mr-4">MATIN</span>
                      <div className="inline-flex gap-2">
                        {salon.timeSlots.morning.map((time) => (
                          <Button
                            key={time}
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
                          >
                            Mer.{time.split(":")[0]}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700 mr-4">APRÈS-MIDI</span>
                      <div className="inline-flex gap-2">
                        {salon.timeSlots.afternoon.map((time) => (
                          <Button
                            key={time}
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
                          >
                            Mer.{time.split(":")[0]}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button className="text-sm text-gray-600 hover:text-gray-800 mt-4 underline">
                    Plus d'informations
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
