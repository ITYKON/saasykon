"use client"

import { useEffect, useState } from "react"
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps"
import type { Business } from "@/types/business"

interface SearchMapProps {
  businesses: Business[]
  center?: { lat: number; lng: number }
  onMarkerClick?: (businessId: string) => void
}

export function SearchMap({ businesses, center, onMarkerClick }: SearchMapProps) {
  // Read NEXT_PUBLIC_ env at build time so Next.js inlines the value for client
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  const [mapCenter, setMapCenter] = useState(center || { lat: 36.7538, lng: 3.0588 }) // Alger par défaut
  const [mapZoom, setMapZoom] = useState(13)

  useEffect(() => {
    // Calculer le centre de la carte basé sur les résultats
    if (businesses.length > 0) {
      const validLocations = businesses.filter(
        b => b.location?.latitude && b.location?.longitude
      )
      
      if (validLocations.length > 0) {
        const avgLat = validLocations.reduce(
          (sum, b) => sum + (b.location!.latitude || 0), 
          0
        ) / validLocations.length
        
        const avgLng = validLocations.reduce(
          (sum, b) => sum + (b.location!.longitude || 0), 
          0
        ) / validLocations.length
        
        setMapCenter({ lat: avgLat, lng: avgLng })
        
        // Ajuster le zoom en fonction du nombre de résultats
        if (validLocations.length === 1) {
          setMapZoom(15)
        } else if (validLocations.length <= 5) {
          setMapZoom(13)
        } else {
          setMapZoom(12)
        }
      }
    }
  }, [businesses])

  // Si pas de clé API, afficher un message
  if (!apiKey) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center p-6">
        <div className="text-center text-gray-600">
          <svg className="h-16 w-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="font-semibold mb-2">Carte interactive</p>
          <p className="text-sm">
            Pour activer la carte, ajoutez votre clé API Google Maps
          </p>
          <p className="text-xs mt-2 text-gray-500">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY dans .env.local
          </p>
        </div>
      </div>
    )
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        mapId="search-map"
        defaultCenter={mapCenter}
        center={mapCenter}
        defaultZoom={mapZoom}
        zoom={mapZoom}
        gestureHandling="greedy"
        disableDefaultUI={false}
        className="w-full h-full rounded-lg"
      >
        {businesses.map((business) => {
          if (!business.location?.latitude || !business.location?.longitude) {
            return null
          }

          return (
            <AdvancedMarker
              key={business.id}
              position={{
                lat: business.location.latitude,
                lng: business.location.longitude
              }}
              onClick={() => onMarkerClick?.(business.id)}
            >
              <Pin
                background={business.isPremium ? "#3b82f6" : "#ef4444"}
                borderColor={business.isPremium ? "#1e40af" : "#b91c1c"}
                glyphColor="#ffffff"
              />
            </AdvancedMarker>
          )
        })}
      </Map>
    </APIProvider>
  )
}
