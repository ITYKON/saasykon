"use client";
import { useEffect, useState } from "react";
import {
  Users,
  Building,
  DollarSign,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProtectedAdminPage } from "@/components/admin/ProtectedAdminPage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminDashboard() {
  type GlobalStats = {
    totalSalons: number;
    totalUsers: number;
    monthlyRevenueCents: number;
    activeBookings: number;
  };
  type RecentSalon = {
    id: string;
    name: string;
    owner?: string;
    location?: string;
    status: string;
    subscription?: string;
    joinDate?: string;
  };
  type SystemAlert = {
    id: number;
    type: "warning" | "error" | "success";
    message: string;
    time: string;
  };

  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [recentSalons, setRecentSalons] = useState<RecentSalon[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  // Modal validation sélective
  const [validateOpen, setValidateOpen] = useState(false);
  const [pendingSalons, setPendingSalons] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const r = await fetch("/api/admin/dashboard", { cache: "no-store" });
      if (!r.ok) {
        setGlobalStats(null);
        setRecentSalons([]);
        setSystemAlerts([]);
        return;
      }
      const d = await r.json().catch(() => ({} as any));
      setGlobalStats(d?.globalStats ?? null);
      setRecentSalons(Array.isArray(d?.recentSalons) ? d.recentSalons : []);
      setSystemAlerts(Array.isArray(d?.systemAlerts) ? d.systemAlerts : []);
    } catch {
      setGlobalStats(null);
      setRecentSalons([]);
      setSystemAlerts([]);
    }
  };

  useEffect(() => {
    load()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function openValidateModal() {
    setValidateOpen(true);
    setLoadingPending(true);
    try {
      const res = await fetch(
        "/api/admin/dashboard/actions/validate-pending-salons"
      );
      const data = await res.json();
      setPendingSalons(data.salons || []);
      setSelectedIds([]);
    } catch {
      setPendingSalons([]);
    } finally {
      setLoadingPending(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAll() {
    setSelectedIds(pendingSalons.map((s: any) => s.id));
  }

  function clearAll() {
    setSelectedIds([]);
  }

  async function submitValidation() {
    if (selectedIds.length === 0)
      return alert("Sélectionnez au moins un salon");
    setSubmitting(true);
    try {
      const res = await fetch(
        "/api/admin/dashboard/actions/validate-pending-salons",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedIds }),
        }
      );
      const data = await res.json();
      if (!res.ok) return alert(data?.error || "Action refusée");
      alert(`${data.validated} salon(s) validé(s)`);
      setValidateOpen(false);
      await load();
    } catch {
      alert("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoUsers() {
    window.location.href = "/admin/utilisateurs";
  }

  function handleGoStats() {
    window.location.href = "/admin/statistiques";
  }

  function handleExportFinancials() {
    // Trigger file download by navigating to the GET endpoint
    const url =
      "/api/admin/dashboard/actions/export-financials?period=current-month";
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const formatDA = (cents?: number) => {
    const v = cents ?? 0;
    return new Intl.NumberFormat("fr-DZ").format(Math.round(v / 1)) + " DA";
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        Chargement...
      </div>
    );

  return (
    <ProtectedAdminPage requiredPermission="statistics">
      <div className="px-2 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 mb-4 sm:mb-6 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-black">
                Dashboard Administrateur
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                Vue d'ensemble de la plateforme
              </p>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm lg:text-base w-full sm:w-auto"
              >
                Exporter données
              </Button>
              <Button
                size="sm"
                className="bg-black text-white hover:bg-gray-800 text-xs sm:text-sm lg:text-base w-full sm:w-auto"
              >
                Paramètres système
              </Button>
            </div>
          </div>
        </header>
        {/* Global Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <Building className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div className="ml-2 sm:ml-3">
                  <p className="text-base sm:text-lg font-bold text-black">
                    {globalStats?.totalSalons ?? "--"}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Salons inscrits
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0 mt-1" />
                <div className="ml-2 sm:ml-3">
                  <p className="text-base sm:text-lg font-bold text-black">
                    {globalStats?.totalUsers ?? "--"}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Utilisateurs actifs
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div className="ml-2 sm:ml-3">
                  <p className="text-base sm:text-lg font-bold text-black">
                    {formatDA(globalStats?.monthlyRevenueCents)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Revenus ce mois
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 flex-shrink-0 mt-1" />
                <div className="ml-2 sm:ml-3">
                  <p className="text-base sm:text-lg font-bold text-black">
                    {globalStats?.activeBookings ?? "--"}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">RDV actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Salons */}
          <Card>
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-black">
                Salons récents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-4">
              {recentSalons.map((salon) => (
                <div
                  key={salon.id}
                  className="border border-gray-200 rounded-lg p-3 sm:p-4 text-sm sm:text-base"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-black text-sm sm:text-base">
                        {salon.name}
                      </h3>
                      {salon.owner && (
                        <p className="text-xs sm:text-sm text-gray-600">
                          Par {salon.owner}
                        </p>
                      )}
                      {salon.location && (
                        <p className="text-xs sm:text-sm text-gray-500">
                          {salon.location}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <Badge
                        variant="outline"
                        className={
                          salon.status === "actif"
                            ? "text-green-600 border-green-600"
                            : salon.status === "en attente"
                            ? "text-orange-600 border-orange-600"
                            : "text-red-600 border-red-600"
                        }
                      >
                        {salon.status}
                      </Badge>
                      {salon.subscription && (
                        <p className="text-xs text-gray-600 mt-1">
                          {salon.subscription}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs sm:text-sm text-gray-600">
                    {salon.joinDate && (
                      <span>
                        Inscrit le{" "}
                        {new Date(salon.joinDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex space-x-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent text-xs sm:text-sm h-8 sm:h-9"
                    >
                      Voir détails
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* System Alerts & Quick Actions */}
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-3 sm:p-4 pb-2">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-black">
                  Alertes système
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3 sm:p-4">
                {systemAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg bg-gray-50 text-xs sm:text-sm"
                  >
                    {alert.type === "warning" && (
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    )}
                    {alert.type === "error" && (
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    )}
                    {alert.type === "success" && (
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-black leading-relaxed">
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-500">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-3 sm:p-4 pb-2">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-black">
                  Actions rapides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-4">
                <Button
                  className="w-full bg-black text-white hover:bg-gray-800 text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-4"
                  onClick={openValidateModal}
                >
                  <Building className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Valider les salons en attente
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-black text-black hover:bg-gray-50 bg-transparent text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-4"
                  onClick={handleGoUsers}
                >
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Gérer les utilisateurs
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-black text-black hover:bg-gray-50 bg-transparent text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-4"
                  onClick={handleExportFinancials}
                >
                  <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Rapports financiers
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-black text-black hover:bg-gray-50 bg-transparent text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-4"
                  onClick={handleGoStats}
                >
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Statistiques détaillées
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Modal validation sélective */}
        <Dialog open={validateOpen} onOpenChange={setValidateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sélectionner les salons à valider</DialogTitle>
            </DialogHeader>
            {loadingPending ? (
              <div className="py-6 text-center text-gray-500">Chargement…</div>
            ) : (
              <div className="max-h-80 overflow-auto space-y-2">
                {pendingSalons.map((s: any) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-3 border rounded p-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(s.id)}
                      onChange={() => toggleSelect(s.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-black">
                        {s.public_name || s.legal_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {s.users?.first_name || ""} {s.users?.last_name || ""}{" "}
                        {s.users?.email ? `• ${s.users.email}` : ""}
                      </div>
                    </div>
                  </label>
                ))}
                {pendingSalons.length === 0 && (
                  <div className="py-6 text-center text-gray-500">
                    Aucun salon en attente.
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center justify-between mt-3">
              <div className="space-x-2">
                <Button variant="outline" onClick={selectAll}>
                  Tout sélectionner
                </Button>
                <Button variant="outline" onClick={clearAll}>
                  Tout effacer
                </Button>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setValidateOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={submitValidation}
                  disabled={submitting || selectedIds.length === 0}
                >
                  {submitting ? "Validation…" : "Valider sélection"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedAdminPage>
  );
}
