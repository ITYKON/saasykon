"use client"

import { useState, useEffect } from "react"
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
import { toast } from "@/hooks/use-toast"

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

// Données réelles récupérées via API

export default function RolesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<any>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [roleDetails, setRoleDetails] = useState<any | null>(null)
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  })
  const [newUserAssignment, setNewUserAssignment] = useState({
    email: "",
    role: "",
  })
  const [roles, setRoles] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editForm, setEditForm] = useState<{ id?: number; name: string; code: string; permissions: string[] }>({
    name: "",
    code: "",
    permissions: [],
  })

  // Charger les rôles depuis l'API
  const fetchRoles = async () => {
    setLoading(true)
    const res = await fetch("/api/admin/roles")
    const data = await res.json()
    setRoles(data.roles || [])
    setLoading(false)
  }
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users")
      const data = await res.json()
      setUsers(Array.isArray(data.users) ? data.users : [])
    } catch {
      setUsers([])
    }
  }
  // Initial fetch
  useEffect(() => { fetchRoles(); fetchUsers() }, [])

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setNewRole((prev) => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter((p) => p !== permissionId),
    }))
  }

  // Filtrage sur la liste réelle
  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Header (match dashboard) */}
      <header className="bg-white border-b border-gray-200 mb-6">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-black">Gestion des rôles</h2>
              <p className="text-gray-600">Gérez les rôles et permissions des utilisateurs de la plateforme.</p>
            </div>
            <div className="flex items-center space-x-3">
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
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.code}>
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
                    <Button
                      onClick={async () => {
                        if (!newUserAssignment.email.trim() || !newUserAssignment.role.trim()) return;
                        try {
                          const res = await fetch("/api/admin/roles/assign", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              email: newUserAssignment.email,
                              roleCode: newUserAssignment.role,
                            }),
                          });

                          if (res.ok) {
                            toast({
                              title: "Rôle assigné",
                              description: "Le rôle a été assigné avec succès.",
                            });
                            setIsAssignDialogOpen(false);
                            setNewUserAssignment({ email: "", role: "" });
                          } else {
                            const data = await res.json().catch(() => ({} as any));
                            if (res.status === 409) {
                              toast({
                                title: "Déjà assigné",
                                description: data?.error || "Ce rôle est déjà assigné à cet utilisateur.",
                              });
                            } else {
                              toast({
                                variant: "destructive",
                                title: "Échec de l'assignation",
                                description: data?.error || "Une erreur est survenue lors de l'assignation du rôle.",
                              });
                            }
                          }
                        } catch (e) {
                          toast({
                            variant: "destructive",
                            title: "Erreur réseau",
                            description: "Vérifiez votre connexion et réessayez.",
                          });
                        }
                      }}
                    >
                      Assigner le rôle
                    </Button>
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
                    <Button
                      onClick={async () => {
                        if (!newRole.name.trim()) return;
                        const res = await fetch("/api/admin/roles", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            name: newRole.name,
                            permissions: newRole.permissions,
                          }),
                        })
                        if (res.ok) {
                          setIsCreateDialogOpen(false)
                          setNewRole({ name: "", description: "", permissions: [] })
                          fetchRoles()
                        }
                      }}
                    >
                      Créer le rôle
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 space-y-6">
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
                  <CardDescription className="mt-1">Code: {role.code}</CardDescription>
                </div>
                <Badge>
                  {role.usersCount ?? 0} utilisateur{(role.usersCount ?? 0) > 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">Permissions ({role.permissions.length})</h4>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 3).map((permId: string) => {
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
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/admin/roles/${role.id}`)
                      const data = await res.json()
                      if (res.ok) {
                        setRoleDetails(data.role)
                        setIsViewDialogOpen(true)
                      } else {
                        toast({ variant: "destructive", title: "Impossible d'afficher", description: data?.error || "Erreur inconnue" })
                      }
                    } catch {
                      toast({ variant: "destructive", title: "Erreur réseau", description: "Réessayez plus tard." })
                    }
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Voir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/admin/roles/${role.id}`)
                      const data = await res.json()
                      if (res.ok) {
                        const r = data.role
                        setEditForm({ id: r.id, name: r.name, code: r.code, permissions: r.permissions || [] })
                        setIsEditDialogOpen(true)
                      } else {
                        toast({ variant: "destructive", title: "Impossible de charger le rôle", description: data?.error || "Erreur inconnue" })
                      }
                    } catch {
                      toast({ variant: "destructive", title: "Erreur réseau", description: "Réessayez plus tard." })
                    }
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 bg-transparent"
                  onClick={async () => {
                    const ok = window.confirm("Supprimer ce rôle ? Cette action est irréversible.")
                    if (!ok) return
                    try {
                      const res = await fetch(`/api/admin/roles?id=${role.id}`, { method: "DELETE" })
                      const data = await res.json().catch(() => ({} as any))
                      if (res.ok) {
                        toast({ title: "Rôle supprimé", description: "Le rôle a été supprimé avec succès." })
                        fetchRoles()
                      } else {
                        toast({ variant: "destructive", title: "Suppression échouée", description: data?.error || "Erreur inconnue" })
                      }
                    } catch {
                      toast({ variant: "destructive", title: "Erreur réseau", description: "Réessayez plus tard." })
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users with Roles Table */
      }
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
                {users.map((user) => {
                  const mainRole = user.user_roles?.[0]?.roles?.name || user.user_roles?.[0]?.roles?.code || "—"
                  return (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-gray-600" />
                        </div>
                        <span className="font-medium">{user.first_name || user.last_name ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : (user.email || "Utilisateur")}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary">{mainRole}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={user.deleted_at ? "secondary" : "default"}>{user.deleted_at ? "Désactivé" : "Actif"}</Badge>
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
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* View Role Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails du rôle</DialogTitle>
            <DialogDescription>Informations sur le rôle sélectionné.</DialogDescription>
          </DialogHeader>
          {roleDetails && (
            <div className="space-y-3">
              <div className="text-sm text-gray-700">Nom: <span className="font-medium text-black">{roleDetails.name}</span></div>
              <div className="text-sm text-gray-700">Code: <span className="font-mono">{roleDetails.code}</span></div>
              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">Permissions ({roleDetails.permissions?.length || 0})</div>
                <div className="flex flex-wrap gap-1">
                  {(roleDetails.permissions || []).map((p: string) => {
                    const perm = permissions.find((x) => x.id === p)
                    return (
                      <Badge key={p} variant="secondary" className="text-xs">{perm?.name || p}</Badge>
                    )
                  })}
                </div>
              </div>
              <div className="text-sm text-gray-700">Utilisateurs: <span className="font-medium text-black">{roleDetails.usersCount ?? 0}</span></div>
          </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>Mettre à jour le nom, le code et les permissions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-role-name">Nom</Label>
                <Input id="edit-role-name" value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-role-code">Code</Label>
                <Input id="edit-role-code" value={editForm.code} onChange={(e) => setEditForm((prev) => ({ ...prev, code: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-base font-medium">Permissions</Label>
              <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                {permissions.map((permission) => (
                  <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={`edit-${permission.id}`}
                      checked={editForm.permissions.includes(permission.id)}
                      onCheckedChange={(checked) =>
                        setEditForm((prev) => ({
                          ...prev,
                          permissions: (checked as boolean)
                            ? [...prev.permissions, permission.id]
                            : prev.permissions.filter((p) => p !== permission.id),
                        }))
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor={`edit-${permission.id}`} className="font-medium cursor-pointer">
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
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Annuler</Button>
            <Button
              onClick={async () => {
                if (!editForm.id) return
                try {
                  const res = await fetch('/api/admin/roles', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editForm.id, name: editForm.name, code: editForm.code, permissions: editForm.permissions }),
                  })
                  const data = await res.json().catch(() => ({} as any))
                  if (res.ok) {
                    toast({ title: 'Rôle mis à jour', description: 'Les modifications ont été enregistrées.' })
                    setIsEditDialogOpen(false)
                    fetchRoles()
                  } else {
                    toast({ variant: 'destructive', title: 'Échec de la mise à jour', description: data?.error || 'Erreur inconnue' })
                  }
                } catch {
                  toast({ variant: 'destructive', title: 'Erreur réseau', description: 'Réessayez plus tard.' })
                }
              }}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
