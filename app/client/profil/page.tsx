"use client"
import { useEffect, useState } from "react"
import { User, Calendar, Star, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type Profile = {
  id: string
  users: {
    first_name: string | null
    last_name: string | null
    email: string
    created_at?: string
    avatar_url?: string | null
    phone?: string | null
  }
}

type Address = {
  id: string
  label: string | null
  line1: string
  line2?: string | null
  postal_code?: string | null
  cities?: { name?: string | null } | null
  countries?: { code: string; name: string } | null
  is_default?: boolean | null
}

type Preferences = {
  email: boolean
  sms: boolean
  push: boolean
  categories?: any
}

export default function ClientProfil() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [address, setAddress] = useState<Address | null>(null)
  const [prefs, setPrefs] = useState<Preferences>({ email: true, sms: false, push: false })
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [saving, setSaving] = useState(false)
  const [favoriteServices, setFavoriteServices] = useState<string[]>([])
  const [addrLabel, setAddrLabel] = useState("")
  const [addrLine1, setAddrLine1] = useState("")
  const [addrPostal, setAddrPostal] = useState("")
  const [addrSaving, setAddrSaving] = useState(false)

  useEffect(() => {
    fetch("/api/client/profile")
      .then((res) => res.json())
      .then((data) => {
        setProfile(data.user)
        // addresses list still loaded for backward compatibility, but we use single address API below
        if (data.user?.users) {
          setFirstName(data.user.users.first_name || "")
          setLastName(data.user.users.last_name || "")
          setPhone(data.user.users.phone || "")
        }
      })
      .catch(() => setProfile(null))

    // Load preferences
    fetch("/api/client/preferences")
      .then((r) => r.json())
      .then((d) => {
        if (d.preferences) {
          setPrefs({ email: d.preferences.email, sms: d.preferences.sms, push: d.preferences.push })
          const favs = Array.isArray(d.preferences.categories?.favorite_services) ? d.preferences.categories.favorite_services : []
          setFavoriteServices(favs)
        }
      })
      .catch(() => {})

    // Load single primary address
    fetch("/api/client/address")
      .then((r) => r.json())
      .then((d) => {
        if (d.address) {
          setAddress(d.address)
          setAddrLabel(d.address.label || "")
          setAddrLine1(d.address.line1 || "")
          setAddrPostal(d.address.postal_code || "")
        }
      })
      .catch(() => {})
  }, [])

  async function onSave() {
    if (!profile) return
    setSaving(true)
    try {
      await fetch("/api/client/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: { first_name: firstName, last_name: lastName, phone },
          client: { first_name: firstName, last_name: lastName, phone },
        }),
      })
      const refreshed = await fetch("/api/client/profile").then((r) => r.json())
      setProfile(refreshed.user)
      toast.success('Modification effectuée avec succès', {
        description: 'Vos informations personnelles ont été mises à jour',
      })
    } catch (error) {
      toast.error('Erreur', {
        description: 'Une erreur est survenue lors de la mise à jour du profil',
      })
    } finally {
      setSaving(false)
    }
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/client/profile/avatar", { method: "POST", body: fd })
    if (res.ok) {
      const data = await res.json()
      setProfile((prev) => prev ? { ...prev, users: { ...prev.users, avatar_url: data.url } } : prev)
    }
  }

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
                    <AvatarImage src={profile?.users.avatar_url || "/placeholder.svg?height=80&width=80"} />
                    <AvatarFallback className="text-lg">
                      {`${(profile?.users.first_name?.[0] || "?").toUpperCase()}${(profile?.users.last_name?.[0] || "").toUpperCase()}`}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute -bottom-3 left-0 text-xs cursor-pointer flex items-center gap-1 px-2 py-1 rounded bg-white border">
                    <Upload className="h-3 w-3" /> Changer
                    <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
                  </label>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black">{`${profile?.users.first_name || ""} ${profile?.users.last_name || ""}`.trim() || "Utilisateur"}</h3>
                  <p className="text-gray-600">{profile?.users.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Prénom</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                  <Label>Nom</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Email</Label>
                  <Input value={profile?.users.email || ""} readOnly />
                </div>
                <div className="sm:col-span-2">
                  <Label>Téléphone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Adresse principale</Label>
                <div className="mt-1 rounded-md border px-3 py-2 bg-gray-50 text-sm text-gray-900">
                  {address ? `${address.line1}${address.cities?.name ? ", " + address.cities.name : ""}${address.postal_code ? " " + address.postal_code : ""}` : "—"}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={onSave} disabled={saving} className="bg-black text-white hover:bg-gray-800">
                  {saving ? "Enregistrement..." : "Sauvegarder les modifications"}
                </Button>
              </div>
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
                    <Badge key={index} variant="secondary" className="flex items-center gap-2">
                      {service}
                      <button
                        type="button"
                        className="text-xs text-red-600"
                        onClick={async () => {
                          const next = favoriteServices.filter((s) => s !== service)
                          setFavoriteServices(next)
                          const payload = { ...prefs, categories: { favorite_services: next } }
                          await fetch("/api/client/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
                        }}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs bg-transparent"
                    onClick={async () => {
                      const name = prompt("Nom du service préféré ?")?.trim()
                      if (!name) return
                      if (favoriteServices.includes(name)) return
                      const next = [...favoriteServices, name]
                      setFavoriteServices(next)
                      const payload = { ...prefs, categories: { favorite_services: next } }
                      await fetch("/api/client/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
                    }}
                  >
                    + Ajouter
                  </Button>
                </div>
              </div>

              <div>
                <Label>Notifications</Label>
                <div className="space-y-2 mt-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={prefs.email}
                      onChange={async (e) => {
                        const next = { ...prefs, email: e.target.checked }
                        setPrefs(next)
                        await fetch("/api/client/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) })
                      }}
                    />
                    <span className="text-sm">Rappels de rendez-vous</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={prefs.push}
                      onChange={async (e) => {
                        const next = { ...prefs, push: e.target.checked }
                        setPrefs(next)
                        await fetch("/api/client/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) })
                      }}
                    />
                    <span className="text-sm">Offres promotionnelles</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={prefs.sms}
                      onChange={async (e) => {
                        const next = { ...prefs, sms: e.target.checked }
                        setPrefs(next)
                        await fetch("/api/client/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) })
                      }}
                    />
                    <span className="text-sm">Nouveaux salons dans ma zone</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Adresse principale (simplifiée) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-black">Adresse principale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Formulaire adresse principale */}
              <div className="border-t pt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label>Libellé</Label>
                    <Input value={addrLabel} onChange={(e) => setAddrLabel(e.target.value)} placeholder="Maison / Bureau" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Ligne d'adresse</Label>
                    <Input value={addrLine1} onChange={(e) => setAddrLine1(e.target.value)} placeholder="12 rue Exemple" />
                  </div>
                  <div>
                    <Label>Code postal</Label>
                    <Input value={addrPostal} onChange={(e) => setAddrPostal(e.target.value)} placeholder="75000" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    disabled={addrSaving || !addrLine1}
                    onClick={async () => {
                      setAddrSaving(true)
                      try {
                        const res = await fetch("/api/client/address", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: address?.id, label: addrLabel || null, line1: addrLine1, postal_code: addrPostal || null }),
                        })
                        const d = await res.json()
                        setAddress(d.address)
                        setAddrLabel("")
                        setAddrLine1("")
                        setAddrPostal("")
                      } finally {
                        setAddrSaving(false)
                      }
                    }}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    {addrSaving ? "Enregistrement..." : "Enregistrer l'adresse"}
                  </Button>
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
                onClick={() => router.push("/client/reservations")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Mes réservations
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-black text-black hover:bg-gray-50 bg-transparent"
                onClick={() => router.push("/client/favoris")}
              >
                <Star className="h-4 w-4 mr-2" />
                Mes favoris
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-black text-black hover:bg-gray-50 bg-transparent"
                onClick={() => router.push("/client/profil")}
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
