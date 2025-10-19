"use client";

import { useEffect, useState } from "react";
import {
  Crown,
  Star,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Eye,
  Gift,
  Rocket,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ProtectedAdminPage } from "@/components/admin/ProtectedAdminPage";

export default function AdminAbonnements() {
  return (
    <ProtectedAdminPage requiredPermission="subscriptions">
      <AdminAbonnementsContent />
    </ProtectedAdminPage>
  );
}

type PlanFeature = {
  feature_code: string;
  value: string | null;
};

type Plan = {
  id: number;
  code: string;
  name: string;
  price_cents: number;
  currency: string;
  billing_interval: string;
  trial_days: number | null;
  is_active: boolean;
  features: PlanFeature[];
  subscribers: number;
  revenue: number;
};

function AdminAbonnementsContent() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price_cents: 0,
    trial_days: 0,
    features: "" as string,
  });
  const [submitting, setSubmitting] = useState(false);

  const subscriptionStats = {
    totalRevenue: "5,623,500 DA",
    activeSubscriptions: 1571,
    monthlyGrowth: "+18%",
    churnRate: "1.8%",
  };

  // Charger les plans depuis l'API
  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const res = await fetch("/api/admin/plans");
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error("Erreur lors du chargement des plans:", error);
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(plan: Plan) {
    setSelectedPlan(plan);
    setEditForm({
      name: plan.name,
      price_cents: plan.price_cents,
      trial_days: plan.trial_days || 0,
      features: plan.features.map(f => `${f.feature_code}: ${f.value || "true"}`).join("\n"),
    });
    setEditModalOpen(true);
  }

  async function handleSavePlan() {
    if (!selectedPlan) return;
    setSubmitting(true);

    try {
      // Parser les features depuis le textarea
      const featuresLines = editForm.features.split("\n").filter(l => l.trim());
      const features = featuresLines.map(line => {
        const [feature_code, value] = line.split(":").map(s => s.trim());
        return { feature_code, value: value || null };
      });

      const res = await fetch(`/api/admin/plans/${selectedPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          price_cents: editForm.price_cents,
          trial_days: editForm.trial_days,
          features,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur de mise à jour");
      }

      alert("Plan mis à jour avec succès!");
      setEditModalOpen(false);
      await loadPlans();
    } catch (error: any) {
      alert(error.message || "Erreur lors de la mise à jour");
    } finally {
      setSubmitting(false);
    }
  }

  // Fonction pour obtenir l'icône et la couleur selon le code du plan
  function getPlanIcon(code: string) {
    switch (code) {
      case "decouverte": return { icon: Gift, color: "bg-green-100 text-green-800" };
      case "starter": return { icon: Rocket, color: "bg-blue-100 text-blue-800" };
      case "pro": return { icon: Star, color: "bg-purple-100 text-purple-800" };
      case "business": return { icon: Crown, color: "bg-yellow-100 text-yellow-800" };
      default: return { icon: Package, color: "bg-gray-100 text-gray-800" };
    }
  }

  // Formater le prix en DA
  function formatPrice(amount: number) {
    return new Intl.NumberFormat("fr-DZ").format(amount) + " DA";
  }

  // Formater les features pour l'affichage
  function formatFeatures(features: PlanFeature[]) {
    return features.map(f => {
      const label = f.feature_code.replace(/_/g, " ");
      return f.value && f.value !== "true" ? `${label} (${f.value})` : label;
    });
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full">Chargement...</div>;
  }

  const subscriptionPlans = plans.map(plan => {
    const { icon, color } = getPlanIcon(plan.code);
    return {
      id: plan.id,
      name: plan.name,
      price: `${formatPrice(plan.price_cents)}/mois`,
      color,
      icon,
      features: formatFeatures(plan.features),
      subscribers: plan.subscribers,
      revenue: formatPrice(plan.revenue),
      rawData: plan,
    };
  });

  const allSubscriptions = [
    {
      id: 1,
      salonName: "Beauty Studio Alger",
      owner: "Amina Khelifi",
      email: "amina@beautystudio.dz",
      plan: "Pro",
      status: "Actif",
      startDate: "20 Sept 2025",
      nextBilling: "20 Oct 2025",
      amount: "4,500 DA",
      paymentMethod: "Carte bancaire",
      autoRenewal: true,
    },
    {
      id: 2,
      salonName: "Salon Elegance",
      owner: "Sarah Benali",
      email: "sarah@elegance.dz",
      plan: "Business",
      status: "Actif",
      startDate: "18 Sept 2025",
      nextBilling: "18 Oct 2025",
      amount: "10,000 DA",
      paymentMethod: "Virement",
      autoRenewal: true,
    },
    {
      id: 3,
      salonName: "Coiffure Moderne",
      owner: "Fatima Meziani",
      email: "fatima@moderne.dz",
      plan: "Starter",
      status: "Expiré",
      startDate: "15 Août 2025",
      nextBilling: "15 Sept 2025",
      amount: "2,500 DA",
      paymentMethod: "Carte bancaire",
      autoRenewal: false,
    },
    {
      id: 4,
      salonName: "Spa Wellness",
      owner: "Leila Hamidi",
      email: "leila@spawellness.dz",
      plan: "Pro",
      status: "En attente",
      startDate: "22 Sept 2025",
      nextBilling: "22 Oct 2025",
      amount: "4,500 DA",
      paymentMethod: "Carte bancaire",
      autoRenewal: true,
    },
    {
      id: 5,
      salonName: "Institut Beauté",
      owner: "Nadia Bouali",
      email: "nadia@institut.dz",
      plan: "Découverte",
      status: "Actif",
      startDate: "10 Sept 2025",
      nextBilling: "-",
      amount: "0 DA",
      paymentMethod: "Gratuit",
      autoRenewal: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
    <div className="space-y-6">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 mb-6">
        <div className="px-6 py-4">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">Gestion des abonnements</h1>
              <p className="text-gray-600">Gérez les plans d'abonnement et les revenus de la plateforme.</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" className="flex items-center bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button className="bg-black text-white hover:bg-gray-800 flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau plan
              </Button>
            </div>
          </div>
        </div>
        </div>
</header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-black">{subscriptionStats.totalRevenue}</p>
                  <p className="text-gray-600">Revenus mensuels</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-black">{subscriptionStats.activeSubscriptions}</p>
                  <p className="text-gray-600">Abonnements actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-green-600">{subscriptionStats.monthlyGrowth}</p>
                  <p className="text-gray-600">Croissance mensuelle</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-red-600">{subscriptionStats.churnRate}</p>
                  <p className="text-gray-600">Taux de désabonnement</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subscription Plans */}
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-2xl font-bold text-black">Plans d'abonnement</h2>

            {subscriptionPlans.map((plan) => (
              <Card key={plan.name} className="border-2">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg ${plan.color}`}>
                        <plan.icon className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-bold text-black">{plan.name}</h3>
                        <p className="text-lg font-semibold text-gray-600">{plan.price}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditModal(plan.rawData)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                  </div>

                  <div className="mb-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <div className="w-1.5 h-1.5 bg-black rounded-full mr-3"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-2xl font-bold text-black">{plan.subscribers}</p>
                      <p className="text-sm text-gray-600">Abonnés</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-black">{plan.revenue}</p>
                      <p className="text-sm text-gray-600">Revenus/mois</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl font-bold text-black">Tous les abonnements</CardTitle>
                  <div className="flex space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input placeholder="Rechercher un salon..." className="pl-10 w-64" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-40">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filtrer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="active">Actifs</SelectItem>
                        <SelectItem value="expired">Expirés</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="suspended">Suspendus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Salon</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Prochaine facturation</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allSubscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-black">{subscription.salonName}</p>
                            <p className="text-sm text-gray-600">{subscription.owner}</p>
                            <p className="text-xs text-gray-500">{subscription.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              subscription.plan === "Business"
                                ? "text-yellow-600 border-yellow-600"
                                : subscription.plan === "Pro"
                                  ? "text-purple-600 border-purple-600"
                                  : subscription.plan === "Starter"
                                    ? "text-blue-600 border-blue-600"
                                    : "text-green-600 border-green-600"
                            }
                          >
                            {subscription.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              subscription.status === "Actif"
                                ? "text-green-600 border-green-600"
                                : subscription.status === "Expiré"
                                  ? "text-red-600 border-red-600"
                                  : subscription.status === "En attente"
                                    ? "text-yellow-600 border-yellow-600"
                                    : "text-orange-600 border-orange-600"
                            }
                          >
                            {subscription.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-black">{subscription.amount}</TableCell>
                        <TableCell className="text-sm text-gray-600">{subscription.nextBilling}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {subscription.status === "Expiré" && (
                              <Button size="sm" className="bg-black text-white hover:bg-gray-800">
                                Renouveler
                              </Button>
                            )}
                            {subscription.status === "Suspendu" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 bg-transparent"
                              >
                                Réactiver
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal de modification de plan */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier le plan {selectedPlan?.name}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="plan-name">Nom du plan</Label>
                <Input
                  id="plan-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Nom du plan"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-price">Prix (en DA)</Label>
                  <Input
                    id="plan-price"
                    type="number"
                    value={editForm.price_cents}
                    onChange={(e) => setEditForm({ ...editForm, price_cents: parseInt(e.target.value) || 0 })}
                    placeholder="Ex: 2500 pour 2,500 DA"
                  />
                  <p className="text-xs text-gray-500">
                    Prix actuel: {formatPrice(editForm.price_cents)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan-trial">Jours d'essai</Label>
                  <Input
                    id="plan-trial"
                    type="number"
                    value={editForm.trial_days}
                    onChange={(e) => setEditForm({ ...editForm, trial_days: parseInt(e.target.value) || 0 })}
                    placeholder="Ex: 14"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan-features">Fonctionnalités</Label>
                <Textarea
                  id="plan-features"
                  value={editForm.features}
                  onChange={(e) => setEditForm({ ...editForm, features: e.target.value })}
                  placeholder="Une fonctionnalité par ligne&#10;Format: feature_code: valeur"
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Format: <code>feature_code: valeur</code> (une par ligne)
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSavePlan}
                disabled={submitting}
                className="bg-black text-white hover:bg-gray-800"
              >
                {submitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
