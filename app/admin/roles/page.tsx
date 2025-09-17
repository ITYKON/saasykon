"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, Shield, Users, Eye } from "lucide-react"

const permissions = [
  { id: "dashboard", name: "Dashboard", description: "Accès au tableau de bord principal" },
  { id: "users", name: "Gestion des utilisateurs", description: "Voir et gérer les utilisateurs" },
  { id: "salons", name: "Gestion des salons", description: "Voir et gérer les salons partenaires" },
  { id: "reservations", name: "Gestion des réservations", description: "Voir et gérer toutes les réservations" },
  { id: "subscriptions", name: "Gestion des abonnements", description: "Voir et gérer les abonnements" },
  { id: "statistics", name: "Statistiques avancées", description: "Accès aux statistiques détaillées" },
  { id: "roles", name: "Gestion des rôles", description: "Créer et modifier les rôles utilisateurs" },
  { id: "settings", name: "Paramètres système", description: "Modifier les paramètres de la plateforme" },
]

const mockRoles = [
  {
    id: 1,
    name: "Super Admin",
    description: "Accès complet à toutes les fonctionnalités",
    permissions: permissions.map((p) => p.id),
    users: 2,
    color: "bg-red-100 text-red-800",
  },
  {
    id: 2,
    name: "Gestionnaire",
    description: "Gestion des salons et utilisateurs",
    permissions: ["dashboard", "users", "salons", "reservations", "statistics"],
    users: 5,
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: 3,
    name: "Support",
    description: "Support client et gestion des réservations",
    permissions: ["dashboard", "users", "reservations"],
    users: 8,
    color: "bg-green-100 text-green-800",
  },
  {
    id: 4,
    name: "Analyste",
    description: "Accès aux statistiques et rapports",
    permissions: ["dashboard", "statistics"],
    users: 3,
    color: "bg-purple-100 text-purple-800",
  },
]

const mockUsers = [
  { id: 1, name: "Admin Principal", email: "admin@planity.com", role: "Super Admin", status: "Actif" },
  { id: 2, name: "Marie Gestionnaire", email: "marie@planity.com", role: "Gestionnaire", status: "Actif" },
  { id: 3, name: "Support Client", email: "support@planity.com", role: "Support", status: "Actif" },
]

export default function RolesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<any>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  })
  const [newUserAssignment, setNewUserAssignment] = useState({
    email: "",
    role: "",
  })

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setNewRole((prev) => ({
        ...prev,
        permissions: [...prev.permissions, permissionId],
      }))
    } else {
      setNewRole((prev) => ({
        ...prev,
        permissions: prev.permissions.filter((p) => p !== permissionId),
      }))
    }
  }

  const filteredRoles = mockRoles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des rôles</h1>
          <p className="text-gray-600">Gérez les rôles et permissions des utilisateurs de la plateforme.</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Assigner un rôle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assigner un rôle à un utilisateur</DialogTitle>
                <DialogDescription>
                  Attribuez un rôle à un utilisateur existant ou créez un nouvel utilisateur.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user-email">Email de l'utilisateur</Label>
                  <Input
                    id="user-email"
                    placeholder="utilisateur@email.com"
                    value={newUserAssignment.email}
                    onChange={(e) => setNewUserAssignment((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="user-role">Rôle</Label>
                  <Select
                    value={newUserAssignment.role}
                    onValueChange={(value) => setNewUserAssignment((prev) => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockRoles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={() => setIsAssignDialogOpen(false)}>Assigner le rôle</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau rôle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un nouveau rôle</DialogTitle>
                <DialogDescription>Définissez les permissions et accès pour ce nouveau rôle.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role-name">Nom du rôle</Label>
                    <Input
                      id="role-name"
                      placeholder="Ex: Gestionnaire de salon"
                      value={newRole.name}
                      onChange={(e) => setNewRole((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role-description">Description</Label>
                    <Input
                      id="role-description"
                      placeholder="Description du rôle"
                      value={newRole.description}
                      onChange={(e) => setNewRole((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Permissions</Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Sélectionnez les interfaces auxquelles ce rôle aura accès.
                  </p>
                  <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={permission.id}
                          checked={newRole.permissions.includes(permission.id)}
                          onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={permission.id} className="font-medium cursor-pointer">
                            {permission.name}
                          </Label>
                          <p className="text-sm text-gray-600">{permission.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(false)}>Créer le rôle</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher un rôle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => (
          <Card key={role.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                  <CardDescription className="mt-1">{role.description}</CardDescription>
                </div>
                <Badge className={role.color}>
                  {role.users} utilisateur{role.users > 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">Permissions ({role.permissions.length})</h4>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 3).map((permId) => {
                    const perm = permissions.find((p) => p.id === permId)
                    return (
                      <Badge key={permId} variant="secondary" className="text-xs">
                        {perm?.name}
                      </Badge>
                    )
                  })}
                  {role.permissions.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{role.permissions.length - 3} autres
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Eye className="h-4 w-4 mr-1" />
                  Voir
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users with Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Utilisateurs et leurs rôles
          </CardTitle>
          <CardDescription>Vue d'ensemble des utilisateurs et de leurs rôles assignés.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Utilisateur</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Rôle</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Statut</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-gray-600" />
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <Badge className={mockRoles.find((r) => r.name === user.role)?.color}>{user.role}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={user.status === "Actif" ? "default" : "secondary"}>{user.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
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
  )
}
