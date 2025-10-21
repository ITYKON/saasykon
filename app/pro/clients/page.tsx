"use client"
import { Users, Filter, Phone, Mail, Calendar, Star, Eye, Pencil, Trash2 } from "lucide-react"
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
          if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
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
  }, [q, sort, status])

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
    <div className="space-y-6">
        <header className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
        <div>
        <h1 className="text-2xl font-bold text-black">Mes clients</h1>
        <p className="text-gray-600">Gérer vos clients</p>
        </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
                <CreateClientModal
                  trigger={<Button>+ Ajouter un client</Button>}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-black">{clients.length}</p>
                <p className="text-gray-600">Clients total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-black">{clients.filter((c) => c.status === "VIP").length}</p>
                <p className="text-gray-600">Clients VIP</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-black">{clients.filter((c) => c.status === "Nouveau").length}</p>
                <p className="text-gray-600">Nouveaux clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold">
                  {clients.length ? Math.round((clients.reduce((acc, c) => acc + c.averageRating, 0) / clients.length) * 10) / 10 : 0}
                </span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-black">Note moyenne</p>
                <p className="text-gray-600">Satisfaction</p>
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

      {/* Clients Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Client</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Email</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Téléphone</th>
                  <th className="text-left font-medium px-4 py-3">Dernière visite</th>
                  <th className="text-right font-medium px-4 py-3">RDV</th>
                  <th className="text-right font-medium px-4 py-3">Dépensé</th>
                  <th className="text-center font-medium px-4 py-3">Statut</th>
                  <th className="text-right font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-t">
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
                    <td className="px-4 py-3 hidden md:table-cell text-gray-700">{client.email}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-700">{client.phone}</td>
                    <td className="px-4 py-3 text-gray-700">{client.lastVisit}</td>
                    <td className="px-4 py-3 text-right text-black font-semibold">{client.totalBookings}</td>
                    <td className="px-4 py-3 text-right text-black font-semibold">{client.totalSpent} DA</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={getStatusColor(client.status)}>{getStatusLabel(client.status)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="bg-transparent"
                          title="Voir"
                          onClick={() => { setSelected(client); setOpen(true); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <EditClientModal
                          clientId={client.id}
                          trigger={<Button variant="outline" size="icon" className="bg-transparent" title="Modifier"><Pencil className="h-4 w-4" /></Button>}
                          onSaved={async () => {
                            const params = new URLSearchParams()
                            if (q) params.set("q", q)
                            if (sort) params.set("sort", sort)
                            const res = await fetch(`/api/pro/clients?${params.toString()}`, { cache: "no-store" })
                            const j = await res.json().catch(() => ({}))
                            setItems(j.items || [])
                            setTotal(j.total || 0)
                          }}
                          onDeleted={async () => {
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
                          variant="outline"
                          size="icon"
                          className="bg-transparent text-red-600 border-red-300"
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
