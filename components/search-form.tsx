"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LocationAutocomplete } from "@/components/ui/location-autocomplete"
import { cn } from "@/lib/utils"

interface SearchFormProps {
  initialQuery?: string
  initialLocation?: string
  initialCategory?: string
  showCategory?: boolean
  className?: string
}

type Category = {
  code: string
  name: string
}

export function SearchForm({ 
  initialQuery = "", 
  initialLocation = "", 
  initialCategory = "",
  showCategory = false,
  className = "" 
}: SearchFormProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [location, setLocation] = useState(initialLocation)
  const [category, setCategory] = useState(initialCategory)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    if (showCategory) {
      fetch("/api/categories")
        .then(res => res.json())
        .then(data => {
          if (data.categories) {
            setCategories(data.categories)
          }
        })
        .catch(err => console.error("Erreur chargement catégories:", err))
    }
  }, [showCategory])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    if (location.trim()) params.set("location", location.trim())
    if (category) params.set("category", category)
    
    router.push(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className={cn("w-full", className)}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full">
        <div className={cn("col-span-1", showCategory ? "md:col-span-4" : "md:col-span-6")}>
          <Input
            placeholder="Que cherchez-vous ? (Nom du salon, prestations...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 text-lg border-gray-300 focus:border-black focus:ring-black w-full"
          />
        </div>
        {showCategory && (
          <div className="col-span-1 md:col-span-4">
            <Select value={category || "all"} onValueChange={(val) => setCategory(val === "all" ? "" : val)}>
              <SelectTrigger className="h-12 text-lg border-gray-300 focus:border-black focus:ring-black w-full">
                <SelectValue placeholder="Catégorie ?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.code} value={cat.code}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className={cn("col-span-1", showCategory ? "md:col-span-4" : "md:col-span-6")}>
          <LocationAutocomplete
            value={location}
            onChange={setLocation}
            className="w-full"
          />
        </div>
      </div>
      <Button type="submit" className="w-full mt-4 h-12 text-lg bg-black hover:bg-gray-800 transition-colors">
        Rechercher
      </Button>
    </form>
  )
}
