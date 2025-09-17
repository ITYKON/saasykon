"use client"

import { useState } from "react"
import { Search, RotateCcw, Trash2, Users, Building2, Calendar, CreditCard, AlertTriangle } from "lucide-react"
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

const tabs = [
  { id: "utilisateurs", name: "Utilisateurs", icon: Users, count: 12 },
  { id: "salons", name: "Salons", icon: Building2, count: 8 },
  { id: "reservations", name: "Réservations", icon: Calendar, count: 45 },
  { id: "abonnements", name: "Abonnements", icon: CreditCard, count: 6 },
]

const archivedData = {
  utilisateurs: [
    {
      id: 1,
      nom: "Marie Dupont",
      email: "marie.dupont@email.com",
      type: "Client",
      dateSupression: "2025-01-08",
      raisonSupression: "Demande utilisateur",
    },
    {
      id: 2,
      nom: "Jean Martin",
      email: "jean.martin@salon.com",
      type: "Professionnel",
      dateSupression: "2025-01-07",
      raisonSupression: "Violation des conditions",
    },
  ],
  salons: [
    {
      id: 1,
      nom: "Bella Vista",
      proprietaire: "Sarah Benali",
      ville: "Alger",
      dateSupression: "2025-01-06",
      raisonSupression: "Fermeture définitive",
    },
    {
      id: 2,
      nom: "Style & Co",
      proprietaire: "Amina Kaci",
      ville: "Oran",
      dateSupression: "2025-01-05",
      raisonSupression: "Non-conformité",
    },
  ],
  reservations: [
    {
      id: 1,
      client: "Fatima Zohra",
      salon: "PAVANA",
      service: "Coupe + Brushing",
      date: "2025-01-15",
      prix: "2,500 DA",
      dateSupression: "2025-01-08",
      raisonSupression: "Annulation client",
    },
    {
      id: 2,
      client: "Nadia Benaissa",
      salon: "Bella Vista",
      service: "Coloration",
      date: "2025-01-12",
      prix: "4,800 DA",
      dateSupression: "2025-01-07",
      raisonSupression: "Salon fermé",
    },
  ],
  abonnements: [
    {
      id: 1,
      salon: "PAVANA",
      plan: "Premium",
      dateExpiration: "2025-02-15",
      montant: "15,000 DA",
      dateSupression: "2025-01-08",
      raisonSupression: "Rétrogradation",
    },
    {
      id: 2,
      salon: "Style & Co",
      plan: "Pro",
      dateExpiration: "2025-01-30",
      montant: "8,000 DA",
      dateSupression: "2025-01-05",
      raisonSupression: "Salon fermé",
    },
  ],
}

export default function AdminArchivesPage() {
  const [activeTab, setActiveTab] = useState("utilisateurs")
  const [searchTerm, setSearchTerm] = useState("")

  const handleRestore = (type: string, id: number) => {
    console.log(`Restauration ${type} ID: ${id}`)
    // Logique de restauration
  }

  const handlePermanentDelete = (type: string, id: number) => {
    console.log(`Suppression définitive ${type} ID: ${id}`)
    // Logique de suppression définitive
  }

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
        {archivedData.utilisateurs.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div>
                <div className="font-medium">{user.nom}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={user.type === "Client" ? "secondary" : "outline"}>{user.type}</Badge>
            </TableCell>
            <TableCell>{user.dateSupression}</TableCell>
            <TableCell>{user.raisonSupression}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleRestore("utilisateur", user.id)}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4" />
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
                        onClick={() => handlePermanentDelete("utilisateur", user.id)}
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
        {archivedData.salons.map((salon) => (
          <TableRow key={salon.id}>
            <TableCell className="font-medium">{salon.nom}</TableCell>
            <TableCell>{salon.proprietaire}</TableCell>
            <TableCell>{salon.ville}</TableCell>
            <TableCell>{salon.dateSupression}</TableCell>
            <TableCell>{salon.raisonSupression}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleRestore("salon", salon.id)}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4" />
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
                        onClick={() => handlePermanentDelete("salon", salon.id)}
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
        {archivedData.reservations.map((reservation) => (
          <TableRow key={reservation.id}>
            <TableCell className="font-medium">{reservation.client}</TableCell>
            <TableCell>{reservation.salon}</TableCell>
            <TableCell>{reservation.service}</TableCell>
            <TableCell>{reservation.date}</TableCell>
            <TableCell className="font-medium">{reservation.prix}</TableCell>
            <TableCell>{reservation.dateSupression}</TableCell>
            <TableCell>{reservation.raisonSupression}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleRestore("reservation", reservation.id)}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4" />
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
                        onClick={() => handlePermanentDelete("reservation", reservation.id)}
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
        {archivedData.abonnements.map((abonnement) => (
          <TableRow key={abonnement.id}>
            <TableCell className="font-medium">{abonnement.salon}</TableCell>
            <TableCell>
              <Badge variant={abonnement.plan === "Premium" ? "default" : "secondary"}>{abonnement.plan}</Badge>
            </TableCell>
            <TableCell>{abonnement.dateExpiration}</TableCell>
            <TableCell className="font-medium">{abonnement.montant}</TableCell>
            <TableCell>{abonnement.dateSupression}</TableCell>
            <TableCell>{abonnement.raisonSupression}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleRestore("abonnement", abonnement.id)}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4" />
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
                        onClick={() => handlePermanentDelete("abonnement", abonnement.id)}
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
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <div key={tab.id} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{tab.name} archivés</p>
                  <p className="text-2xl font-bold text-gray-900">{tab.count}</p>
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
            {tabs.map((tab) => {
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
                  <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{tab.count}</span>
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
          <div className="border rounded-lg">{renderTable()}</div>
        </div>
      </div>
    </div>
  )
}
