"use client"
import { Users, Filter, Phone, Mail, Calendar, Star, Eye, Pencil, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import CreateClientModal from "@/components/pro/CreateClientModal"
import EditClientModal from "@/components/pro/EditClientModal"

export default function ProClients() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState("")
  const [sort, setSort] = useState("lastVisit")
  const [status, setStatus] = useState<string>("ALL")

  // fetch data
  useEffect(() => {
    let active = true
    setLoading(true)
    const timeout = setTimeout(() => {
      const params = new URLSearchParams()
      if (q) params.set("q", q)
      if (sort) params.set("sort", sort)
      if (status && status !== "ALL") params.set("status", status)
      fetch(`/api/pro/clients?${params.toString()}`, { cache: "no-store" })
        .then(async (r) => {
          const text = await r.text();
          let j: any = {};
          try { j = text ? JSON.parse(text) : {}; } catch {}
          if (!r.ok) {
            if (r.status === 403) {
              // No permission: send user back to Pro home instead of throwing
              router.push('/pro');
              return { items: [], total: 0 };
            }
            throw new Error(j?.error || `HTTP ${r.status}`);
          }
          return j;
        })
        .then((j) => {
          if (!active) return
          setItems(j.items || [])
          setTotal(j.total || 0)
        })
        .finally(() => active && setLoading(false))
    }, 300)
    return () => { active = false; clearTimeout(timeout) }
  }, [q, sort, status, router])

  const clients = useMemo(() => items.map((it) => ({
    id: it.id,
    name: it.name,
    email: it.email || "",
    phone: it.phone || "",
    lastVisit: it.lastVisit ? new Date(it.lastVisit).toLocaleDateString("fr-FR") : "—",
    totalBookings: it.totalBookings || 0,
    totalSpent: it.totalSpent || 0,
    averageRating: 0,
    favoriteServices: [],
    status: (it.status || "").toString().toUpperCase(),
  })), [items])

  async function deleteClient(id: string) {
    if (!confirm("Supprimer ce client ?")) return
    await fetch(`/api/pro/clients/${id}`, { method: "DELETE" })
    // Refresh list
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (sort) params.set("sort", sort)
    const res = await fetch(`/api/pro/clients?${params.toString()}`, { cache: "no-store" })
    const j = await res.json().catch(() => ({}))
    setItems(j.items || [])
    setTotal(j.total || 0)
  }

  const getStatusColor = (status: string) => {
    const s = (status || "").toUpperCase()
    switch (s) {
      case "VIP":
        return "bg-yellow-100 text-yellow-800"
      case "REGULIER":
        return "bg-green-100 text-green-800"
      case "NOUVEAU":
        return "bg-blue-100 text-blue-800"
      case "AUCUN":
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    const s = (status || "").toUpperCase()
    switch (s) {
      case "VIP": return "VIP"
      case "REGULIER": return "Régulier"
      case "NOUVEAU": return "Nouveau"
      case "AUCUN":
      default: return "Aucun"
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-4 py-3 sm:px-6">
            <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 truncate">Mes clients</h1>
                <p className="text-sm text-gray-500">Gérer vos clients</p>
              </div>
              <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <Button variant="outline" size="sm" className="h-9 px-3 flex-1 sm:flex-none">
                  <Filter className="h-4 w-4 sm:mr-2" />
                  <span className="sr-only sm:not-sr-only">Filtres</span>
                </Button>
                <CreateClientModal
                  trigger={
                    <Button size="sm" className="h-9 flex-1 sm:flex-none">
                      <Plus className="h-4 w-4 sm:mr-1" />
                      <span className="sr-only sm:not-sr-only">Ajouter</span>
                      <span className="hidden sm:inline"> un client</span>
                    </Button>
                  }
                  onCreated={async () => {
                    const params = new URLSearchParams()
                    if (q) params.set("q", q)
                    if (sort) params.set("sort", sort)
                    const res = await fetch(`/api/pro/clients?${params.toString()}`, { cache: "no-store" })
                    const j = await res.json().catch(() => ({}))
                    setItems(j.items || [])
                    setTotal(j.total || 0)
                  }}
                />
              </div>
            </div>
          </div>
        </header>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {/* Carte Clients totaux */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Clients total</p>
                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                <p className="text-xs text-green-600 mt-1">
                  +{Math.floor(clients.length * 0.1)}% ce mois
                </p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carte Clients VIP */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Clients VIP</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.filter((c) => c.status === "VIP").length}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Fidélité élevée
                </p>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <Star className="h-5 w-5 text-amber-500 fill-amber-200" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carte Nouveaux clients */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Nouveaux</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.filter((c) => c.status === "Nouveau").length}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Ce mois-ci
                </p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carte Note moyenne */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Note moyenne</p>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-gray-900">
                    {clients.length ? Math.round((clients.reduce((acc, c) => acc + c.averageRating, 0) / clients.length) * 10) / 10 : 0}
                  </span>
                  <span className="ml-1 text-sm text-gray-500">/5</span>
                </div>
                <div className="flex mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-3 w-3 ${i < Math.floor(clients.length ? (clients.reduce((acc, c) => acc + c.averageRating, 0) / clients.length) : 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <div className="h-5 w-5 flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-sm">
                    {clients.length ? Math.round((clients.reduce((acc, c) => acc + c.averageRating, 0) / clients.length) * 10) / 10 : 0}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher un client..."
                className="w-full"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lastVisit">Dernière visite</SelectItem>
                <SelectItem value="name">Nom</SelectItem>
                <SelectItem value="totalBookings">Nombre de RDV</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
                <SelectItem value="REGULIER">Régulier</SelectItem>
                <SelectItem value="NOUVEAU">Nouveau</SelectItem>
                <SelectItem value="AUCUN">Aucun</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-600 self-center hidden sm:block">{loading ? "Chargement…" : `${total} clients`}</div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table - Desktop */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Client</th>
                    <th className="text-left font-medium px-4 py-3">Email</th>
                    <th className="text-left font-medium px-4 py-3">Téléphone</th>
                    <th className="text-left font-medium px-4 py-3">Dernière visite</th>
                    <th className="text-right font-medium px-4 py-3">RDV</th>
                    <th className="text-right font-medium px-4 py-3">Dépensé</th>
                    <th className="text-center font-medium px-4 py-3">Statut</th>
                    <th className="text-right font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={`desktop-${client.id}`} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback>
                              {client.name.split(" ").map((n: string) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-black leading-tight">{client.name}</div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Star className="h-3 w-3 text-yellow-500 fill-current mr-1" />
                              {client.averageRating}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{client.email}</td>
                      <td className="px-4 py-3 text-gray-700">{client.phone}</td>
                      <td className="px-4 py-3 text-gray-700">{client.lastVisit}</td>
                      <td className="px-4 py-3 text-right text-black font-semibold">{client.totalBookings}</td>
                      <td className="px-4 py-3 text-right text-black font-semibold">{client.totalSpent} DA</td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusColor(client.status)}>{getStatusLabel(client.status)}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Voir"
                            onClick={() => { setSelected(client); setOpen(true); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <EditClientModal
                            clientId={client.id}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Modifier">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            }
                            onSaved={async () => {
                              const params = new URLSearchParams()
                              if (q) params.set("q", q)
                              if (sort) params.set("sort", sort)
                              const res = await fetch(`/api/pro/clients?${params.toString()}`, { cache: "no-store" })
                              const j = await res.json().catch(() => ({}))
                              setItems(j.items || [])
                              setTotal(j.total || 0)
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                            title="Supprimer"
                            onClick={() => deleteClient(client.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {clients.map((client) => (
          <Card key={`mobile-${client.id}`} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>
                      {client.name.split(" ").map((n: string) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-base">{client.name}</div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Star className="h-3 w-3 text-yellow-500 fill-current mr-1" />
                      {client.averageRating}
                      <span className="mx-2">•</span>
                      <Badge variant="outline" className={getStatusColor(client.status) + " border-none text-xs h-5"}>
                        {getStatusLabel(client.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => { setSelected(client); setOpen(true); }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <EditClientModal
                    clientId={client.id}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                    onSaved={async () => {
                      const params = new URLSearchParams()
                      if (q) params.set("q", q)
                      if (sort) params.set("sort", sort)
                      const res = await fetch(`/api/pro/clients?${params.toString()}`, { cache: "no-store" })
                      const j = await res.json().catch(() => ({}))
                      setItems(j.items || [])
                      setTotal(j.total || 0)
                    }}
                  />
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-y-2 text-sm">
                <div className="text-gray-600">Dernière visite</div>
                <div className="text-right font-medium">{client.lastVisit}</div>
                
                <div className="text-gray-600">Téléphone</div>
                <div className="text-right font-medium">{client.phone || '—'}</div>
                
                <div className="text-gray-600">RDV</div>
                <div className="text-right font-medium">{client.totalBookings}</div>
                
                <div className="text-gray-600">Total dépensé</div>
                <div className="text-right font-semibold text-primary">{client.totalSpent} DA</div>
              </div>
              
              <div className="mt-3 pt-3 border-t flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50 h-8 px-3 text-sm"
                  onClick={() => deleteClient(client.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Details Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Détails client</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>{selected.name.split(" ").map((n: string) => n[0]).join("")}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-black">{selected.name}</div>
                  <div className="flex items-center text-xs text-gray-600">
                    <Star className="h-3 w-3 text-yellow-500 fill-current mr-1" /> {selected.averageRating}
                  </div>
                </div>
                <div className="ml-auto">
                  <Badge className={getStatusColor(selected.status)}>{selected.status}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center text-gray-700"><Mail className="h-4 w-4 mr-2" />{selected.email}</div>
                <div className="flex items-center text-gray-700"><Phone className="h-4 w-4 mr-2" />{selected.phone}</div>
                <div className="flex items-center text-gray-700 col-span-2"><Calendar className="h-4 w-4 mr-2" />Dernière visite: {selected.lastVisit}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Total RDV</p>
                  <p className="font-semibold text-black">{selected.totalBookings}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total dépensé</p>
                  <p className="font-semibold text-black">{selected.totalSpent} DA</p>
                </div>
              </div>
              <div>
                <p className="text-gray-600 mb-2">Services préférés</p>
                <div className="flex flex-wrap gap-1">
                  {selected.favoriteServices.map((s: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
