import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function InstitutDeBeautePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Search */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Découvrez en ligne un RDV avec un institut de beauté
            </h1>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Que cherchez-vous ?"
                      defaultValue="Instituts de beauté"
                      className="border-0 focus:ring-0 text-gray-900 bg-transparent"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Où"
                      defaultValue="Adresse, ville..."
                      className="border-0 focus:ring-0 text-gray-500 bg-transparent"
                    />
                  </div>
                </div>
                <Button className="bg-black hover:bg-gray-800 text-white px-8">Rechercher</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cities Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Institut de beauté</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Paris Card */}
            <Link href="/institut-de-beaute/paris" className="group">
              <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src="/paris-eiffel-tower-beautiful-cityscape.jpg"
                    alt="Paris - Tour Eiffel"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-2">Découvrez nos</p>
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    Instituts de beauté à Paris
                  </h3>
                </div>
              </div>
            </Link>

            {/* Marseille Card */}
            <Link href="/institut-de-beaute/marseille" className="group">
              <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src="/marseille-city-view-mediterranean-architecture.jpg"
                    alt="Marseille - Vue urbaine"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-2">Découvrez nos</p>
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    Instituts de beauté à Marseille
                  </h3>
                </div>
              </div>
            </Link>

            {/* Lyon Card */}
            <Link href="/institut-de-beaute/lyon" className="group">
              <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src="/lyon-city-view-sa-ne-river-beautiful-architecture.jpg"
                    alt="Lyon - Vue sur la Saône"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-2">Découvrez nos</p>
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    Instituts de beauté à Lyon
                  </h3>
                </div>
              </div>
            </Link>
          </div>

          {/* Additional Cities Grid */}
          <div className="mt-16">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
              {[
                "Bordeaux",
                "Lille",
                "Toulouse",
                "Nice",
                "Nantes",
                "Montpellier",
                "Strasbourg",
                "Rennes",
                "Reims",
                "Saint-Étienne",
                "Toulon",
                "Le Havre",
              ].map((city) => (
                <Link
                  key={city}
                  href={`/institut-de-beaute/${city.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                  className="group"
                >
                  <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                      <div className="w-8 h-8 bg-gray-300 rounded-full group-hover:bg-blue-300 transition-colors"></div>
                    </div>
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{city}</h3>
                    <p className="text-sm text-gray-600 mt-1">Instituts de beauté</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Services d'instituts de beauté</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Découvrez tous les soins de beauté disponibles dans nos instituts partenaires
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Soins du visage", description: "Nettoyage, hydratation, anti-âge" },
              { name: "Épilation", description: "Cire, laser, lumière pulsée" },
              { name: "Massage", description: "Relaxant, thérapeutique, bien-être" },
              { name: "Manucure & Pédicure", description: "Soins des ongles et des mains" },
              { name: "Maquillage", description: "Jour, soirée, mariée" },
              { name: "Soins du corps", description: "Gommage, enveloppement, minceur" },
              { name: "Bronzage", description: "UV, autobronzant, spray tan" },
              { name: "Sourcils & Cils", description: "Teinture, extension, rehaussement" },
            ].map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{service.name}</h3>
                <p className="text-sm text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Vous êtes propriétaire d'un institut de beauté ?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Rejoignez Planity et développez votre clientèle grâce à notre plateforme de réservation en ligne
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-black hover:bg-gray-800 text-white">
              Devenir partenaire
            </Button>
            <Button size="lg" variant="outline">
              En savoir plus
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
