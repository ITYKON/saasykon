import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export const metadata: Metadata = {
  title: "Barbier - Réservez votre rendez-vous en ligne | Planity",
  description:
    "Trouvez et réservez votre barbier partout en France. Réservation en ligne 24h/24, gratuite et confirmation immédiate.",
}

const cities = [
  "Paris",
  "Marseille",
  "Lyon",
  "Toulouse",
  "Nice",
  "Nantes",
  "Montpellier",
  "Strasbourg",
  "Bordeaux",
  "Lille",
  "Rennes",
  "Reims",
]

const services = [
  {
    title: "Coupe traditionnelle",
    description: "Coupe classique au ciseau et à la tondeuse selon vos préférences.",
    price: "À partir de 20€",
  },
  {
    title: "Rasage à l'ancienne",
    description: "Rasage traditionnel au rasoir avec mousse chaude et serviettes.",
    price: "À partir de 25€",
  },
  {
    title: "Taille de barbe",
    description: "Entretien et stylisation de votre barbe selon votre style.",
    price: "À partir de 15€",
  },
  {
    title: "Soins du visage",
    description: "Nettoyage, hydratation et soins spécifiques pour hommes.",
    price: "À partir de 30€",
  },
]

export default function BarbierPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 text-balance">
              Réserver en ligne un RDV avec un barbier
            </h1>
            <p className="text-xl text-gray-600 mb-8">Simple • Immédiat • 24h/24</p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm text-gray-500 mb-2">Que cherchez-vous ?</label>
                <Input value="Barbier" readOnly className="bg-gray-50 border-gray-200" />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm text-gray-500 mb-2">Où</label>
                <Input placeholder="Adresse, ville..." className="border-gray-200" />
              </div>
              <div className="md:col-span-1 flex items-end">
                <Button className="w-full bg-black hover:bg-gray-800 text-white">Rechercher</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Cities */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Barbier</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Link href="/barbier/paris" className="group">
              <div className="relative overflow-hidden rounded-lg">
                <Image
                  src="/paris-eiffel-tower-beautiful-cityscape.jpg"
                  alt="Paris"
                  width={400}
                  height={300}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Découvrez nos</p>
                <h3 className="text-xl font-semibold text-gray-900">Barbiers à Paris</h3>
              </div>
            </Link>

            <Link href="/barbier/marseille" className="group">
              <div className="relative overflow-hidden rounded-lg">
                <Image
                  src="/marseille-city-view-mediterranean-architecture.jpg"
                  alt="Marseille"
                  width={400}
                  height={300}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Découvrez nos</p>
                <h3 className="text-xl font-semibold text-gray-900">Barbiers à Marseille</h3>
              </div>
            </Link>

            <Link href="/barbier/lyon" className="group">
              <div className="relative overflow-hidden rounded-lg">
                <Image
                  src="/lyon-city-view-sa-ne-river-beautiful-architecture.jpg"
                  alt="Lyon"
                  width={400}
                  height={300}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Découvrez nos</p>
                <h3 className="text-xl font-semibold text-gray-900">Barbiers à Lyon</h3>
              </div>
            </Link>
          </div>

          {/* All Cities Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-16">
            {cities.map((city) => (
              <Link
                key={city}
                href={`/barbier/${city.toLowerCase()}`}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all text-center"
              >
                <span className="text-gray-700 font-medium">{city}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nos services de barbier</h2>
            <p className="text-xl text-gray-600">Des prestations traditionnelles et modernes pour hommes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <p className="text-lg font-semibold text-blue-600">{service.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Vous êtes barbier ?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Rejoignez Planity et développez votre clientèle grâce à la réservation en ligne
          </p>
          <Button size="lg" className="bg-black hover:bg-gray-800 text-white">
            Découvrir nos offres
          </Button>
        </div>
      </section>
    </div>
  )
}
