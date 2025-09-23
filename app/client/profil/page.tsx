"use client"
import { useEffect, useState } from "react"
import { User, Calendar, Star, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

type Profile = {
  id: string
  users: {
    first_name: string | null
    last_name: string | null
    email: string
    created_at?: string
  }
}

export default function ClientProfil() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const favoriteServices: string[] = []

  useEffect(() => {
    fetch("/api/client/profile")
      .then((res) => res.json())
      .then((data) => setProfile(data.user))
      .catch(() => setProfile(null))
  }, [])

  return (
    <div className="space-y-6">
            <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center">
      <div>
      <h1 className="text-2xl font-bold text-black">Mon profil</h1>
      <p className="text-gray-600 mt-1">Gérer vos informations personnelles</p>
      </div>
      </div>
      </div>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-black">Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="/placeholder.svg?height=80&width=80" />
                    <AvatarFallback className="text-lg">
                      {`${(profile?.users.first_name?.[0] || "?").toUpperCase()}${(profile?.users.last_name?.[0] || "").toUpperCase()}`}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-transparent"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black">{`${profile?.users.first_name || ""} ${profile?.users.last_name || ""}`.trim() || "Utilisateur"}</h3>
                  <p className="text-gray-600">{profile?.users.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input id="firstName" defaultValue={profile?.users.first_name || ""} />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input id="lastName" defaultValue={profile?.users.last_name || ""} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={profile?.users.email || ""} />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" defaultValue="" />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Adresse</Label>
                <Textarea id="address" defaultValue={""} rows={2} />
              </div>

              <Button className="bg-black text-white hover:bg-gray-800">Sauvegarder les modifications</Button>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-black">Préférences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Services préférés</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {favoriteServices.map((service, index) => (
                    <Badge key={index} variant="secondary">
                      {service}
                    </Badge>
                  ))}
                  <Button variant="outline" size="sm" className="h-6 text-xs bg-transparent">
                    + Ajouter
                  </Button>
                </div>
              </div>

              <div>
                <Label>Notifications</Label>
                <div className="space-y-2 mt-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Rappels de rendez-vous</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Offres promotionnelles</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Nouveaux salons dans ma zone</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-black">Mes statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-black">—</div>
                <p className="text-gray-600">Rendez-vous pris</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center">
                  <Star className="h-5 w-5 text-yellow-500 fill-current mr-1" />
                  <span className="text-2xl font-bold text-black">—</span>
                </div>
                <p className="text-gray-600">Note moyenne donnée</p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-black">{favoriteServices.length}</div>
                <p className="text-gray-600">Services favoris</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-black">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start border-black text-black hover:bg-gray-50 bg-transparent"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Mes réservations
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-black text-black hover:bg-gray-50 bg-transparent"
              >
                <Star className="h-4 w-4 mr-2" />
                Mes favoris
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-black text-black hover:bg-gray-50 bg-transparent"
              >
                <User className="h-4 w-4 mr-2" />
                Paramètres du compte
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
