export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation"
import { MapPin, Star, Filter } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"
import { Footer } from "@/components/footer"
import { buildSalonSlug } from "@/lib/salon-slug"

// Désactiver la génération statique
export const dynamicParams = false;

// Ne pas générer de pages statiques
export function generateStaticParams() {
  return [];
}

interface PageProps {
  params: {
    ville: string
  }
}

function slugifyCity(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

const categories = ["Épilation", "Massage", "Soins du corps", "Soin du visage"]

export default async function CityInstitutePage({ params }: PageProps) {
  const ville = params.ville.toLowerCase()

  // Find city by slug derived from its name
  const allCities = await prisma.cities.findMany()
  const city = allCities.find((c) => slugifyCity(c.name) === ville)

  if (!city) {
    notFound()
  }

  // Fetch business locations in this city with their businesses
  let locations = await prisma.business_locations.findMany({
    where: { 
      city_id: city.id,
      businesses: {
        archived_at: null,
        deleted_at: null
      }
    },
    include: { 
      businesses: {
        select: {
          id: true,
          public_name: true,
          legal_name: true,
          cover_url: true,
          claim_status: true,
          working_hours: true,
          slug: true
        }
      }, 
      cities: true 
    },
    orderBy: { created_at: "desc" },
  })
  
  // Trier : afficher d'abord les salons où l'on peut prendre RDV (claim_status !== 'none'),
  // puis les salons revendicables (claim_status === 'none').
  function sortLocationsByBookableFirst(locs: any[]) {
    return locs.sort((a: any, b: any) => {
      const aBookable = (a?.businesses?.claim_status ?? 'none') !== 'none';
      const bBookable = (b?.businesses?.claim_status ?? 'none') !== 'none';
      if (aBookable && !bBookable) return -1;
      if (!aBookable && bBookable) return 1;
      return 0;
    });
  }

  locations = sortLocationsByBookableFirst(locations);
  // Fallback: if no locations for the exact city, include all cities in same wilaya_number
  if (locations.length === 0 && city.wilaya_number != null) {
    const sameWilayaCities = await prisma.cities.findMany({
      where: { wilaya_number: city.wilaya_number },
      select: { id: true },
    })
    const cityIds = sameWilayaCities.map(c => c.id)
    if (cityIds.length > 0) {
      locations = await prisma.business_locations.findMany({
        where: { 
          city_id: { in: cityIds },
          businesses: {
            archived_at: null,
            deleted_at: null
          }
        },
        include: { 
          businesses: {
            select: {
              id: true,
              public_name: true,
              legal_name: true,
              cover_url: true,
              claim_status: true,
              working_hours: true,
              slug: true
            }
          }, 
          cities: true 
        },
        orderBy: { created_at: "desc" },
      })
      locations = sortLocationsByBookableFirst(locations);
    }
  }

  function workingWeekdayLabels(workingWeekdays: number[]): string[] {
    if (!Array.isArray(workingWeekdays) || workingWeekdays.length === 0) return []
    const labels = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."]
    const set = new Set(workingWeekdays.map((d) => ((d % 7) + 7) % 7))
    const order = [1, 2, 3, 4, 5, 6, 0] // Commencer par Lundi
    return order.filter((d) => set.has(d)).map((d) => labels[d])
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sélectionnez un salon</h1>
          <p className="text-gray-600 mb-4">Les meilleurs salons et instituts aux alentours de {city.name} : Réservation en ligne</p>
          <button className="text-purple-600 hover:text-purple-800 text-sm flex items-center gap-1">
            Classement des résultats à la une
            <span className="text-gray-400">ⓘ</span>
          </button>
        </div>

        {/* Salons List */}
        <div className="space-y-6">
          {locations.map((loc) => {
            const salonUrl = loc.businesses.slug 
                ? `/${loc.businesses.slug}` 
                : `/salon/${buildSalonSlug(
                    loc.businesses.public_name || loc.businesses.legal_name || "",
                    loc.businesses.id,
                    loc.cities?.name || city.name
                  )}`;
                  
            return (
            <div key={loc.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                {/* Image */}
                <div className="relative lg:w-80 h-64 lg:h-auto">
                  <img
                    src={loc.businesses.cover_url || "/placeholder.svg"}
                    alt={loc.businesses.public_name}
                    className="w-full h-full object-cover"
                  />
                  {/* Optionally mark featured later */}
                  {/* <Badge className="absolute top-3 left-3 bg-blue-600 text-white">À la une</Badge> */}
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
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{loc.businesses.public_name}</h3>

                      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {loc.address_line1}
                        </div>
                      </div>

                      {/* Ratings and price placeholders (wire real data later) */}
                      <div className="flex items-center gap-4 mb-6 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">4.8</span>
                          <span className="text-gray-500">(0 avis)</span>
                        </div>
                      </div>

                      {/* Working days (next occurrences) */}
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">JOURS OUVERTS</div>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              const labels = workingWeekdayLabels(
                                Array.from(
                                  new Set(
                                    (loc.businesses.working_hours || []).map((wh: any) => {
                                      // Prisma weekday: 0..6 where 0 = dimanche (aligné à JS Date.getDay)
                                      return Number(wh.weekday ?? -1)
                                    }).filter((n: number) => n >= 0 && n <= 6)
                                  )
                                )
                              )
                              if (labels.length === 0) {
                                return <span className="text-sm text-gray-500">Aucun jour ouvert</span>
                              }
                              return labels.map((label) => (
                                <Button key={label} variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent">
                                  {label}
                                </Button>
                              ))
                            })()}
                          </div>
                        </div>
                      </div>

                      <Link
                        href={salonUrl}
                        className="text-sm text-gray-600 hover:text-gray-800 mt-4 underline"
                      >
                        Plus d'informations
                      </Link>
                    </div>

                    {/* CTA Button */}
                    <div className="lg:ml-6">
                      {loc.businesses.claim_status === 'none' ? (
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 w-full lg:w-auto" asChild>
                          <Link
                            href={`/claims?business_id=${loc.businesses.id}&business_name=${encodeURIComponent(loc.businesses.public_name || loc.businesses.legal_name || '')}`}
                          >
                            Revendiquer
                          </Link>
                        </Button>
                      ) : (
                        <Button className="bg-black hover:bg-gray-800 text-white px-6 py-2 w-full lg:w-auto" asChild>
                          <a
                            href={salonUrl}
                          >
                            Prendre RDV
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
          {locations.length === 0 && (
            <div className="text-sm text-gray-600">Aucun salon trouvé pour cette ville.</div>
          )}
        </div>
      </div>

    </div>
  )
}
