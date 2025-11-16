"use client";
import React from "react";
import { Building, MapPin, Star, DollarSign, Filter, Plus, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Users, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import Link from "next/link"
import { SalonFormModal } from "@/components/admin/SalonFormModal";
import { SalonDetailModal } from "@/components/admin/SalonDetailModal";
import { ProtectedAdminPage } from "@/components/admin/ProtectedAdminPage";
import { SalonList } from "@/components/admin/SalonList";

export default function AdminSalons() {
  return (
    <ProtectedAdminPage requiredPermission="salons">
      <AdminSalonsContent />
    </ProtectedAdminPage>
  );
}

function AdminSalonsContent() {
  // États pour la recherche et les filtres
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [subscriptionFilter, setSubscriptionFilter] = React.useState("all");
  const [cityFilter, setCityFilter] = React.useState("all");
  const [claimStatusFilter, setClaimStatusFilter] = React.useState("all");
  const [activeTab, setActiveTab] = React.useState("all");
  type Salon = {
    id: string;
    legal_name: string;
    public_name: string;
    description?: string;
    email?: string;
    phone?: string;
    logo_url?: string;
    cover_url?: string;
    status?: string;
    subscription?: string;
    claim_status?: string;
    business_locations?: Array<{ address_line1?: string; cities?: { name?: string } }>;
    [key: string]: any;
  };
  const [salons, setSalons] = React.useState<Salon[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    console.log('Début de la récupération des salons...');
    setError(null);
    setLoading(true);
    
    // Ne pas filtrer par claim_status si on utilise les onglets
    // Les onglets gèrent le filtrage côté client
    fetch(`/api/admin/salons`)
      .then(async (res) => {
        console.log('Réponse reçue, statut:', res.status);
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Erreur de l\'API:', errorText);
          throw new Error(`Erreur HTTP: ${res.status} - ${errorText}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Données reçues de l\'API:', data);
        if (data.success && data.data) {
          setSalons(data.data.salons || []);
        } else {
          console.error('Format de réponse inattendu:', data);
          setError('Format de réponse inattendu de l\'API');
        }
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des salons:', error);
        setError(`Erreur lors du chargement des salons: ${error.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Modals et état salon sélectionné
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedSalon, setSelectedSalon] = React.useState<any | null>(null);

  // Gestionnaire pour le changement de statut d'un salon
  const handleStatusChange = async (salonId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/salons/${salonId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Échec de la mise à jour du statut');
      }
      
      // Mettre à jour l'état local
      setSalons(salons.map(salon => 
        salon.id === salonId ? { ...salon, status: newStatus } : salon
      ));
      
      return true;
    } catch (error: unknown) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
      alert(`Erreur lors de la mise à jour du statut: ${errorMessage}`);
      return false;
    }
  };

  // Gestionnaire pour afficher les détails d'un salon
  const handleViewDetails = (salon: any) => {
    setSelectedSalon(salon);
    setDetailModalOpen(true);
  };

  // Gestionnaire pour éditer un salon
  const handleEditSalon = (salon: any) => {
    setSelectedSalon(salon);
    setEditModalOpen(true);
  };

  // Filtrage et recherche avec gestion des onglets
  const filteredSalons = salons.filter(salon => {
    const matchSearch =
      (salon.public_name?.toLowerCase().includes(search.toLowerCase()) || "") ||
      (salon.legal_name?.toLowerCase().includes(search.toLowerCase()) || "") ||
      (salon.email?.toLowerCase().includes(search.toLowerCase()) || "") ||
      (salon.description?.toLowerCase().includes(search.toLowerCase()) || "");
    const matchStatus = statusFilter === "all" ? true : salon.status === statusFilter;
    const matchSubscription = subscriptionFilter === "all" ? true : (salon.subscription?.toLowerCase() === subscriptionFilter.toLowerCase());
    // city: utilise business_locations[0]?.cities?.name si présent
    const city = salon.business_locations?.[0]?.cities?.name || "";
    const matchCity = cityFilter === "all" ? true : city.toLowerCase() === cityFilter.toLowerCase();
    
    // Filtrage par onglet actif
    let matchTab = true;
    if (activeTab === "available_for_claim") {
      matchTab = salon.claim_status === "none";
    } else if (activeTab === "claimed_approved") {
      matchTab = salon.claim_status === "approved";
    } else if (activeTab === "from_leads") {
      matchTab = salon.claim_status === "not_claimable";
    } else if (activeTab === "pending_claim") {
      matchTab = salon.claim_status === "pending";
    } else if (activeTab === "rejected_claim") {
      matchTab = salon.claim_status === "rejected";
    }
    // "all" affiche tout
    
    return matchSearch && matchStatus && matchSubscription && matchCity && matchTab;
  });

  // Calculer les statistiques par catégorie
  const stats = {
    total: salons.length,
    available_for_claim: salons.filter(s => s.claim_status === "none").length,
    claimed_approved: salons.filter(s => s.claim_status === "approved").length,
    from_leads: salons.filter(s => s.claim_status === "not_claimable").length,
    pending_claim: salons.filter(s => s.claim_status === "pending").length,
    rejected_claim: salons.filter(s => s.claim_status === "rejected").length,
    active: salons.filter(s => s.status === "actif").length,
    pending: salons.filter(s => s.status === "en attente").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "actif":
      case "active":
        return "bg-green-100 text-green-800"
      case "verified":
        return "bg-blue-100 text-blue-800"
      case "en attente":
      case "pending_verification":
        return "bg-orange-100 text-orange-800"
      case "suspendu":
        return "bg-red-100 text-red-800"
      case "inactif":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSubscriptionColor = (subscription: string) => {
    switch (subscription) {
      case "Premium":
        return "bg-yellow-100 text-yellow-800"
      case "Pro":
        return "bg-blue-100 text-blue-800"
      case "Basic":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des salons...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-medium text-red-800">Erreur de chargement</h3>
        <p className="text-red-700 mt-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (salons.length === 0) {
    return (
      <div className="text-center py-12">
        <Building className="h-12 w-12 mx-auto text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Aucun salon trouvé</h3>
        <p className="mt-1 text-gray-500">Aucun salon n'a été trouvé dans la base de données.</p>
        <div className="mt-6">
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un salon
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="bg-white border-b border-gray-200 mb-6">
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-black">Gestion des salons</h1>
              <p className="text-gray-600 mt-1">Surveillez et gérez tous les salons de la plateforme.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
              <Button className="bg-black text-white hover:bg-gray-800" onClick={() => setAddModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter salon
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Building className="h-6 w-6 text-blue-600" />
              <div className="ml-3">
                <p className="text-xl font-bold text-black">{stats.total}</p>
                <p className="text-xs text-gray-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-xs">{stats.available_for_claim}</span>
              </div>
              <div className="ml-3">
                <p className="text-xl font-bold text-black">{stats.available_for_claim}</p>
                <p className="text-xs text-gray-600">Disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div className="ml-3">
                <p className="text-xl font-bold text-black">{stats.claimed_approved}</p>
                <p className="text-xs text-gray-600">Revendiqués</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-6 w-6 text-purple-600" />
              <div className="ml-3">
                <p className="text-xl font-bold text-black">{stats.from_leads}</p>
                <p className="text-xs text-gray-600">Depuis leads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-orange-600" />
              <div className="ml-3">
                <p className="text-xl font-bold text-black">{stats.pending_claim}</p>
                <p className="text-xs text-gray-600">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 text-green-600" />
              <div className="ml-3">
                <p className="text-xl font-bold text-black">
                  {Math.round(salons.reduce((acc, s) => acc + (s.monthlyRevenue || 0), 0) / 1000)}k
                </p>
                <p className="text-xs text-gray-600">Revenus</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher un salon..."
                className="w-full"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="en attente">En attente</SelectItem>
                <SelectItem value="suspendu">Suspendu</SelectItem>
                <SelectItem value="inactif">Inactif</SelectItem>
              </SelectContent>
            </Select>
            <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Abonnement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="Premium">Premium</SelectItem>
                <SelectItem value="Pro">Pro</SelectItem>
                <SelectItem value="Basic">Basic</SelectItem>
              </SelectContent>
            </Select>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Ville" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="Alger">Alger</SelectItem>
                <SelectItem value="Oran">Oran</SelectItem>
                <SelectItem value="Constantine">Constantine</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Onglets pour organiser les salons */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-6">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            Tous ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="available_for_claim" className="text-xs sm:text-sm">
            Disponibles ({stats.available_for_claim})
          </TabsTrigger>
          <TabsTrigger value="claimed_approved" className="text-xs sm:text-sm">
            Revendiqués ({stats.claimed_approved})
          </TabsTrigger>
          <TabsTrigger value="from_leads" className="text-xs sm:text-sm">
            Depuis leads ({stats.from_leads})
          </TabsTrigger>
          <TabsTrigger value="pending_claim" className="text-xs sm:text-sm">
            En attente ({stats.pending_claim})
          </TabsTrigger>
          <TabsTrigger value="rejected_claim" className="text-xs sm:text-sm hidden lg:block">
            Rejetés ({stats.rejected_claim})
          </TabsTrigger>
        </TabsList>

        {/* Contenu des onglets */}
        <TabsContent value="all" className="mt-6">
          <SalonList 
            salons={filteredSalons} 
            loading={loading}
            onStatusChange={handleStatusChange}
            showActions={false}
            showClaimStatus={true}
            onViewDetails={handleViewDetails}
            onEdit={handleEditSalon}
            onDelete={async (salon) => {
              if (window.confirm(`Êtes-vous sûr de vouloir supprimer le salon "${salon.public_name || salon.legal_name}" ?`)) {
                try {
                  const res = await fetch(`/api/admin/salons`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: salon.id }),
                  });
                  const result = await res.json();
                  if (!res.ok) {
                    alert("Erreur: " + (result.error || "Suppression impossible"));
                  } else {
                    const res = await fetch("/api/admin/salons");
                    const data = await res.json();
                    if (data.success && data.data) {
                      setSalons(data.data.salons || []);
                    }
                  }
                } catch (err) {
                  alert("Erreur réseau: " + err);
                }
              }
            }}
          />
        </TabsContent>
        <TabsContent value="available_for_claim" className="mt-6">
          <SalonList 
            salons={filteredSalons.filter(salon => !salon.claim_status || salon.claim_status === 'none')} 
            loading={loading}
            onStatusChange={handleStatusChange}
            showActions={false}
            showClaimStatus={true}
            onViewDetails={handleViewDetails}
            onEdit={handleEditSalon}
            onDelete={async (salon) => {
              if (window.confirm(`Êtes-vous sûr de vouloir supprimer le salon "${salon.public_name || salon.legal_name}" ?`)) {
                try {
                  const res = await fetch(`/api/admin/salons`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: salon.id }),
                  });
                  const result = await res.json();
                  if (!res.ok) {
                    alert("Erreur: " + (result.error || "Suppression impossible"));
                  } else {
                    const res = await fetch("/api/admin/salons");
                    const data = await res.json();
                    if (data.success && data.data) {
                      setSalons(data.data.salons || []);
                    }
                  }
                } catch (err) {
                  alert("Erreur réseau: " + err);
                }
              }
            }}
          />
        </TabsContent>
        <TabsContent value="claimed_approved" className="mt-6">
          <SalonList 
            salons={filteredSalons.filter(salon => salon.claim_status === 'approved')} 
            loading={loading}
            onStatusChange={handleStatusChange}
            showActions={false}
            showClaimStatus={true}
            onViewDetails={handleViewDetails}
            onEdit={handleEditSalon}
            onDelete={async (salon) => {
              if (window.confirm(`Êtes-vous sûr de vouloir supprimer le salon "${salon.public_name || salon.legal_name}" ?`)) {
                try {
                  const res = await fetch(`/api/admin/salons`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: salon.id }),
                  });
                  const result = await res.json();
                  if (!res.ok) {
                    alert("Erreur: " + (result.error || "Suppression impossible"));
                  } else {
                    const res = await fetch("/api/admin/salons");
                    const data = await res.json();
                    if (data.success && data.data) {
                      setSalons(data.data.salons || []);
                    }
                  }
                } catch (err) {
                  alert("Erreur réseau: " + err);
                }
              }
            }}
          />
        </TabsContent>
        <TabsContent value="from_leads" className="mt-6">
          <SalonList 
            salons={filteredSalons.filter(salon => salon.claim_status === 'not_claimable')} 
            loading={loading}
            onStatusChange={handleStatusChange}
            showActions={false}
            showClaimStatus={true}
            onViewDetails={handleViewDetails}
            onEdit={handleEditSalon}
            onDelete={async (salon) => {
              if (window.confirm(`Êtes-vous sûr de vouloir supprimer le salon "${salon.public_name || salon.legal_name}" ?`)) {
                try {
                  const res = await fetch(`/api/admin/salons`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: salon.id }),
                  });
                  const result = await res.json();
                  if (!res.ok) {
                    alert("Erreur: " + (result.error || "Suppression impossible"));
                  } else {
                    const res = await fetch("/api/admin/salons");
                    const data = await res.json();
                    if (data.success && data.data) {
                      setSalons(data.data.salons || []);
                    }
                  }
                } catch (err) {
                  alert("Erreur réseau: " + err);
                }
              }
            }}
          />
        </TabsContent>
        <TabsContent value="pending_claim" className="mt-6">
          <SalonList 
            salons={filteredSalons.filter(salon => salon.claim_status === 'pending')} 
            loading={loading}
            onStatusChange={handleStatusChange}
            showActions={true}
            showClaimStatus={false}
            onViewDetails={handleViewDetails}
            onEdit={handleEditSalon}
            onDelete={async (salon) => {
              if (window.confirm(`Êtes-vous sûr de vouloir supprimer le salon "${salon.public_name || salon.legal_name}" ?`)) {
                try {
                  const res = await fetch(`/api/admin/salons`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: salon.id }),
                  });
                  const result = await res.json();
                  if (!res.ok) {
                    alert("Erreur: " + (result.error || "Suppression impossible"));
                  } else {
                    const res = await fetch("/api/admin/salons");
                    const data = await res.json();
                    if (data.success && data.data) {
                      setSalons(data.data.salons || []);
                    }
                  }
                } catch (err) {
                  alert("Erreur réseau: " + err);
                }
              }
            }}
          />
        </TabsContent>
        <TabsContent value="rejected_claim" className="mt-6">
          <SalonList 
            salons={filteredSalons.filter(salon => salon.claim_status === 'rejected')} 
            loading={loading}
            onStatusChange={handleStatusChange}
            showActions={false}
            showClaimStatus={true}
            onViewDetails={handleViewDetails}
            onEdit={handleEditSalon}
            onDelete={async (salon) => {
              if (window.confirm(`Êtes-vous sûr de vouloir supprimer le salon "${salon.public_name || salon.legal_name}" ?`)) {
                try {
                  const res = await fetch(`/api/admin/salons`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: salon.id }),
                  });
                  const result = await res.json();
                  if (!res.ok) {
                    alert("Erreur: " + (result.error || "Suppression impossible"));
                  } else {
                    const res = await fetch("/api/admin/salons");
                    const data = await res.json();
                    if (data.success && data.data) {
                      setSalons(data.data.salons || []);
                    }
                  }
                } catch (err) {
                  alert("Erreur réseau: " + err);
                }
              }
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Modals CRUD salons */}
      <SalonFormModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={async salon => {
          try {
            const res = await fetch("/api/admin/salons", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(salon),
            });
            const result = await res.json();
            if (!res.ok) {
              const errorMsg = result.error || result.details || "Ajout impossible";
              alert("Erreur: " + errorMsg);
            } else {
              const message = salon.create_for_claim 
                ? "Salon créé avec succès ! Il est maintenant disponible pour la revendication sur la page publique."
                : "Salon ajouté avec succès";
              alert(message);
              setAddModalOpen(false);
              // Recharge la liste
              fetch("/api/admin/salons")
                .then(res => res.json())
                .then(data => {
                  if (data.success && data.data) {
                    setSalons(data.data.salons || []);
                  }
                });
            }
          } catch (err) {
            alert("Erreur réseau: " + err);
          }
        }}
        mode="add"
      />
      {selectedSalon && (
        <SalonFormModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={async salon => {
            // S'assure que les champs requis sont transmis
            const payload = {
              ...selectedSalon,
              ...salon,
              id: selectedSalon.id,
              country_code: salon.country_code ?? selectedSalon.country_code ?? "DZ",
              status: salon.status ?? selectedSalon.status ?? "actif",
              subscription: salon.subscription ?? selectedSalon.subscription ?? "Basic",
            };
            try {
              const res = await fetch("/api/admin/salons", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              const result = await res.json();
              if (!res.ok) {
                alert("Erreur: " + (result.error || "Modification impossible"));
              } else {
                alert("Salon modifié avec succès");
                fetch("/api/admin/salons")
                  .then(res => res.json())
                  .then(data => setSalons(data.salons || []));
              }
            } catch (err) {
              alert("Erreur réseau: " + err);
            }
            setSelectedSalon(null);
          }}
          initialSalon={selectedSalon}
          mode="edit"
        />
      )}
      {selectedSalon && (
        <SalonDetailModal
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          salon={selectedSalon}
        />
      )}
    </div>
  );
}

// Fonction utilitaire pour obtenir la couleur du statut
const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'actif':
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'en attente':
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'suspendu':
    case 'suspended':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Fonction utilitaire pour obtenir la couleur de l'abonnement
const getSubscriptionColor = (subscription: string) => {
  if (!subscription) return 'bg-gray-100 text-gray-800 border-gray-200';
  if (subscription.toLowerCase().includes('premium')) return 'bg-purple-100 text-purple-800 border-purple-200';
  if (subscription.toLowerCase().includes('pro')) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (subscription.toLowerCase().includes('basic')) return 'bg-green-100 text-green-800 border-green-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
};
