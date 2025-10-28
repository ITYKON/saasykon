"use client"

import { useState, useEffect } from "react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import CreateReservationModal from "@/components/pro/CreateReservationModal"
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

const getStatusBadge = (status: string) => {
  switch (status) {
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
      return <Badge variant="secondary">{status}</Badge>
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
  
  // Récupérer l'ID de l'entreprise à partir des assignments
  const businessId = auth?.assignments?.[0]?.business_id
  
  // Fonction pour rafraîchir la liste des réservations
  const fetchReservations = async () => {
    if (!businessId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/pro/reservations?business_id=${businessId}`)
      if (!response.ok) throw new Error('Erreur lors du chargement des réservations')
      const data = await response.json()
      setReservations(data.reservations || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Charger les réservations au montage du composant
  useEffect(() => {
    fetchReservations()
  }, [businessId])
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedReservation, setSelectedReservation] = useState<any>(null)

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.employe.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion des réservations</h1>
            <p className="text-gray-600">Gérez toutes les réservations de votre institut.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtres
            </Button>
            
            {businessId && (
              <CreateReservationModal 
                businessId={businessId}
                trigger={
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle réservation
                  </Button>
                }
              />
            )}
            
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="Confirmé">Confirmé</SelectItem>
                  <SelectItem value="En attente">En attente</SelectItem>
                  <SelectItem value="Terminé">Terminé</SelectItem>
                  <SelectItem value="Annulé">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Réservations ({filteredReservations.length})</h2>
        </div>

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
                <TableCell>{getStatusBadge(reservation.status)}</TableCell>
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
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
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
  )
}
