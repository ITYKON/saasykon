"use client"

import { useEffect, useState, useMemo } from "react"
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import type { Business } from "@/types/business"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

// Enable RTL text plugin for Arabic support
// Check if the plugin is already loaded or loading to avoid errors
if (typeof window !== "undefined") {
  const rtlStatus = maplibregl.getRTLTextPluginStatus()
  if (rtlStatus === "unavailable") {
    maplibregl.setRTLTextPlugin(
      "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js",
      true // Lazy load
    )
  }
}


interface SearchMapProps {
  businesses: Business[]
  center?: { lat: number; lng: number }
  onMarkerClick?: (businessId: string) => void
  onBoundsChange?: (bounds: { north: number, south: number, east: number, west: number }) => void
  searchLocation?: string
  wasMapMoved?: boolean
  onMapClick?: () => void
}

export function SearchMap({ businesses, center, onMarkerClick, onBoundsChange, searchLocation, wasMapMoved, onMapClick }: SearchMapProps) {
  const [viewState, setViewState] = useState({
    latitude: center?.lat || 36.7538, // Alger par défaut
    longitude: center?.lng || 3.0588,
    zoom: 13
  })

  // Recalculer le centre et le zoom si les businesses changent (uniquement sur recherche manuelle)
  useEffect(() => {
    // Si la carte a été bougée manuellement, on ne veut jamais forcer le centrage automatique
    if (wasMapMoved) {
        return;
    }

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
        
        let newZoom = 12
        if (validLocations.length === 1) {
          newZoom = 15
        } else if (validLocations.length <= 5) {
          newZoom = 13
        }

        setViewState(prev => ({
          ...prev,
          latitude: avgLat,
          longitude: avgLng,
          zoom: newZoom
        }))
      }
    }
  }, [businesses, wasMapMoved])

  // Geocoding fallback: Si la recherche est locale mais qu'aucun business n'a de coordonnées
  useEffect(() => {
    const geocodeLocation = async () => {
      if (!searchLocation?.trim() || wasMapMoved) return;
      
      // Si on a déjà des businesses avec localisation, on privilégie leur position (géré par l'effet ci-dessus)
      const hasValidBusinessLocations = businesses.some(b => b.location?.latitude && b.location?.longitude);
      if (hasValidBusinessLocations) return;

      try {
        // Utilisation de Nominatim (OpenStreetMap) pour le géocodage
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation)}&limit=1`);
        if (response.ok) {
           const data = await response.json();
           if (data && data.length > 0) {
              setViewState(prev => ({
                 ...prev,
                 latitude: parseFloat(data[0].lat),
                 longitude: parseFloat(data[0].lon),
                 zoom: 12 
              }));
           }
        }
      } catch (err) {
        console.error("Geocoding error:", err);
      }
    };
    
    const timer = setTimeout(geocodeLocation, 800); // Debounce pour éviter trop d'appels
    return () => clearTimeout(timer);
  }, [searchLocation, businesses])

  const onMapLoad = (event: any) => {
    const map = event.target
    const style = map.getStyle()
    
    if (style && style.layers) {
      style.layers.forEach((layer: any) => {
        if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
          // Check if the layer is displaying a name to avoid overwriting road shields (which use 'ref')
          const textField = layer.layout['text-field']
          const isNameLayer = typeof textField === 'string' 
            ? textField.toLowerCase().includes('name') 
            : JSON.stringify(textField).toLowerCase().includes('name')

          if (isNameLayer) {
            // Force French language for labels
            map.setLayoutProperty(layer.id, 'text-field', [
              'coalesce',
              ['get', 'name:fr'],
              ['get', 'name:latin'],
              ['get', 'name']
            ])
          }
        }
      })
    }
  }

  const [activeId, setActiveId] = useState<string | null>(null)

  const markers = useMemo(() => businesses.map((business) => {
    if (!business.location?.latitude || !business.location?.longitude) {
      return null
    }

    const isActive = activeId === business.id
    
    return (
      <Marker
        key={business.id}
        longitude={business.location.longitude}
        latitude={business.location.latitude}
        anchor="bottom"
        onClick={(e) => {
          e.originalEvent.stopPropagation()
          setActiveId(business.id)
          onMarkerClick?.(business.id)
          
          // Se rapprocher de la localisation exacte
          setViewState(prev => ({
            ...prev,
            latitude: business.location!.latitude!,
            longitude: business.location!.longitude!,
            zoom: 15
          }))
        }}
      >
        <div className={`flex flex-col items-center group cursor-pointer transition-transform ${isActive ? 'scale-110 z-10' : 'hover:scale-105'}`}>
          {/* Label du nom - affiché uniquement si le nom existe */}
          {business.name && (
            <div 
                className={`mb-1 px-2 py-1 rounded shadow-md text-xs font-semibold whitespace-nowrap transition-colors border ${
                isActive 
                    ? 'bg-blue-600 text-white border-blue-700' 
                    : 'bg-white text-gray-800 border-gray-200 group-hover:bg-gray-50'
                }`}
            >
                {business.name}
            </div>
          )}
          
          {/* Icône du Pin */}
          <div 
            className={`rounded-full p-2 shadow-lg flex items-center justify-center border border-gray-100 transition-colors ${
              isActive ? 'bg-blue-600' : 'bg-white'
            }`}
          >
            <MapPin 
                className={`w-4 h-4 fill-transparent stroke-[2.5px] ${
                  isActive ? 'text-white' : 'text-black'
                }`} 
            />
          </div>
        </div>
      </Marker>
    )
  }), [businesses, onMarkerClick, activeId])

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 shadow-sm relative">
      <Map
        {...viewState}
        onClick={() => onMapClick?.()}
        onMove={evt => setViewState(evt.viewState)}
        onMoveEnd={evt => {
           const bounds = evt.target.getBounds();
           // déclenché uniquement par l'utilisateur pour éviter les boucles infinies
           if (onBoundsChange && bounds && (evt as any).originalEvent) {
             onBoundsChange({
               north: bounds.getNorth(),
               south: bounds.getSouth(),
               east: bounds.getEast(),
               west: bounds.getWest()
             })
           }
        }}
        onLoad={onMapLoad}
        style={{ width: "100%", height: "100%" }}
        mapStyle="https://tiles.openfreemap.org/styles/bright"
        mapLib={maplibregl}
      >
        <NavigationControl position="top-right" />
        {markers}
      </Map>
      
      {/* Attribution OpenFreeMap (Required) */}
      <div className="absolute bottom-1 right-1 bg-white/80 px-1 text-[10px] text-gray-600 pointer-events-none z-10 rounded">
        <a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer" className="pointer-events-auto hover:underline">
          OpenFreeMap
        </a>
        {" | "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="pointer-events-auto hover:underline">
          © OpenStreetMap
        </a>
      </div>
    </div>
  )
}
