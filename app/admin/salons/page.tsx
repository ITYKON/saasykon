"use client";
import React from "react";
import {
  Building,
  MapPin,
  Star,
  DollarSign,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { wilayas } from "@/lib/wilayas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import Link from "next/link";
import { SalonFormModal } from "@/components/admin/SalonFormModal";
import { SalonDetailModal } from "@/components/admin/SalonDetailModal";
import { ProtectedAdminPage } from "@/components/admin/ProtectedAdminPage";
import { buildSalonSlug } from "@/lib/salon-slug";

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
    business_locations?: Array<{
      address_line1?: string;
      cities?: { name?: string };
    }>;
    [key: string]: any;
  };
  const [salons, setSalons] = React.useState<Salon[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = React.useState(Date.now());

  React.useEffect(() => {
    console.log("Début de la récupération des salons...");
    setError(null);
    setLoading(true);

    const params = new URLSearchParams();
    if (claimStatusFilter !== "all") {
      params.set("claim_status", claimStatusFilter);
    }
    params.set("pageSize", "100");

    fetch(`/api/admin/salons?${params.toString()}`)
      .then(async (res) => {
        console.log("Réponse reçue, statut:", res.status);
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Erreur de l'API:", errorText);
          throw new Error(`Erreur HTTP: ${res.status} - ${errorText}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Données reçues de l'API:", data);
        if (data.success && data.data) {
          setSalons(data.data.salons || []);
        } else {
          console.error("Format de réponse inattendu:", data);
          setError("Format de réponse inattendu de l'API");
        }
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des salons:", error);
        setError(`Erreur lors du chargement des salons: ${error.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [claimStatusFilter, lastUpdated]);

  // Modals et état salon sélectionné
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedSalon, setSelectedSalon] = React.useState<any | null>(null);

  // Filtrage et recherche
  const filteredSalons = salons.filter((salon) => {
    const matchSearch =
      salon.public_name?.toLowerCase().includes(search.toLowerCase()) ||
      "" ||
      salon.legal_name?.toLowerCase().includes(search.toLowerCase()) ||
      "" ||
      salon.email?.toLowerCase().includes(search.toLowerCase()) ||
      "" ||
      salon.description?.toLowerCase().includes(search.toLowerCase()) ||
      "";
    const matchStatus =
      statusFilter === "all" ? true : salon.status === statusFilter;
    const matchSubscription =
      subscriptionFilter === "all"
        ? true
        : salon.subscription?.toLowerCase() ===
          subscriptionFilter.toLowerCase();
    // city: utilise business_locations[0]?.address_line1 (Wilaya) ou cities?.name si présent
    const city = salon.business_locations?.[0]?.address_line1 || salon.business_locations?.[0]?.cities?.name || "";
    const matchCity =
      cityFilter === "all"
        ? true
        : city.toLowerCase() === cityFilter.toLowerCase();
    return matchSearch && matchStatus && matchSubscription && matchCity;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending_verification":
        return "bg-orange-100 text-orange-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSubscriptionColor = (subscription: string) => {
    switch (subscription) {
      case "Premium":
        return "bg-yellow-100 text-yellow-800";
      case "Pro":
        return "bg-blue-100 text-blue-800";
      case "Basic":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
        <h3 className="text-lg font-medium text-red-800">
          Erreur de chargement
        </h3>
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
        <h3 className="mt-2 text-lg font-medium text-gray-900">
          Aucun salon trouvé
        </h3>
        <p className="mt-1 text-gray-500">
          Aucun salon n'a été trouvé dans la base de données.
        </p>
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
    <div className="space-y-4 sm:space-y-6">
      <header className="bg-white border-b border-gray-200 mb-4 sm:mb-6">
        <div className="px-2 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-black">
                Gestion des salons
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Surveillez et gérez toutes les salons de la plateforme.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              
              <Button
                size="sm"
                className="bg-black text-white hover:bg-gray-800 text-xs sm:text-sm w-full sm:w-auto"
                onClick={() => setAddModalOpen(true)}
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Ajouter salon
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center">
              <Building className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              <div className="ml-3 sm:ml-4">
                <p className="text-lg sm:text-2xl font-bold text-black">
                  {salons.length}
                </p>
                <p className="text-sm sm:text-base text-gray-600">
                  Total salons
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center">
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-bold text-sm sm:text-base">
                  {salons.filter((s) => s.status === "active").length}
                </span>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-lg sm:text-2xl font-bold text-black">
                  Actifs
                </p>
                <p className="text-sm sm:text-base text-gray-600">
                  Salons actifs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center">
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 font-bold text-sm sm:text-base">
                  {salons.filter((s) => s.status === "pending_verification").length}
                </span>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-lg sm:text-2xl font-bold text-black">
                  En attente
                </p>
                <p className="text-sm sm:text-base text-gray-600">À valider</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
              <div className="ml-3 sm:ml-4">
                <p className="text-lg sm:text-2xl font-bold text-black">
                  {Math.round(
                    salons.reduce(
                      (acc, s) => acc + (s.monthlyRevenue || 0),
                      0
                    ) / 1000
                  )}
                  k DA
                </p>
                <p className="text-sm sm:text-base text-gray-600">
                  Revenus totaux
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher un salon..."
                className="w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="pending_verification">En attente</SelectItem>
                <SelectItem value="suspended">Suspendu</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={subscriptionFilter}
              onValueChange={setSubscriptionFilter}
            >
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
                {wilayas.map((wilaya) => (
                  <SelectItem key={wilaya} value={wilaya}>
                    {wilaya}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={claimStatusFilter}
              onValueChange={setClaimStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Revendication" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="none">
                  Disponible pour revendication
                </SelectItem>
                <SelectItem value="pending">
                  Revendication en attente
                </SelectItem>
                <SelectItem value="approved">Revendiqué</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Salons List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredSalons.map((salon) => (
          <Card
            key={salon.id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative bg-gray-100 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Building className="h-6 w-6 text-gray-500" />
                <h3 className="text-lg font-semibold">
                  {salon.public_name || salon.legal_name}
                </h3>
              </div>
              <div className="flex gap-2">
                <Badge className={getStatusColor(salon.status || "")}>
                  {salon.status}
                </Badge>
                <Badge
                  className={getSubscriptionColor(salon.subscription || "")}
                >
                  {salon.subscription}
                </Badge>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="pt-4">
                {salon.claim_status === "none" && (
                  <div className="mb-3">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                      Disponible pour revendication
                    </Badge>
                  </div>
                )}
                <p className="text-gray-600">Email : {salon.email}</p>
                <div className="flex items-center text-gray-600 text-sm mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {salon.business_locations?.[0]?.address_line1 || ""}
                </div>
              </div>
              <div className="text-right">
                

              </div>
              {/* </div> */}

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-600">RDV total</p>
                  <p className="font-semibold text-black">
                    {salon.totalBookings}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Revenus/mois</p>
                  <p className="font-semibold text-black">
                    {(salon.monthlyRevenue ?? 0).toLocaleString()} DA
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Inscrit le</p>
                  <p className="font-semibold text-black">{salon.joinDate}</p>
                </div>
                <div>
                  <p className="text-gray-600">Dernière activité</p>
                  <p className="font-semibold text-black">
                    {salon.lastActivity}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Services:</p>
                <div className="flex flex-wrap gap-1">
                  {(
                    (salon.services ?? [])
                      .map((s: any) => (typeof s === "string" ? s : s?.name))
                      .filter(Boolean) as string[]
                  ).map((name: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => {
                    setSelectedSalon(salon);
                    setDetailModalOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Voir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => {
                    setSelectedSalon(salon);
                    setEditModalOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
                {salon.status === "en attente" && (
                  <Button
                    size="sm"
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    Valider
                  </Button>
                )}
                {salon.claim_status === "none" && (
                  <Link
                    href={`/salon/${buildSalonSlug(
                      salon.public_name || salon.legal_name || "",
                      salon.id,
                      salon.business_locations?.[0]?.cities?.name || null
                    )}`}
                    target="_blank"
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                    >
                      Voir page publique
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                  onClick={async () => {
                    if (window.confirm("Confirmer la suppression ?")) {
                      try {
                        const res = await fetch("/api/admin/salons", {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: salon.id }),
                        });
                        const result = await res.json();
                        if (!res.ok) {
                          alert(
                            "Erreur: " +
                              (result.error || "Suppression impossible")
                          );
                        } else {
                          alert("Salon supprimé");
                          const params = new URLSearchParams();
                          if (claimStatusFilter !== "all") {
                            params.set("claim_status", claimStatusFilter);
                          }
                          fetch(`/api/admin/salons?${params.toString()}`)
                            .then((res) => res.json())
                            .then((data) => {
                              if (data.success && data.data) {
                                setSalons(data.data.salons || []);
                              }
                            });
                        }
                      } catch (err) {
                        alert("Erreur réseau: " + err);
                      }
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

      {/* Modals CRUD salons */}
      <SalonFormModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={async (salon) => {
          try {
            const res = await fetch("/api/admin/salons", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(salon),
            });
            const result = await res.json();
            if (!res.ok) {
              const errorMsg =
                result.error || result.details || "Ajout impossible";
              throw new Error(errorMsg);
            } else {
                setLastUpdated(Date.now());
              }
            } catch (err) {
              console.error("Erreur réseau: " + err);
              throw err; // Propagate to modal
            }
          }}
          mode="add"
        />
        {selectedSalon && (
          <SalonFormModal
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            onSave={async (salon) => {
              // S'assure que les champs requis sont transmis
              const payload = {
                ...selectedSalon,
                ...salon,
                id: selectedSalon.id,
                country_code:
                  salon.country_code ?? selectedSalon.country_code ?? "DZ",
                status: salon.status ?? selectedSalon.status ?? "active",
                subscription:
                  salon.subscription ?? selectedSalon.subscription ?? "Basic",
              };
              try {
                const res = await fetch("/api/admin/salons", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                const result = await res.json();
                if (!res.ok) {
                   throw new Error(result.error || "Modification impossible");
                } else {
                  setLastUpdated(Date.now());
                }
              } catch (err) {
                console.error("Erreur réseau: " + err);
                throw err;
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
