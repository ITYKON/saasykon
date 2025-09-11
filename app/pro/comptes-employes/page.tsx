"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Eye, Edit, Trash2, Shield, User } from "lucide-react"

const professions = [
  { value: "receptionniste", label: "Réceptionniste" },
  { value: "coiffeuse", label: "Coiffeuse" },
  { value: "estheticienne", label: "Esthéticienne" },
  { value: "manucure", label: "Manucure" },
  { value: "masseur", label: "Masseur/Masseuse" },
  { value: "barbier", label: "Barbier" },
  { value: "manager", label: "Manager" },
]

const permissions = [
  { id: "agenda", label: "Agenda", description: "Voir et gérer l'agenda" },
  { id: "reservations", label: "Réservations", description: "Gérer les réservations" },
  { id: "clients", label: "Clients", description: "Accès à la base clients" },
  { id: "services", label: "Services", description: "Gérer les services" },
  { id: "statistiques", label: "Statistiques", description: "Voir les statistiques" },
  { id: "profil", label: "Profil Institut", description: "Modifier le profil" },
  { id: "employes", label: "Employés", description: "Gérer les employés" },
  { id: "facturation", label: "Facturation", description: "Accès à la facturation" },
]

const mockEmployeeAccounts = [
  {
    id: 1,
    nom: "Marie",
    prenom: "Dubois",
    email: "marie.dubois@pavana.dz",
    profession: "Coiffeuse",
    statut: "Actif",
    derniereConnexion: "Il y a 2h",
    permissions: ["agenda", "reservations", "clients"],
  },
  {
    id: 2,
    nom: "Sarah",
    prenom: "Benali",
    email: "sarah.benali@pavana.dz",
    profession: "Esthéticienne",
    statut: "Actif",
    derniereConnexion: "Il y a 1 jour",
    permissions: ["agenda", "reservations", "services"],
  },
  {
    id: 3,
    nom: "Amina",
    prenom: "Khelifi",
    email: "amina.khelifi@pavana.dz",
    profession: "Réceptionniste",
    statut: "Inactif",
    derniereConnexion: "Il y a 5 jours",
    permissions: ["agenda", "reservations", "clients", "facturation"],
  },
]

export default function ComptesEmployesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions([...selectedPermissions, permissionId])
    } else {
      setSelectedPermissions(selectedPermissions.filter((id) => id !== permissionId))
    }
  }

  const filteredAccounts = mockEmployeeAccounts.filter(
    (account) =>
      `${account.prenom} ${account.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.profession.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comptes Employés</h1>
          <p className="text-gray-600">Gérez les comptes et permissions de vos employés</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black hover:bg-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Compte
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un compte employé</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input id="prenom" placeholder="Prénom" />
                </div>
                <div>
                  <Label htmlFor="nom">Nom</Label>
                  <Input id="nom" placeholder="Nom" />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@pavana.dz" />
              </div>

              <div>
                <Label htmlFor="profession">Profession</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une profession" />
                  </SelectTrigger>
                  <SelectContent>
                    {professions.map((profession) => (
                      <SelectItem key={profession.value} value={profession.value}>
                        {profession.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Permissions d'accès</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={permission.id}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor={permission.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.label}
                        </label>
                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Annuler
                </Button>
                <Button className="bg-black hover:bg-gray-800">Créer le compte</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Employés</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Comptes Actifs</p>
                <p className="text-2xl font-bold text-gray-900">6</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Praticiens</p>
                <p className="text-2xl font-bold text-gray-900">5</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Réceptionnistes</p>
                <p className="text-2xl font-bold text-gray-900">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche et filtres */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par nom, email ou profession..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="inactif">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des comptes */}
      <Card>
        <CardHeader>
          <CardTitle>Comptes Employés</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Profession</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {account.prenom} {account.nom}
                      </div>
                      <div className="text-sm text-gray-500">{account.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{account.profession}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={account.statut === "Actif" ? "default" : "secondary"}
                      className={account.statut === "Actif" ? "bg-green-100 text-green-800" : ""}
                    >
                      {account.statut}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {account.permissions.slice(0, 2).map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permissions.find((p) => p.id === permission)?.label}
                        </Badge>
                      ))}
                      {account.permissions.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{account.permissions.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{account.derniereConnexion}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
