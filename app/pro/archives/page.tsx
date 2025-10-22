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
import { Search, MoreHorizontal, RotateCcw, Trash2, Archive, Users, Calendar, Settings, UserCheck } from "lucide-react"

export default function ArchivesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [archivedEmployees, setArchivedEmployees] = useState<Array<{ id: string; name: string; role: string; email: string | null; status: string }>>([])
  const [loading, setLoading] = useState(false)

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

  useEffect(() => {
    loadArchivedEmployees()
  }, [])

  const archivedReservations = [
    {
      id: 1,
      client: "Emma Rousseau",
      service: "Coupe + Brushing",
      employee: "Sophie Martin",
      date: "2024-01-20",
      time: "14:30",
      price: "2,500 DA",
      deletedDate: "2024-01-18",
      reason: "Annulation client",
    },
    {
      id: 2,
      client: "Thomas Leroy",
      service: "Barbe",
      employee: "Lucas Bernard",
      date: "2024-01-22",
      time: "16:00",
      price: "1,200 DA",
      deletedDate: "2024-01-19",
      reason: "No-show",
    },
  ]

  const archivedServices = [
    {
      id: 1,
      name: "Coloration Fantaisie",
      category: "Coiffure",
      price: "4,500 DA",
      duration: "120 min",
      deletedDate: "2024-01-12",
      deletedBy: "Marie Dupont",
      reason: "Service discontinué",
    },
    {
      id: 2,
      name: "Massage Relaxant",
      category: "Bien-être",
      price: "3,000 DA",
      duration: "60 min",
      deletedDate: "2024-01-08",
      deletedBy: "Marie Dupont",
      reason: "Manque de demande",
    },
  ]

  const archivedAccounts = [
    {
      id: 1,
      name: "Julie Moreau",
      email: "julie.moreau@email.com",
      role: "Esthéticienne",
      permissions: ["Agenda", "Clients"],
      deletedDate: "2024-01-14",
      deletedBy: "Marie Dupont",
      reason: "Changement d'équipe",
    },
  ]

  const handleRestore = (type: string, id: number) => {
    console.log(`Restoring ${type} with id ${id}`)
    // Logic to restore item
  }

  const handlePermanentDelete = (type: string, id: number) => {
    console.log(`Permanently deleting ${type} with id ${id}`)
    // Logic to permanently delete item
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
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/pro/employees/${employee.id}`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ is_active: true }),
                                    })
                                    if (!res.ok) throw new Error("Restauration échouée")
                                    await loadArchivedEmployees()
                                  } catch (e: any) {
                                    alert(e?.message || "Impossible de restaurer")
                                  }
                                }}
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Restaurer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRestore("reservation", reservation.id)}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Restaurer
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Supprimer définitivement
                                </DropdownMenuItem>
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
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRestore("service", service.id)}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Restaurer
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Supprimer définitivement
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer définitivement</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action est irréversible. Le service sera définitivement supprimé.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handlePermanentDelete("service", service.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                          {account.permissions.map((permission, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{account.deletedDate}</TableCell>
                      <TableCell>{account.deletedBy}</TableCell>
                      <TableCell>{account.reason}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRestore("account", account.id)}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Restaurer
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Supprimer définitivement
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer définitivement</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action est irréversible. Le compte sera définitivement supprimé.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handlePermanentDelete("account", account.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
