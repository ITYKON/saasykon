"use client"
import { useEffect, useState } from "react"
import { Heart, MapPin, Star, Clock, Phone } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { buildSalonSlug } from "@/lib/salon-slug"

type Favorite = {
  id: string
  businesses: {
    id: string
    name: string | null
    address?: string | null
    phone?: string | null
    cover_image_url?: string | null
    city?: string | null
    slug?: string | null
  }
}

export default function ClientFavoris() {
  const [favorites, setFavorites] = useState<Favorite[]>([])

  useEffect(() => {
    fetch("/api/client/favorites")
      .then((res) => res.json())
      .then((data) => setFavorites(data.favorites || []))
      .catch(() => setFavorites([]))
  }, [])

  return (
    <div className="space-y-6">
            <header className="bg-white border-b border-gray-200 mb-0">
        <div className="px-8 py-6">
      <div className="flex justify-between items-center">
        <div>
        <h1 className="text-2xl font-bold text-black">Mes salons favoris</h1>
        <p className="text-gray-600 mt-1">Gérer vos favoris</p>
        </div>
        <Badge variant="outline" className="bg-black text-white hover:bg-gray-800">
          {favorites.length} salon{favorites.length > 1 ? "s" : ""}
        </Badge>
      </div>
      </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {favorites.map((fav) => (
          <Card key={fav.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48">
              <Image src={fav.businesses.cover_image_url || "/placeholder.svg"} alt={fav.businesses.name || "Salon"} fill className="object-cover" />
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
                  <h3 className="text-xl font-bold text-black">{fav.businesses.name}</h3>
                  <div className="flex items-center text-gray-600 text-sm mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {fav.businesses.address || "Adresse indisponible"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                    <span className="font-semibold">—</span>
                  </div>
                  <p className="text-xs text-gray-500">(avis)</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex flex-wrap gap-2">
                  {/* Services tags si disponibles ultérieurement */}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    —
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    {fav.businesses.phone || "—"}
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Prix: —</span>
                  <span className="text-gray-500">—</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-black text-white hover:bg-gray-800"
                  onClick={() => window.location.href = fav.businesses.slug ? `/${fav.businesses.slug}` : `/salon/${buildSalonSlug(fav.businesses.name || "", fav.businesses.id, fav.businesses.city)}`}
                >
                  Prendre RDV
                </Button>
                <Button asChild variant="outline" className="border-black text-black hover:bg-gray-50 bg-transparent">
                  <Link href={fav.businesses.slug ? `/${fav.businesses.slug}` : `/salon/${buildSalonSlug(fav.businesses.name || "", fav.businesses.id, fav.businesses.city)}`}>Voir profil</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {favorites.length === 0 && (
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
