"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { Search, MoreHorizontal, RotateCcw, Trash2, Archive, Users, Calendar, Settings, UserCheck, Eye } from "lucide-react"

// Composant pour afficher les détails d'un élément archivé
function ArchiveDetailsDialog({ item, type, onClose }: { item: any, type: string, onClose: () => void }) {
  const renderContent = () => {
    switch (type) {
      case 'employee':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Détails de l'employé</h3>
              <div className="mt-2 space-y-2">
                <p><span className="font-medium">Nom :</span> {item.name}</p>
                <p><span className="font-medium">Rôle :</span> {item.role}</p>
                <p><span className="font-medium">Email :</span> {item.email || 'Non spécifié'}</p>
                <p><span className="font-medium">Statut :</span> <Badge variant="secondary">{item.status}</Badge></p>
              </div>
            </div>
          </div>
        )
      case 'reservation':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Détails de la réservation</h3>
              <div className="mt-2 space-y-2">
                <p><span className="font-medium">Client :</span> {item.client}</p>
                <p><span className="font-medium">Service :</span> {item.service}</p>
                <p><span className="font-medium">Employé :</span> {item.employee || 'Non attribué'}</p>
                <p><span className="font-medium">Date :</span> {item.date} à {item.time}</p>
                <p><span className="font-medium">Prix :</span> {item.price}</p>
                {item.reason && <p><span className="font-medium">Raison :</span> {item.reason}</p>}
              </div>
            </div>
          </div>
        )
      case 'service':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Détails du service</h3>
              <div className="mt-2 space-y-2">
                <p><span className="font-medium">Nom :</span> {item.name}</p>
                <p><span className="font-medium">Catégorie :</span> {item.category || 'Non spécifiée'}</p>
                <p><span className="font-medium">Prix :</span> {item.price || 'Non spécifié'}</p>
                <p><span className="font-medium">Durée :</span> {item.duration || 'Non spécifiée'}</p>
                {item.deletedDate && <p><span className="font-medium">Date de suppression :</span> {item.deletedDate}</p>}
              </div>
            </div>
          </div>
        )
      case 'account':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Détails du compte</h3>
              <div className="mt-2 space-y-2">
                <p><span className="font-medium">Nom :</span> {item.name}</p>
                <p><span className="font-medium">Email :</span> {item.email || 'Non spécifié'}</p>
                <p><span className="font-medium">Rôle :</span> {item.role || 'Non spécifié'}</p>
                {item.permissions?.length > 0 && (
                  <div>
                    <p className="font-medium">Permissions :</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.permissions.map((p: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <AlertDialog open={true} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Détails de l'élément archivé</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="py-4">
          {renderContent()}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Fermer</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default function ArchivesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [archivedEmployees, setArchivedEmployees] = useState<Array<{ id: string; name: string; role: string; email: string | null; status: string }>>([])
  const [archivedReservations, setArchivedReservations] = useState<Array<{
    id: string
    client: string
    service: string
    employee: string
    date: string
    time: string
    price: string
    deletedDate?: string
    reason?: string
  }>>([])
  const [archivedServices, setArchivedServices] = useState<Array<{
    id: string
    name: string
    category?: string
    price?: string
    duration?: string
    deletedDate?: string
    deletedBy?: string
    reason?: string
  }>>([])
  const [archivedAccounts, setArchivedAccounts] = useState<Array<{
    id: string
    name: string
    email: string | null
    role: string | null
    permissions?: string[]
    deletedDate?: string
    deletedBy?: string
    reason?: string
  }>>([])
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{item: any, type: string} | null>(null)

  async function loadArchivedEmployees() {
    setLoading(true)
    try {
      const q = new URLSearchParams()
      q.set("include", "roles")
      q.set("limit", "200")
      const res = await fetch(`/api/pro/employees?${q.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Erreur de chargement")
      const items = Array.isArray(data?.items) ? data.items : []
      const out = items
        .filter((e: any) => !e.is_active)
        .map((e: any) => ({
          id: e.id,
          name: e.full_name,
          email: e.email || null,
          role: (e.employee_roles?.[0]?.role as string) || "",
          status: "Inactif",
        }))
      setArchivedEmployees(out)
    } catch (e) {
      // ignore for now
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour nettoyer automatiquement les archives de plus de 30 jours
  const cleanupOldArchives = async () => {
    try {
      await fetch('/api/pro/archives/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 30 })
      });
    } catch (error) {
      console.error('Erreur lors du nettoyage des archives:', error);
    }
  };

  useEffect(() => {
    // Nettoyage automatique au chargement de la page
    cleanupOldArchives();
    
    // Chargement des données
    loadArchivedEmployees()
    ;(async () => {
      try {
        // Reservations
        const r = await fetch(`/api/pro/archives/reservations`)
        const rj = await r.json()
        if (r.ok && Array.isArray(rj?.items)) {
          const formatted = rj.items.map((reservation: any) => {
            let totalPrice = 0
            const serviceNames: string[] = []
            if (Array.isArray(reservation?.reservation_items)) {
              reservation.reservation_items.forEach((it: any) => {
                totalPrice += Number(it.price_cents || 0)
                const sName = it?.services?.name || "Service"
                const vName = it?.service_variants?.name ? ` - ${it.service_variants.name}` : ""
                serviceNames.push(`${sName}${vName}`)
              })
            }
            const starts = new Date(reservation.starts_at)
            return {
              id: reservation.id,
              client: [reservation?.clients?.first_name, reservation?.clients?.last_name].filter(Boolean).join(" ") || "Client",
              service: serviceNames.join(" + ") || "",
              employee: reservation?.employees?.full_name || "",
              date: starts.toISOString().slice(0, 10),
              time: starts.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
              price: Math.round(totalPrice / 100) + " DA",
              deletedDate: reservation?.cancelled_at ? new Date(reservation.cancelled_at).toISOString().slice(0, 10) : undefined,
              reason: reservation?.status === "CANCELLED" ? "Annulation" : undefined,
            }
          })
          setArchivedReservations(formatted)
        }
      } catch {}

      try {
        // Services
        const s = await fetch(`/api/pro/archives/services`)
        const sj = await s.json()
        if (s.ok && Array.isArray(sj?.items)) {
          setArchivedServices(
            sj.items.map((svc: any) => {
              const variants = Array.isArray(svc?.service_variants) ? svc.service_variants : []
              const durations = variants.map((v: any) => Number(v.duration_minutes || 0)).filter((n: number) => n > 0)
              const pricesCandidates = variants.flatMap((v: any) => [v.price_cents, v.price_min_cents, v.price_max_cents].filter((x: any) => typeof x === 'number')) as number[]
              const minDuration = durations.length ? Math.min(...durations) : undefined
              const maxDuration = durations.length ? Math.max(...durations) : undefined
              const minPrice = pricesCandidates.length ? Math.min(...pricesCandidates) : undefined
              const maxPrice = pricesCandidates.length ? Math.max(...pricesCandidates) : undefined
              const duration = typeof minDuration !== 'undefined' ? (minDuration === maxDuration ? `${minDuration} min` : `${minDuration}-${maxDuration} min`) : undefined
              const price = typeof minPrice !== 'undefined' ? (minPrice === maxPrice ? `${Math.round(minPrice/100)} DA` : `${Math.round(minPrice/100)}–${Math.round((maxPrice||0)/100)} DA`) : undefined
              return {
                id: svc.id,
                name: svc.name,
                category: svc?.service_categories?.name,
                price,
                duration,
                deletedDate: new Date(svc.updated_at).toISOString().slice(0, 10),
              }
            })
          )
        }
      } catch {}

      try {
        // Accounts (employés inactifs avec comptes)
        const a = await fetch(`/api/pro/archives/accounts`)
        const aj = await a.json()
        if (a.ok && Array.isArray(aj?.items)) {
          setArchivedAccounts(
            aj.items.map((acc: any) => ({
              id: acc.id,
              name: acc.name,
              email: acc.email || null,
              role: acc.role || null,
            }))
          )
        }
      } catch {}
    })()
  }, [])

  const handleRestore = async (type: string, id: string) => {
    try {
      if (type === "employee") {
        const res = await fetch(`/api/pro/employees/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: true }),
        })
        if (!res.ok) throw new Error("Restauration échouée")
        await loadArchivedEmployees()
      } else if (type === "reservation") {
        const res = await fetch(`/api/pro/archives/reservations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
        if (!res.ok) throw new Error("Restauration échouée")
        // refresh
        const r = await fetch(`/api/pro/archives/reservations`)
        const rj = await r.json()
        if (r.ok) setArchivedReservations((rj?.items || []).map((reservation: any) => ({
          id: reservation.id,
          client: [reservation?.clients?.first_name, reservation?.clients?.last_name].filter(Boolean).join(" ") || "Client",
          service: (reservation?.reservation_items || []).map((it: any) => `${it?.services?.name || "Service"}${it?.service_variants?.name ? ` - ${it.service_variants.name}` : ""}`).join(" + "),
          employee: reservation?.employees?.full_name || "",
          date: new Date(reservation.starts_at).toISOString().slice(0, 10),
          time: new Date(reservation.starts_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          price: Math.round(((reservation?.reservation_items || []).reduce((s: number, it: any) => s + Number(it.price_cents || 0), 0)) / 100) + " DA",
          deletedDate: reservation?.cancelled_at ? new Date(reservation.cancelled_at).toISOString().slice(0, 10) : undefined,
          reason: reservation?.status === "CANCELLED" ? "Annulation" : undefined,
        })))
      } else if (type === "service") {
        const res = await fetch(`/api/pro/archives/services`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
        if (!res.ok) throw new Error("Restauration échouée")
        const s = await fetch(`/api/pro/archives/services`)
        const sj = await s.json()
        if (s.ok) setArchivedServices((sj?.items || []).map((svc: any) => {
          const variants = Array.isArray(svc?.service_variants) ? svc.service_variants : []
          const durations = variants.map((v: any) => Number(v.duration_minutes || 0)).filter((n: number) => n > 0)
          const pricesCandidates = variants.flatMap((v: any) => [v.price_cents, v.price_min_cents, v.price_max_cents].filter((x: any) => typeof x === 'number')) as number[]
          const minDuration = durations.length ? Math.min(...durations) : undefined
          const maxDuration = durations.length ? Math.max(...durations) : undefined
          const minPrice = pricesCandidates.length ? Math.min(...pricesCandidates) : undefined
          const maxPrice = pricesCandidates.length ? Math.max(...pricesCandidates) : undefined
          const duration = typeof minDuration !== 'undefined' ? (minDuration === maxDuration ? `${minDuration} min` : `${minDuration}-${maxDuration} min`) : undefined
          const price = typeof minPrice !== 'undefined' ? (minPrice === maxPrice ? `${Math.round(minPrice/100)} DA` : `${Math.round(minPrice/100)}–${Math.round((maxPrice||0)/100)} DA`) : undefined
          return { id: svc.id, name: svc.name, category: svc?.service_categories?.name, price, duration, deletedDate: new Date(svc.updated_at).toISOString().slice(0, 10) }
        }))
      } else if (type === "account") {
        const res = await fetch(`/api/pro/archives/accounts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
        if (!res.ok) throw new Error("Restauration échouée")
        const a = await fetch(`/api/pro/archives/accounts`)
        const aj = await a.json()
        if (a.ok) setArchivedAccounts((aj?.items || []).map((acc: any) => ({ id: acc.id, name: acc.name, email: acc.email || null, role: acc.role || null })))
      }
    } catch (e: any) {
      alert(e?.message || "Impossible de restaurer")
    }
  }

  const handlePermanentDelete = async (type: string, id: string) => {
    try {
      if (type === "reservation") {
        // Option produit: supprimer définitivement une réservation via route existante
        const res = await fetch(`/api/pro/reservations/${id}`, { method: "DELETE" })
        if (!res.ok) throw new Error("Suppression échouée")
        setArchivedReservations((prev) => prev.filter((r) => r.id !== id))
      } else if (type === "service") {
        const res = await fetch(`/api/pro/archives/services?id=${encodeURIComponent(id)}`, { method: "DELETE" })
        if (!res.ok) throw new Error("Suppression échouée")
        setArchivedServices((prev) => prev.filter((s) => s.id !== id))
      } else if (type === "account") {
        const res = await fetch(`/api/pro/archives/accounts?id=${encodeURIComponent(id)}`, { method: "DELETE" })
        if (!res.ok) throw new Error("Suppression échouée")
        setArchivedAccounts((prev) => prev.filter((a) => a.id !== id))
      }
    } catch (e: any) {
      alert(e?.message || "Action impossible")
    }
  }

  const getArchiveStats = () => {
    return [
      { label: "Employés archivés", value: archivedEmployees.length, icon: Users },
      { label: "Réservations archivées", value: archivedReservations.length, icon: Calendar },
      { label: "Services archivés", value: archivedServices.length, icon: Settings },
      { label: "Comptes archivés", value: archivedAccounts.length, icon: UserCheck },
    ]
  }

  return (
    <div className="min-h-screen bg-gray-50">
       <header className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center"></div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Archives</h1>
        <p className="text-gray-600">Gérez et restaurez les éléments supprimés de votre institut.</p>
      </div>
      </div>
      </header>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {getArchiveStats().map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <Icon className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher dans les archives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different archive types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Éléments Archivés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="employees" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="employees">Employés</TabsTrigger>
              <TabsTrigger value="reservations">Réservations</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="accounts">Comptes</TabsTrigger>
            </TabsList>

            {/* Archived Employees */}
            <TabsContent value="employees" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedEmployees
                    .filter((e) =>
                      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (e.role || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (e.email || "").toLowerCase().includes(searchTerm.toLowerCase()),
                    )
                    .map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{employee.role}</Badge>
                        </TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{employee.status}</Badge>
                        </TableCell>
                        <TableCell className="space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => setSelectedItem({ item: employee, type: 'employee' })}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleRestore("employee", employee.id)}
                            title="Restaurer l'employé"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Archived Reservations */}
            <TabsContent value="reservations" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Employé</TableHead>
                    <TableHead>Date & Heure</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Date de suppression</TableHead>
                    <TableHead>Raison</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedReservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-medium">{reservation.client}</TableCell>
                      <TableCell>{reservation.service}</TableCell>
                      <TableCell>{reservation.employee}</TableCell>
                      <TableCell>
                        {reservation.date} à {reservation.time}
                      </TableCell>
                      <TableCell className="font-medium">{reservation.price}</TableCell>
                      <TableCell>{reservation.deletedDate}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{reservation.reason}</Badge>
                      </TableCell>
                      <TableCell className="space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setSelectedItem({ item: reservation, type: 'reservation' })}
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleRestore("reservation", reservation.id)}
                          title="Restaurer la réservation"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Archived Services */}
            <TabsContent value="services" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom du service</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Date de suppression</TableHead>
                    <TableHead>Supprimé par</TableHead>
                    <TableHead>Raison</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{service.category}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{service.price}</TableCell>
                      <TableCell>{service.duration}</TableCell>
                      <TableCell>{service.deletedDate}</TableCell>
                      <TableCell>{service.deletedBy}</TableCell>
                      <TableCell>{service.reason}</TableCell>
                      <TableCell className="space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setSelectedItem({ item: service, type: 'service' })}
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleRestore("service", service.id)}
                          title="Restaurer le service"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Archived Accounts */}
            <TabsContent value="accounts" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Date de suppression</TableHead>
                    <TableHead>Supprimé par</TableHead>
                    <TableHead>Raison</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>{account.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{account.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {(account.permissions ?? []).map((permission, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{account.deletedDate}</TableCell>
                      <TableCell>{account.deletedBy}</TableCell>
                      <TableCell>{account.reason}</TableCell>
                      <TableCell className="space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setSelectedItem({ item: account, type: 'account' })}
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleRestore("account", account.id)}
                          title="Restaurer le compte"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogue de détails */}
      {selectedItem && (
        <ArchiveDetailsDialog
          item={selectedItem.item}
          type={selectedItem.type}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  )
}
