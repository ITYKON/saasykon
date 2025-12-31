"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { SearchMap } from "@/components/search-map"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Filter, Calendar, Search as SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import Image from "next/image"
import { buildSalonSlug } from "@/lib/salon-slug"
import type { Business } from "@/types/business"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState(searchParams?.get("q") ?? "")
  const [location, setLocation] = useState(searchParams?.get("location") ?? "")
  const [category, setCategory] = useState(searchParams?.get("category") ?? "")
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  // Services populaires pour les filtres
  const [popularServices, setPopularServices] = useState<string[]>([])

  useEffect(() => {
    // Charger les services populaires depuis l'API
    const fetchPopularServices = async () => {
      try {
        const res = await fetch('/api/services/popular');
        if (res.ok) {
          const data = await res.json();
          setPopularServices(data);
        }
      } catch (e) {
        console.error("Erreur chargement services populaires", e);
        // Fallback vide en cas d'erreur pour ne pas afficher de services qui n'existent pas
        setPopularServices([]);
      }
    };
    fetchPopularServices();
  }, []);

  // Effet pour gérer la recherche avec debounce
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (query) params.set("q", query)
        if (location) params.set("location", location)
        
        // Si la requête et la localisation sont vides, on réinitialise les résultats
        if (!query.trim() && !location.trim()) {
          setBusinesses([])
          setTotal(0)
          setPage(1)
          router.push('/search')
          return
        }
        
        // Mise à jour de l'URL avec les paramètres actuels
        const newUrl = `/search?${params.toString()}`
        if (window.location.search !== `?${params.toString()}`) {
          window.history.pushState({}, '', newUrl)
        }
        
        params.set("page", page.toString())
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // Timeout après 10 secondes
        
        const response = await fetch(`/api/search-simple?${params.toString()}`, {
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.businesses) {
          setBusinesses(data.businesses)
          setTotal(data.total)
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error("Erreur lors de la recherche:", error)
          // Ici vous pourriez ajouter un état pour afficher un message d'erreur à l'utilisateur
          setBusinesses([])
          setTotal(0)
        }
      } finally {
        setLoading(false)
      }
    }

    // Ajout d'un délai de 300ms pour éviter les appels API excessifs
    const debounceTimer = setTimeout(() => {
      if (query || location) {
        fetchResults()
      } else {
        setBusinesses([])
        setTotal(0)
      }
    }, 300)

    // Nettoyage du timer si le composant est démonté ou si les dépendances changent
    return () => clearTimeout(debounceTimer)
  }, [query, location, page]) // Ajouter location aux dépendances

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    
    // Si aucun terme ni location, on ne fait rien
    if (!query.trim() && !location.trim()) {
      return
    }
    
    // Réinitialiser la page à 1 lors d'une nouvelle recherche
    setPage(1)
    
    // Mettre à jour l'URL avec les paramètres
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    if (location.trim()) params.set("location", location.trim())
    
    // Utiliser replace au lieu de push pour éviter l'accumulation dans l'historique
    router.replace(`/search?${params.toString()}`, { scroll: false })
  }
  
  // Gestion de la soumission du formulaire avec la touche Entrée
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSearch} className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Nom de l'institut ou service recherché"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-11 w-full"
                aria-label="Rechercher un institut ou un service"
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Ville, adresse ou code postal"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-11 w-full"
                aria-label="Localisation (ville, adresse, code postal)"
              />
            </div>
            <Button 
              type="submit" 
              className="h-11 px-6 bg-black hover:bg-gray-800 flex-shrink-0"
              disabled={!query && !location}
            >
              <span className="sr-only">Rechercher</span>
              <SearchIcon className="h-5 w-5 mr-2" />
              Rechercher
            </Button>
            <Button 
              type="button" // Important: pas 'submit'
              variant="outline" 
              className="h-11"
              onClick={() => alert("La sélection par date arrive bientôt !")}
            >
              <Calendar className="h-4 w-4 mr-2" />
              À tout moment
            </Button>
          </form>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-b border-gray-200 py-3 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="whitespace-nowrap"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
            <Button
              variant={!category ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory("")}
              className="whitespace-nowrap"
            >
              Tous
            </Button>
            {popularServices.map((service) => (
              <Button
                key={service}
                variant={selectedService === service ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedService(selectedService === service ? null : service)
                  setQuery(selectedService === service ? "" : service)
                }}
                className="whitespace-nowrap"
              >
                {service}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-black">
            Sélectionnez un salon
          </h2>
          <p className="text-sm text-gray-600">
            {loading ? "Recherche en cours..." : `Les meilleures ${query || "prestations"} aux alentours de ${location || "votre position"}: réservation en ligne`}
          </p>
          {!loading && total > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {total} résultats trouvés
            </p>
          )}
        </div>

        <div className="flex gap-6">
          {/* Liste des résultats */}
          <div className="flex-1 space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="flex gap-4 p-4">
                      <div className="w-32 h-32 bg-gray-200 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : businesses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">Aucun résultat trouvé pour votre recherche.</p>
                <p className="text-gray-500 mt-2">Essayez avec d'autres mots-clés ou une autre localisation.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {businesses.map((business) => (
                  <Link
                    key={business.id}
                    href={`/salon/${buildSalonSlug(business.name, business.id, business.city || business.location?.city)}`}
                    id={`business-${business.id}`}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex gap-4 p-4">
                        {/* Image */}
                        <div className="relative w-32 h-32 flex-shrink-0">
                          {business.cover_url || business.media?.[0]?.url ? (
                            <Image
                              src={business.cover_url || business.media?.[0]?.url || ""}
                              alt={business.name}
                              fill
                              className="object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded">
                              <span className="text-gray-400 text-2xl font-bold">
                                {business.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          {business.isPremium && (
                            <Badge className="absolute top-1 left-1 bg-blue-600 text-white border-0 text-xs">À la une</Badge>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-black mb-1">
                                {business.name}
                              </h3>
                              {business.location && (
                                <div className="flex items-center text-gray-600 text-sm mb-1">
                                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="line-clamp-1">{business.location.address}</span>
                                </div>
                              )}
                              {business.description && (
                                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                  {business.description}
                                </p>
                              )}
                              {business.isPremium && (
                                <div className="flex items-center">
                                  <span className="text-xs text-gray-500">€€€</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Services et prix */}
                          {business.services?.length > 0 && (
                            <div className="mt-3">
                              <div className="text-sm text-gray-700">
                                {business.services.slice(0, 1).map((service) => (
                                  <div key={service.id} className="mb-2">
                                    <span className="font-medium">{service.name}</span>
                                    {service.duration_minutes && (
                                      <span className="text-gray-500"> • {service.duration_minutes}min</span>
                                    )}
                                    {service.price_cents && (
                                      <span className="text-gray-500"> • {(service.price_cents / 100).toFixed(0)} DA</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Disponibilités */}
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" variant="outline" className="text-xs">
                              Mar 14
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs">
                              Mer 15
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs">
                              Jeu 16
                            </Button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          {business.claim_status === 'approved' ? (
                            <>
                              <Button size="sm" className="bg-black hover:bg-gray-800">
                                Offrir
                              </Button>
                              <Button size="sm" variant="default" className="bg-black hover:bg-gray-800">
                                Prendre RDV
                              </Button>
                            </>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-blue-600 text-blue-600 hover:bg-blue-50"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // Rediriger vers la page de revendication
                                router.push(`/claim/${business.id}`);
                              }}
                            >
                              Revendiquer ce salon
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && businesses.length > 0 && (
              <div className="mt-8 flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <span className="px-4 py-2 text-gray-700">
                  Page {page}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => p + 1)}
                  disabled={businesses.length < 20}
                >
                  Suivant
                </Button>
              </div>
            )}
          </div>

          {/* Carte */}
          <div className="hidden lg:block w-[500px] sticky top-4 h-[calc(100vh-120px)]">
            <SearchMap 
              businesses={businesses}
              onMarkerClick={(businessId) => {
                // Scroll vers le salon sélectionné
                const element = document.getElementById(`business-${businessId}`)
                element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
