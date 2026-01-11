"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, RotateCcw, Trash2, Users, Building2, Calendar, CreditCard, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ProtectedAdminPage } from "@/components/admin/ProtectedAdminPage"
import { useToast } from "@/hooks/use-toast"

const TABS_DEF = [
  { id: "utilisateurs", name: "Utilisateurs", icon: Users },
  { id: "salons", name: "Salons", icon: Building2 },
  { id: "reservations", name: "Réservations", icon: Calendar },
  { id: "abonnements", name: "Abonnements", icon: CreditCard },
  { id: "leads", name: "Leads", icon: Users }, // Reuse Users icon or find another one if needed
] as const

export default function AdminArchivesPage() {
  return (
    <ProtectedAdminPage requiredPermission="archives">
      <AdminArchivesPageContent />
    </ProtectedAdminPage>
  );
}

function AdminArchivesPageContent() {
  const [activeTab, setActiveTab] = useState("utilisateurs")
  const [searchTerm, setSearchTerm] = useState("")
  const [counts, setCounts] = useState<Record<string, number>>({
    utilisateurs: 0,
    salons: 0,
    reservations: 0,
    abonnements: 0,
    leads: 0,
  })
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [actionId, setActionId] = useState<string | number | null>(null)
  const { toast } = useToast()

  async function fetchStats() {
    try {
      const res = await fetch("/api/admin/archives/stats", { cache: "no-store" })
      if (!res.ok) throw new Error("Erreur stats")
      const data = await res.json()
      setCounts(data)
    } catch (e) {
      console.error("[archives/stats]", e)
    }
  }

  async function fetchList() {
    try {
      setLoading(true)
      const u = new URL(window.location.origin + "/api/admin/archives")
      u.searchParams.set("type", activeTab)
      if (searchTerm.trim()) u.searchParams.set("q", searchTerm.trim())
      u.searchParams.set("page", "1")
      u.searchParams.set("pageSize", "20")
      const res = await fetch(u.toString(), { cache: "no-store" })
      if (!res.ok) throw new Error("Erreur liste")
      const data = await res.json()
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch (e) {
      console.error("[archives/list]", e)
      toast({ title: "Erreur", description: "Impossible de charger les archives.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (type: string, id: string | number) => {
    try {
      setActionId(id)
      const res = await fetch("/api/admin/archives/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Erreur restauration")
      toast({ title: "Restauration", description: data?.message || "Restauré avec succès." })
      await Promise.all([fetchList(), fetchStats()])
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message || "Restauration impossible.", variant: "destructive" })
    } finally {
      setActionId(null)
    }
  }

  const handlePermanentDelete = async (type: string, id: string | number) => {
    try {
      setActionId(id)
      const res = await fetch("/api/admin/archives", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Erreur suppression")
      toast({ title: "Suppression", description: data?.message || "Supprimé définitivement." })
      await Promise.all([fetchList(), fetchStats()])
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message || "Suppression impossible.", variant: "destructive" })
    } finally {
      setActionId(null)
    }
  }

  // Fetch stats on mount
  useEffect(() => {
    fetchStats()
  }, [])

  // Debounced fetch list on tab/search change
  useEffect(() => {
    const t = setTimeout(() => {
      fetchList()
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchTerm])

  const renderUsersTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Utilisateur</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Date suppression</TableHead>
          <TableHead>Raison</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((user: any) => (
          <TableRow key={user.id}>
            <TableCell>
              <div>
                <div className="font-medium">{[user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || "Utilisateur"}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">-</Badge>
            </TableCell>
            <TableCell>{user.deleted_at ? new Date(user.deleted_at).toLocaleString() : ""}</TableCell>
            <TableCell>-</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleRestore("utilisateurs", user.id)} disabled={actionId === user.id}>
                  {actionId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" disabled={actionId === user.id}>
                      {actionId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer définitivement</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. L'utilisateur sera définitivement supprimé.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handlePermanentDelete("utilisateurs", user.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  const renderSalonsTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Salon</TableHead>
          <TableHead>Propriétaire</TableHead>
          <TableHead>Ville</TableHead>
          <TableHead>Date suppression</TableHead>
          <TableHead>Raison</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((salon: any) => (
          <TableRow key={salon.id}>
            <TableCell className="font-medium">{salon.public_name || salon.legal_name}</TableCell>
            <TableCell>{salon.users ? [salon.users.first_name, salon.users.last_name].filter(Boolean).join(" ") : "-"}</TableCell>
            <TableCell>-</TableCell>
            <TableCell>{salon.deleted_at ? new Date(salon.deleted_at).toLocaleString() : salon.archived_at ? new Date(salon.archived_at).toLocaleString() : ""}</TableCell>
            <TableCell>-</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleRestore("salons", salon.id)} disabled={actionId === salon.id}>
                  {actionId === salon.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" disabled={actionId === salon.id}>
                      {actionId === salon.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer définitivement</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Le salon sera définitivement supprimé.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handlePermanentDelete("salons", salon.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  const renderReservationsTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Salon</TableHead>
          <TableHead>Service</TableHead>
          <TableHead>Date RDV</TableHead>
          <TableHead>Prix</TableHead>
          <TableHead>Date suppression</TableHead>
          <TableHead>Raison</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((reservation: any) => (
          <TableRow key={reservation.id}>
            <TableCell className="font-medium">{reservation.clients ? [reservation.clients.first_name, reservation.clients.last_name].filter(Boolean).join(" ") : "-"}</TableCell>
            <TableCell>{reservation.businesses ? reservation.businesses.public_name : "-"}</TableCell>
            <TableCell>{reservation.reservation_items?.[0]?.services?.name || (reservation.reservation_items?.length || 0) + " service(s)"}</TableCell>
            <TableCell>{reservation.starts_at ? new Date(reservation.starts_at).toLocaleString() : "-"}</TableCell>
            <TableCell className="font-medium">-</TableCell>
            <TableCell>{reservation.cancelled_at ? new Date(reservation.cancelled_at).toLocaleString() : ""}</TableCell>
            <TableCell>-</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleRestore("reservations", reservation.id)} disabled={actionId === reservation.id}>
                  {actionId === reservation.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" disabled={actionId === reservation.id}>
                      {actionId === reservation.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer définitivement</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. La réservation sera définitivement supprimée.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handlePermanentDelete("reservations", reservation.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  const renderAbonnementsTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Salon</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Date expiration</TableHead>
          <TableHead>Montant</TableHead>
          <TableHead>Date suppression</TableHead>
          <TableHead>Raison</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((abonnement: any) => (
          <TableRow key={abonnement.id}>
            <TableCell className="font-medium">{abonnement.businesses ? abonnement.businesses.public_name : "-"}</TableCell>
            <TableCell>
              <Badge variant="secondary">{abonnement.plans ? abonnement.plans.name : "-"}</Badge>
            </TableCell>
            <TableCell>{abonnement.current_period_end ? new Date(abonnement.current_period_end).toLocaleDateString() : "-"}</TableCell>
            <TableCell className="font-medium">{abonnement.plans?.price_cents != null ? `${(abonnement.plans.price_cents / 100).toFixed(2)} €` : "-"}</TableCell>
            <TableCell>-</TableCell>
            <TableCell>-</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleRestore("abonnements", abonnement.id)} disabled={actionId === abonnement.id}>
                  {actionId === abonnement.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" disabled={actionId === abonnement.id}>
                      {actionId === abonnement.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer définitivement</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. L'abonnement sera définitivement supprimé.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handlePermanentDelete("abonnements", abonnement.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  const renderLeadsTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Lead / Salon</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Téléphone</TableHead>
          <TableHead>Date archivage</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((lead: any) => (
          <TableRow key={lead.id}>
            <TableCell className="font-medium">{lead.business_name}</TableCell>
            <TableCell>{[lead.owner_first_name, lead.owner_last_name].filter(Boolean).join(" ")}</TableCell>
            <TableCell>{lead.email}</TableCell>
            <TableCell>{lead.phone || "-"}</TableCell>
            <TableCell>{lead.archived_at ? new Date(lead.archived_at).toLocaleString() : ""}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleRestore("leads", lead.id)} disabled={actionId === lead.id}>
                  {actionId === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" disabled={actionId === lead.id}>
                      {actionId === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer définitivement</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Le lead sera définitivement supprimé.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handlePermanentDelete("leads", lead.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  const renderTable = () => {
    switch (activeTab) {
      case "utilisateurs":
        return renderUsersTable()
      case "salons":
        return renderSalonsTable()
      case "reservations":
        return renderReservationsTable()
      case "abonnements":
        return renderAbonnementsTable()
      case "leads":
        return renderLeadsTable()
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
       <header className="bg-white border-b border-gray-200 mb-6">
        <div className="px-6 py-4">  
                <div className="flex justify-between items-center"> 
        <div>
        <h1 className="text-3xl font-bold text-black">Archives</h1>
        <p className="text-gray-600 mt-1">Gérez les éléments supprimés de la plateforme et restaurez-les si nécessaire.</p>
      </div>
            </div>
            </div>  
      </header>


      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {TABS_DEF.map((tab) => {
          const Icon = tab.icon
          return (
            <div key={tab.id} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{tab.name} archivés</p>
                  <p className="text-2xl font-bold text-gray-900">{counts[tab.id as keyof typeof counts] ?? 0}</p>
                </div>
                <Icon className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {TABS_DEF.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-black text-black"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                  <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{counts[tab.id as keyof typeof counts] ?? 0}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Barre de recherche */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher dans les archives..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Alerte */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">Attention</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Les éléments archivés sont automatiquement supprimés définitivement après 30 jours. Utilisez la
                  fonction de restauration pour récupérer les données importantes.
                </p>
              </div>
            </div>
          </div>

          {/* Tableau */}
          <div className="border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-gray-500">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Chargement...
              </div>
            ) : (
              renderTable()
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
