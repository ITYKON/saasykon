import { notFound } from "next/navigation"
import { MapPin, Star, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface PageProps {
  params: {
    ville: string
  }
}

const salonsData = {
  paris: [
    {
      id: 1,
      name: "Chill and Heal",
      address: "53 Rue du Caire, 75002 Paris",
      rating: 4.4,
      reviewCount: 2,
      priceLevel: "€€€€",
      image: "/chill-and-heal-salon-interior-warm-lighting.jpg",
      featured: true,
      availableSlots: {
        morning: ["Mer.10", "Jeu.11", "Ven.12"],
        afternoon: ["Mer.10", "Jeu.11", "Ven.12"],
      },
    },
    {
      id: 2,
      name: "Bonhomme - Paris Montorgueil",
      address: "122 Rue Saint-Denis, 75002 Paris",
      rating: 4.9,
      reviewCount: 541,
      priceLevel: "€€€",
      image: "/bonhomme-salon-storefront-paris-montorgueil.jpg",
      featured: true,
      availableSlots: {
        morning: ["Mer.10", "Jeu.11", "Ven.12"],
        afternoon: ["Mer.10", "Jeu.11", "Ven.12"],
      },
    },
  ],
  marseille: [
    {
      id: 3,
      name: "Bella Vista Spa",
      address: "45 Rue de la République, 13001 Marseille",
      rating: 4.6,
      reviewCount: 89,
      priceLevel: "€€€",
      image: "/modern-spa-interior-marseille.jpg",
      featured: true,
      availableSlots: {
        morning: ["Mer.10", "Jeu.11", "Ven.12"],
        afternoon: ["Mer.10", "Jeu.11", "Ven.12"],
      },
    },
  ],
  lyon: [
    {
      id: 4,
      name: "Institut Prestige Lyon",
      address: "78 Rue de la Part-Dieu, 69003 Lyon",
      rating: 4.7,
      reviewCount: 156,
      priceLevel: "€€€€",
      image: "/luxury-beauty-institute-lyon.jpg",
      featured: true,
      availableSlots: {
        morning: ["Mer.10", "Jeu.11", "Ven.12"],
        afternoon: ["Mer.10", "Jeu.11", "Ven.12"],
      },
    },
  ],
}

const cityNames = {
  paris: "Paris",
  marseille: "Marseille",
  lyon: "Lyon",
}

const categories = ["Épilation", "Massage", "Soins du corps", "Soin du visage"]

export default function CityInstitutePage({ params }: PageProps) {
  const ville = params.ville.toLowerCase()
  const salons = salonsData[ville as keyof typeof salonsData]
  const cityName = cityNames[ville as keyof typeof cityNames]

  if (!salons || !cityName) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Filters Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Filter className="h-4 w-4" />
              Filtres
            </Button>
            {categories.map((category) => (
              <Button key={category} variant="outline" className="hover:bg-gray-100 bg-transparent">
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sélectionnez un salon</h1>
          <p className="text-gray-600 mb-4">
            Les meilleurs salons et instituts aux alentours de {cityName} : Réservation en ligne
          </p>
          <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
            Classement des résultats à la une
            <span className="text-gray-400">ⓘ</span>
          </button>
        </div>

        {/* Salons List */}
        <div className="space-y-6">
          {salons.map((salon) => (
            <div key={salon.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                {/* Image */}
                <div className="relative lg:w-80 h-64 lg:h-auto">
                  <img
                    src={salon.image || "/placeholder.svg"}
                    alt={salon.name}
                    className="w-full h-full object-cover"
                  />
                  {salon.featured && <Badge className="absolute top-3 left-3 bg-blue-600 text-white">À la une</Badge>}
                  {/* Dots indicator */}
                  <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? "bg-white" : "bg-white/50"}`} />
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{salon.name}</h3>

                      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {salon.address}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-6 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{salon.rating}</span>
                          <span className="text-gray-500">({salon.reviewCount} avis)</span>
                        </div>
                        <span className="text-gray-600">{salon.priceLevel}</span>
                      </div>

                      {/* Time Slots */}
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">MATIN</div>
                          <div className="flex flex-wrap gap-2">
                            {salon.availableSlots.morning.map((slot) => (
                              <Button
                                key={`morning-${slot}`}
                                variant="outline"
                                size="sm"
                                className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
                              >
                                {slot}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">APRÈS-MIDI</div>
                          <div className="flex flex-wrap gap-2">
                            {salon.availableSlots.afternoon.map((slot) => (
                              <Button
                                key={`afternoon-${slot}`}
                                variant="outline"
                                size="sm"
                                className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
                              >
                                {slot}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button className="text-sm text-gray-600 hover:text-gray-800 mt-4 underline">
                        Plus d'informations
                      </button>
                    </div>

                    {/* CTA Button */}
                    <div className="lg:ml-6">
                      <Button className="bg-black hover:bg-gray-800 text-white px-6 py-2 w-full lg:w-auto" asChild>
                        <a href={`/salon/${salon.id}`}>Prendre RDV</a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export async function generateStaticParams() {
  return [{ ville: "paris" }, { ville: "marseille" }, { ville: "lyon" }]
}
