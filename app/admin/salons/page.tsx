"use client";
import React from "react";
import { Building, MapPin, Star, DollarSign, Filter, Plus, Eye, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import { SalonFormModal } from "@/components/admin/SalonFormModal";
import { SalonDetailModal } from "@/components/admin/SalonDetailModal";

export default function AdminSalons() {
  // États pour la recherche et les filtres
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [subscriptionFilter, setSubscriptionFilter] = React.useState("all");
  const [cityFilter, setCityFilter] = React.useState("all");
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
    business_locations?: Array<{ address_line1?: string; cities?: { name?: string } }>;
    [key: string]: any;
  };
  const [salons, setSalons] = React.useState<Salon[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/admin/salons")
      .then(res => res.json())
      .then(data => {
        setSalons(data.salons || []);
        setLoading(false);
      });
  }, []);

  // Modals et état salon sélectionné
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedSalon, setSelectedSalon] = React.useState<any | null>(null);

  // Filtrage et recherche
  const filteredSalons = salons.filter(salon => {
    const query = search.toLowerCase();
    const haystacks = [
      salon.public_name ?? "",
      salon.legal_name ?? "",
      salon.email ?? "",
      salon.description ?? "",
    ].map((s) => s.toLowerCase());
    const matchSearch = query.length === 0 ? true : haystacks.some((text) => text.includes(query));
    const matchStatus = statusFilter === "all" ? true : salon.status === statusFilter;
    const matchSubscription = subscriptionFilter === "all" ? true : (salon.subscription?.toLowerCase() === subscriptionFilter.toLowerCase());
    // city: utilise business_locations[0]?.cities?.name si présent
    const city = salon.business_locations?.[0]?.cities?.name || "";
    const matchCity = cityFilter === "all" ? true : city.toLowerCase() === cityFilter.toLowerCase();
    return matchSearch && matchStatus && matchSubscription && matchCity;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "actif":
        return "bg-green-100 text-green-800"
      case "en attente":
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

  return (
    <div className="space-y-6">
            <header className="bg-white border-b border-gray-200 mb-6">
        <div className="px-6 py-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
        <h1 className="text-2xl font-bold text-black">Gestion des salons</h1>
         <p className="text-gray-600 mt-1">Surveillez et gérez toutes les salons de la plateforme.</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-black">{salons.length}</p>
                <p className="text-gray-600">Total salons</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">{salons.filter((s) => s.status === "actif").length}</span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-black">Actifs</p>
                <p className="text-gray-600">Salons actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold">
                  {salons.filter((s) => s.status === "en attente").length}
                </span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-black">En attente</p>
                <p className="text-gray-600">À valider</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-black">
                  {Math.round(salons.reduce((acc, s) => acc + (s.monthlyRevenue || 0), 0) / 1000)}k DA
                </p>
                <p className="text-gray-600">Revenus totaux</p>
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

      {/* Salons List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
  {filteredSalons.map((salon) => (
          <Card key={salon.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48">
              <Image src={salon.logo_url || "/placeholder.svg"} alt={salon.public_name || salon.legal_name} fill className="object-cover" />
              <div className="absolute top-2 right-2 flex gap-2">
                <Badge className={getStatusColor(salon.status || "")}>{salon.status}</Badge>
                <Badge className={getSubscriptionColor(salon.subscription || "")}>{salon.subscription}</Badge>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-black">{salon.public_name || salon.legal_name}</h3>
                  <p className="text-gray-600">Email : {salon.email}</p>
                  <div className="flex items-center text-gray-600 text-sm mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {salon.business_locations?.[0]?.address_line1 || ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                    <span className="font-semibold">{salon.rating}</span>
                  </div>
                  <p className="text-xs text-gray-500">({salon.reviewCount} avis)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-600">RDV total</p>
                  <p className="font-semibold text-black">{salon.totalBookings}</p>
                </div>
                <div>
                  <p className="text-gray-600">Revenus/mois</p>
                  <p className="font-semibold text-black">{(salon.monthlyRevenue ?? 0).toLocaleString()} DA</p>
                </div>
                <div>
                  <p className="text-gray-600">Inscrit le</p>
                  <p className="font-semibold text-black">{salon.joinDate}</p>
                </div>
                <div>
                  <p className="text-gray-600">Dernière activité</p>
                  <p className="font-semibold text-black">{salon.lastActivity}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Services:</p>
                <div className="flex flex-wrap gap-1">
                  {(salon.services ?? []).map((service: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => { setSelectedSalon(salon); setDetailModalOpen(true); }}>
                  <Eye className="h-4 w-4 mr-1" />
                  Voir
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => { setSelectedSalon(salon); setEditModalOpen(true); }}>
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
                {salon.status === "en attente" && (
                  <Button size="sm" className="bg-green-600 text-white hover:bg-green-700">
                    Valider
                  </Button>
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
                          alert("Erreur: " + (result.error || "Suppression impossible"));
                        } else {
                          alert("Salon supprimé");
                          fetch("/api/admin/salons")
                            .then(res => res.json())
                            .then(data => setSalons(data.salons || []));
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
        onSave={async salon => {
          try {
            const res = await fetch("/api/admin/salons", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(salon),
            });
            const result = await res.json();
            if (!res.ok) {
              alert("Erreur: " + (result.error || "Ajout impossible"));
            } else {
              alert("Salon ajouté avec succès");
              // Recharge la liste
              fetch("/api/admin/salons")
                .then(res => res.json())
                .then(data => setSalons(data.salons || []));
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
  )
}
