"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  User,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import CreateReservationModal from "@/components/pro/CreateReservationModal"
import { ClientSearch } from "@/components/ui/client-search"
import useAuth from "@/hooks/useAuth"

// Mock data for reservations
const reservations = [
  {
    id: 1,
    client: "Marie Dupont",
    email: "marie.dupont@email.com",
    service: "COUPE + BRUSHING",
    employe: "SOUSSOU HAMICHE",
    date: "2025-01-20",
    heure: "10:30",
    duree: "45min",
    prix: "2,200 DA",
    paiement: "En ligne",
    status: "Confirmé",
    telephone: "+213 555 123 456",
  },
  {
    id: 2,
    client: "Sarah Benali",
    email: "sarah.benali@email.com",
    service: "MANUCURE",
    employe: "Amina Khelifi",
    date: "2025-01-22",
    heure: "14:00",
    duree: "30min",
    prix: "1,800 DA",
    paiement: "Présentiel",
    status: "En attente",
    telephone: "+213 555 789 012",
  },
  {
    id: 3,
    client: "Fatima Meziane",
    email: "fatima.meziane@email.com",
    service: "COLORATION + COUPE",
    employe: "SOUSSOU HAMICHE",
    date: "2025-01-25",
    heure: "09:00",
    duree: "120min",
    prix: "4,500 DA",
    paiement: "En ligne",
    status: "Confirmé",
    telephone: "+213 555 345 678",
  },
  {
    id: 4,
    client: "Aicha Benaissa",
    email: "aicha.benaissa@email.com",
    service: "SOIN VISAGE",
    employe: "Leila Mansouri",
    date: "2025-01-18",
    heure: "16:30",
    duree: "60min",
    prix: "3,000 DA",
    paiement: "Présentiel",
    status: "Terminé",
    telephone: "+213 555 901 234",
  },
  {
    id: 5,
    client: "Nadia Cherif",
    email: "nadia.cherif@email.com",
    service: "ÉPILATION",
    employe: "Amina Khelifi",
    date: "2025-01-15",
    heure: "11:00",
    duree: "45min",
    prix: "2,500 DA",
    paiement: "En ligne",
    status: "Annulé",
    telephone: "+213 555 567 890",
  },
]

const STATUS_MAP_ENUM_FROM_FR: Record<string, string> = {
  'Confirmé': 'CONFIRMED',
  'En attente': 'PENDING',
  'Terminé': 'COMPLETED',
  'Annulé': 'CANCELLED',
}

const STATUS_MAP_FR_FROM_ENUM: Record<string, string> = {
  CONFIRMED: 'Confirmé',
  PENDING: 'En attente',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
}

const statusClasses = (statusEnum: string) => {
  switch (statusEnum) {
    case 'CONFIRMED':
      return 'bg-green-100 text-green-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

const getStatusBadge = (statusFr: string) => {
  switch (statusFr) {
    case "Confirmé":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Confirmé
        </Badge>
      )
    case "En attente":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          <AlertCircle className="h-3 w-3 mr-1" />
          En attente
        </Badge>
      )
    case "Terminé":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Terminé
        </Badge>
      )
    case "Annulé":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <XCircle className="h-3 w-3 mr-1" />
          Annulé
        </Badge>
      )
    default:
      return <Badge variant="secondary">{statusFr}</Badge>
  }
}

const getPaiementBadge = (paiement: string) => {
  return paiement === "En ligne" ? (
    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
      <CreditCard className="h-3 w-3 mr-1" />
      En ligne
    </Badge>
  ) : (
    <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
      <User className="h-3 w-3 mr-1" />
      Présentiel
    </Badge>
  )
}

export default function ReservationsPage() {
  const { auth } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editData, setEditData] = useState<{
    id: string;
    date: string;
    time: string;
    employee_id: string | null;
    status: string;
    notes: string;
    client: { id: string; name: string } | null;
    item: { id: string; service_id: string; variant_id: string | null; price_cents: number; duration_minutes: number; employee_id: string | null } | null;
  } | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [variants, setVariants] = useState<any[]>([])
  
  // Récupérer l'ID de l'entreprise à partir des assignments
  const businessId = auth?.assignments?.[0]?.business_id
  
  // Fonction pour rafraîchir la liste des réservations
  const fetchReservations = useCallback(async () => {
    if (!businessId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/pro/reservations?business_id=${businessId}`)
      if (!response.ok) throw new Error('Erreur lors du chargement des réservations')
      const data = await response.json()
      // Exclure les réservations annulées de l'interface principale
      const list = Array.isArray(data.reservations) ? data.reservations : []
      setReservations(list.filter((r: any) => r?.status !== 'CANCELLED'))
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }, [businessId])
  
  // Charger les réservations au montage du composant
  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  // Charger les employés lors de l'ouverture de l'édition
  useEffect(() => {
    if (!isEditOpen || !businessId || !editData?.id) return
    Promise.all([
      fetch(`/api/pro/employees?business_id=${businessId}&include=services`).then(r => r.json()).catch(() => ({ items: [] })),
      fetch(`/api/pro/services?business_id=${businessId}`).then(r => r.json()).catch(() => ({ services: [] })),
      fetch(`/api/pro/reservations/${editData.id}`).then(r => r.json())
    ])
    .then(([e, s, r]) => {
      setEmployees(e.items || [])
      setServices(s.services || [])
      const res = r.reservation
      if (!res) return
      const d = new Date(res.starts_at)
      const pad = (n: number) => String(n).padStart(2, '0')
      const date = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
      const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
      const item = res.reservation_items?.[0] || null
      const client = res.clients ? { id: res.clients.id, name: [res.clients.first_name, res.clients.last_name].filter(Boolean).join(' ') } : null
      setEditData(prev => prev && {
        ...prev,
        date,
        time,
        employee_id: res.employee_id || null,
        status: res.status,
        notes: res.notes || "",
        client,
        item: item ? {
          id: item.id,
          service_id: item.service_id,
          variant_id: item.variant_id,
          price_cents: item.price_cents || 0,
          duration_minutes: item.duration_minutes || 0,
          employee_id: item.employee_id || null,
        } : null,
      })

      const vs = (s.services || []).find((x: any) => x.id === (res.reservation_items?.[0]?.service_id))?.service_variants || []
      setVariants(vs)
    })
  }, [isEditOpen, businessId, editData?.id])

  const openDelete = (id: string) => { setDeletingId(id); setIsDeleteOpen(true); }
  const confirmDelete = async () => {
    if (!deletingId) return
    try {
      await fetch(`/api/pro/reservations/${deletingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' })
      })
      setIsDeleteOpen(false)
      setDeletingId(null)
      fetchReservations()
    } catch (e) {
      console.error(e)
    }
  }

  const openEdit = (r: any) => {
    setEditData({ id: r.id, date: '', time: '', employee_id: null, status: 'CONFIRMED', notes: '', client: null, item: null })
    setIsEditOpen(true)
  }

  const updateStatus = async (id: string, statusEnum: string) => {
    try {
      if (statusEnum === 'COMPLETED') {
        await fetch(`/api/pro/reservations/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reservation_id: id })
        })
      } else {
        await fetch(`/api/pro/reservations/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: statusEnum })
        })
      }
    } finally {
      fetchReservations()
    }
  }

  const saveEdit = async () => {
    if (!editData) return
    setSavingEdit(true)
    try {
      const starts_at = new Date(`${editData.date}T${editData.time}:00`).toISOString()
      await fetch(`/api/pro/reservations/${editData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          starts_at,
          employee_id: editData.employee_id ?? undefined,
          status: editData.status,
          notes: editData.notes,
          client_id: editData.client?.id || null,
          items: editData.item ? [{
            id: editData.item.id,
            service_id: editData.item.service_id,
            variant_id: editData.item.variant_id,
            employee_id: editData.item.employee_id ?? undefined,
            price_cents: editData.item.price_cents,
            duration_minutes: editData.item.duration_minutes,
          }] : [],
        })
      })
      if (editData.status === 'COMPLETED') {
        await fetch(`/api/pro/reservations/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reservation_id: editData.id })
        })
      }
      setIsEditOpen(false)
      setEditData(null)
      fetchReservations()
    } catch (e) {
      console.error(e)
    } finally {
      setSavingEdit(false)
    }
  }
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedReservation, setSelectedReservation] = useState<any>(null)

  // Fonction pour normaliser les statuts
  const normalizeStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'PENDING': 'En attente',
      'CONFIRMED': 'Confirmé',
      'COMPLETED': 'Terminé',
      'CANCELLED': 'Annulé',
      'En attente': 'En attente',
      'Confirmé': 'Confirmé',
      'Terminé': 'Terminé',
      'Annulé': 'Annulé'
    };
    return statusMap[status] || status;
  };

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.service?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.employe?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reservation.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reservation.telephone || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    // Normaliser le statut de la réservation
    const normalizedStatus = normalizeStatus(reservation.status);
    
    // Ne pas afficher les réservations annulées sauf si c'est explicitement demandé
    if (normalizedStatus === 'Annulé' && statusFilter !== 'Annulé') return false;
    
    // Appliquer le filtre de statut
    const matchesStatus = statusFilter === "all" || normalizedStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  })

  return (
    <div className="p-3 sm:p-4">
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="mb-2 sm:mb-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Réservations</h1>
            <p className="text-xs sm:text-sm text-gray-500">Gérez vos réservations</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-48">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 h-9 text-sm"
                />
              </div>
            </div>
            
            <div className="w-full sm:w-40">
              <Select 
                value={statusFilter} 
                onValueChange={setStatusFilter}
                defaultValue="all"
              >
                <SelectTrigger className="w-full h-9 text-sm">
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  <SelectValue placeholder="Filtrer" className="text-sm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-sm">Tous les statuts</SelectItem>
                  <SelectItem value="En attente" className="text-sm">En attente</SelectItem>
                  <SelectItem value="Confirmé" className="text-sm">Confirmé</SelectItem>
                  <SelectItem value="Terminé" className="text-sm">Terminé</SelectItem>
                  <SelectItem value="Annulé" className="text-sm">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {businessId && (
              <CreateReservationModal 
                onCreated={fetchReservations}
                trigger={
                  <Button className="w-full sm:w-auto h-9 px-3 text-sm">
                    <Plus className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Nouvelle</span>
                    <span className="sm:hidden">+</span>
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Affichage mobile */}
      <div className="sm:hidden space-y-3">
        {filteredReservations.map((reservation) => (
          <div key={reservation.id} className="bg-white rounded-lg border p-4 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium">{reservation.client}</h3>
                <p className="text-sm text-gray-600">{reservation.service}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{reservation.prix}</div>
                <div className="text-xs text-gray-500">
                  {new Date(reservation.date).toLocaleDateString("fr-FR")} à {reservation.heure}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{reservation.employe}</span>
              {getStatusBadge(reservation.status)}
            </div>
            
            <div className="mt-3 flex justify-end gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Détails de la réservation</DialogTitle>
                    <DialogDescription>Informations complètes de la réservation</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Client</h4>
                      <p>{reservation.client}</p>
                      <p className="text-sm text-gray-500">{reservation.email}</p>
                      <p className="text-sm text-gray-500">{reservation.telephone}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Service</h4>
                      <p>{reservation.service}</p>
                      <p className="text-sm text-gray-500">Durée: {reservation.duree}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Rendez-vous</h4>
                      <p>
                        {new Date(reservation.date).toLocaleDateString("fr-FR")} à{" "}
                        {reservation.heure}
                      </p>
                      <p className="text-sm text-gray-500">Avec {reservation.employe}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Paiement</h4>
                      <p className="font-semibold">{reservation.prix}</p>
                      <p className="text-sm text-gray-500">{reservation.paiement}</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" className="h-8" onClick={() => openEdit(reservation)}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-red-600" onClick={() => openDelete(reservation.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Tableau pour les écrans plus larges */}
      <div className="hidden sm:block bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Réservations ({filteredReservations.length})</h2>
        </div>
        
        <div className="min-w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Employé</TableHead>
                <TableHead>Date & Heure</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {filteredReservations.map((reservation) => (
              <TableRow key={reservation.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{reservation.client}</div>
                    <div className="text-sm text-gray-500">{reservation.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{reservation.service}</div>
                    <div className="text-sm text-gray-500">{reservation.duree}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{reservation.employe}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium">{new Date(reservation.date).toLocaleDateString("fr-FR")}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {reservation.heure}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-semibold">{reservation.prix}</div>
                </TableCell>
                <TableCell>{getPaiementBadge(reservation.paiement)}</TableCell>
                <TableCell>
                  {(() => {
                    const currentEnum = STATUS_MAP_ENUM_FROM_FR[reservation.status] || 'PENDING'
                    const label = STATUS_MAP_FR_FROM_ENUM[currentEnum]
                    return (
                      <Select
                        value={currentEnum}
                        onValueChange={(v) => updateStatus(reservation.id, v)}
                      >
                        <SelectTrigger className="w-44 bg-transparent border-none p-0 focus:ring-0 focus:outline-none">
                          <div className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium ${statusClasses(currentEnum)}`}>
                            {label}
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">
                            <div className={`inline-flex items-center px-2 py-1 rounded ${statusClasses('PENDING')}`}>En attente</div>
                          </SelectItem>
                          <SelectItem value="CONFIRMED">
                            <div className={`inline-flex items-center px-2 py-1 rounded ${statusClasses('CONFIRMED')}`}>Confirmé</div>
                          </SelectItem>
                          <SelectItem value="COMPLETED">
                            <div className={`inline-flex items-center px-2 py-1 rounded ${statusClasses('COMPLETED')}`}>Terminé</div>
                          </SelectItem>
                          <SelectItem value="CANCELLED">
                            <div className={`inline-flex items-center px-2 py-1 rounded ${statusClasses('CANCELLED')}`}>Annulé</div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )
                  })()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedReservation(reservation)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Détails de la réservation</DialogTitle>
                          <DialogDescription>Informations complètes de la réservation</DialogDescription>
                        </DialogHeader>
                        {selectedReservation && (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Client</h4>
                              <p>{selectedReservation.client}</p>
                              <p className="text-sm text-gray-500">{selectedReservation.email}</p>
                              <p className="text-sm text-gray-500">{selectedReservation.telephone}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Service</h4>
                              <p>{selectedReservation.service}</p>
                              <p className="text-sm text-gray-500">Durée: {selectedReservation.duree}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Rendez-vous</h4>
                              <p>
                                {new Date(selectedReservation.date).toLocaleDateString("fr-FR")} à{" "}
                                {selectedReservation.heure}
                              </p>
                              <p className="text-sm text-gray-500">Avec {selectedReservation.employe}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Paiement</h4>
                              <p className="font-semibold">{selectedReservation.prix}</p>
                              <p className="text-sm text-gray-500">{selectedReservation.paiement}</p>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(reservation)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => openDelete(reservation.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>

    {/* Confirmation de suppression */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette réservation ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'annulation archive la réservation (elle apparaîtra dans les archives). Vous pourrez la restaurer depuis la page Archives.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Édition simple de réservation (date/heure/employé) */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la réservation</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Client</label>
              <ClientSearch 
                value={editData?.client?.name || ''}
                onChange={() => {}}
                onSelect={(c: any) => setEditData(d => d ? { ...d, client: c ? { id: c.id, name: c.name } : null } : d)} 
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Statut</label>
              <Select value={editData?.status || 'CONFIRMED'} onValueChange={(v) => setEditData(d => d ? { ...d, status: v } : d)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONFIRMED">Confirmé</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="COMPLETED">Terminé</SelectItem>
                  <SelectItem value="CANCELLED">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-1">Date</label>
              <Input type="date" value={editData?.date || ''} onChange={(e) => setEditData(d => d ? { ...d, date: e.target.value } : d)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Heure</label>
              <Input type="time" value={editData?.time || ''} onChange={(e) => setEditData(d => d ? { ...d, time: e.target.value } : d)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Service</label>
              <Select value={editData?.item?.service_id || ''} onValueChange={(v) => {
                const svc = services.find((s: any) => s.id === v)
                setVariants(svc?.service_variants || [])
                setEditData(d => d ? { ...d, item: d.item ? { ...d.item, service_id: v, variant_id: null } : d.item } : d)
              }}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {services.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-1">Variante</label>
              <Select value={editData?.item?.variant_id || ""} onValueChange={(v) => setEditData(d => d ? { ...d, item: d.item ? { ...d.item, variant_id: v } : d.item } : d)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {variants.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-1">Employé (item)</label>
              <Select value={editData?.item?.employee_id ?? "none"} onValueChange={(v) => setEditData(d => d ? { ...d, item: d.item ? { ...d.item, employee_id: v === 'none' ? null : v } : d.item } : d)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {employees.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-1">Durée (minutes)</label>
              <Input type="number" value={editData?.item?.duration_minutes ?? 0} onChange={(e) => setEditData(d => d && d.item ? { ...d, item: { ...d.item, duration_minutes: Number(e.target.value || 0) } } : d)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Prix (DA)</label>
              <Input 
                type="number" 
                step="1" 
                value={editData?.item ? String(Math.floor((editData.item.price_cents || 0)/100)) : ''} 
                onChange={(e) => setEditData(d => d && d.item ? { ...d, item: { ...d.item, price_cents: Math.max(0, Math.floor(Number(e.target.value || 0))) * 100 } } : d)} 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Notes</label>
              <Input value={editData?.notes || ''} onChange={(e) => setEditData(d => d ? { ...d, notes: e.target.value } : d)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Annuler</Button>
            <Button onClick={saveEdit} disabled={savingEdit || !editData?.date || !editData?.time || !editData?.item?.service_id}>{savingEdit ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
