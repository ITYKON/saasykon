"use client";
import React from "react";
import { Users, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { UserDetailModal } from "@/components/admin/UserDetailModal"
import { UserEditModal } from "@/components/admin/UserEditModal"

export default function AdminUtilisateurs() {
  // Modals pour actions rapides
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [activeUser, setActiveUser] = React.useState<any|null>(null);
  // Utilisateurs du backend
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Définition du type utilisateur backend
    interface BackendUser {
      id: number | string;
      first_name?: string;
      last_name?: string;
      email: string;
      phone?: string;
      user_roles?: Array<{
        roles?: {
          code?: string;
        }
      }>;
      status?: string;
      created_at?: string;
      reservations?: number;
      salon?: string;
    }

    fetch("/api/admin/users")
      .then(res => res.json())
      .then(data => {
        // Mappe les utilisateurs du backend vers le format attendu par le front
        const mapped = (data.users || []).map((u: BackendUser) => {
          // Détermine le rôle principal
          let role = "Client";
          let status = u.status || "Actif";
          if (u.user_roles && Array.isArray(u.user_roles) && u.user_roles.length > 0) {
            const mainRole = u.user_roles[0].roles?.code?.toLowerCase();
            if (mainRole === "admin") role = "Admin";
            else if (mainRole === "professionnel" || mainRole === "pro") {
              role = "Professionnel";
              // Par défaut, le professionnel est inactif sauf si explicitement actif
              status = u.status ? u.status : "Inactif";
            }
          }
          return {
            id: u.id,
            name: u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.email,
            email: u.email,
            phone: u.phone,
            role,
            status,
            joinDate: u.created_at ? `Inscrit le ${new Date(u.created_at).toLocaleDateString()}` : "",
            reservations: u.reservations || 0,
            avatar: u.first_name ? u.first_name[0] + (u.last_name ? u.last_name[0] : "") : "U",
            salon: u.salon
          }
        });
        setUsers(mapped);
        setLoading(false);
      });
  }, []);

  async function handleDeleteUser(id: string) {
    if (!window.confirm("Confirmer la suppression de l'utilisateur ?")) return;
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    setUsers(users.filter(u => u.id !== id));
  }

  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string|null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string|null>(null);
  const [selected, setSelected] = React.useState<number[]>([]);

  // Filtrage et recherche
  const filteredUsers = users.filter(u => {
    if (!u || !u.name || !u.email || !u.role || !u.status) return false;
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter ? u.role.toLowerCase() === roleFilter.toLowerCase() : true;
    const matchStatus = statusFilter ? u.status.toLowerCase() === statusFilter : true;
    return matchSearch && matchRole && matchStatus;
  });
  // (bloc dupliqué supprimé)

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-purple-100 text-purple-800"
      case "professionnel":
        return "bg-blue-100 text-blue-800"
      case "client":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "actif":
        return "bg-green-100 text-green-800"
      case "suspendu":
        return "bg-red-100 text-red-800"
      case "inactif":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Filtres et recherche */}
      <div className="flex flex-wrap gap-4 items-center mb-4 px-6">
        <input
          type="text"
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-64"
        />
        <select value={roleFilter ?? ""} onChange={e => setRoleFilter(e.target.value || null)} className="border rounded px-2 py-2">
          <option value="">Tous rôles</option>
          <option value="client">Client</option>
          <option value="professionnel">Professionnel</option>
          <option value="admin">Admin</option>
        </select>
        <select value={statusFilter ?? ""} onChange={e => setStatusFilter(e.target.value || null)} className="border rounded px-2 py-2">
          <option value="">Tous statuts</option>
          <option value="actif">Actif</option>
          <option value="suspendu">Suspendu</option>
          <option value="inactif">Inactif</option>
        </select>
        <Button variant="outline" onClick={() => setSelected(filteredUsers.map(u => u.id))}>Tout sélectionner</Button>
        <Button variant="outline" onClick={() => setSelected([])}>Désélectionner</Button>
        <Button variant="destructive" disabled={selected.length === 0}>Supprimer sélection</Button>
        <Button variant="outline" disabled={selected.length === 0}>Exporter sélection</Button>
      </div>
      {/* Header ajusté pour ressembler au dashboard */}
      <header className="bg-white border-b border-gray-200 mb-6">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-black">Gestion des utilisateurs</h2>
              <p className="text-gray-600">Gérez les clients et professionnels de la plateforme.</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline">Exporter données</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className={`border ${selected.includes(user.id) ? "border-blue-400" : "border-gray-200"}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selected.includes(user.id)}
                    onChange={e => {
                      if (e.target.checked) setSelected([...selected, user.id])
                      else setSelected(selected.filter(id => id !== user.id))
                    }}
                    className="mr-2"
                  />
                  <Avatar className="h-12 w-12 bg-gray-200">
                    <AvatarFallback className="text-gray-600 font-medium">{user.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-black">{user.name}</h3>
                    <p className="text-gray-600">{user.email}</p>
                    {user.salon && <p className="text-sm text-gray-500">{user.salon}</p>}
                    {/* Badge Lead si pro en attente */}
                    {user.role.toLowerCase().includes("professionnel") && user.status.toLowerCase() === "en attente" && (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-400">Lead à contacter</Badge>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="outline" className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                      {/* Badge Inactif pour professionnel inactif, même style que Actif */}
                      {user.role.toLowerCase().includes("professionnel") && user.status.toLowerCase() === "inactif" && (
                        <Badge variant="outline" className={getStatusColor(user.status)}>
                          Inactif
                        </Badge>
                      )}
                      {/* Affiche le badge Actif uniquement si le professionnel est actif */}
                      {user.role.toLowerCase().includes("professionnel") && user.status.toLowerCase() === "actif" && (
                        <Badge variant="outline" className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      )}
                      {/* Les autres rôles affichent le badge statut normalement */}
                      {!user.role.toLowerCase().includes("professionnel") && (
                        <Badge variant="outline" className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <p className="text-sm text-gray-500">{user.joinDate}</p>
                  {user.reservations && <p className="text-sm text-gray-500">{user.reservations} réservations</p>}
                  <div className="flex space-x-2 mt-3">
                    <Button variant="outline" size="sm" className="bg-transparent" title="Voir fiche" onClick={() => { setActiveUser(user); setDetailModalOpen(true); }}>
                      <Users className="h-4 w-4" />
                    </Button>
                    
                    <Button variant="outline" size="sm" className="bg-transparent" title="Modifier" onClick={() => { setActiveUser(user); setEditModalOpen(true); }}>
                      ✏️
                    </Button>
                    <Button variant="destructive" size="sm" className="bg-transparent" title="Supprimer" onClick={() => handleDeleteUser(user.id)}>
                      🗑️
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Modals pour actions rapides */}
      {activeUser && (
        <>
          <UserDetailModal
            open={detailModalOpen}
            onClose={() => setDetailModalOpen(false)}
            user={activeUser}
          />
          <UserEditModal
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            user={activeUser}
            onSave={updatedUser => {
              setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
            }}
          />
        </>
      )}
    </div>
  )
}
