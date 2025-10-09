"use client";
import { useEffect, useState } from "react";
import { Users, Building, DollarSign, TrendingUp, Calendar, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProtectedAdminPage } from "@/components/admin/ProtectedAdminPage"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export default function AdminDashboard() {
  type GlobalStats = { totalSalons: number; totalUsers: number; monthlyRevenueCents: number; activeBookings: number }
  type RecentSalon = { id: string; name: string; owner?: string; location?: string; status: string; subscription?: string; joinDate?: string }
  type SystemAlert = { id: number; type: "warning" | "error" | "success"; message: string; time: string }

  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null)
  const [recentSalons, setRecentSalons] = useState<RecentSalon[]>([])
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([])
  const [loading, setLoading] = useState(true)
  // Modal validation sélective
  const [validateOpen, setValidateOpen] = useState(false)
  const [pendingSalons, setPendingSalons] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loadingPending, setLoadingPending] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    try {
      const r = await fetch("/api/admin/dashboard", { cache: "no-store" })
      if (!r.ok) {
        setGlobalStats(null)
        setRecentSalons([])
        setSystemAlerts([])
        return
      }
      const d = await r.json().catch(() => ({} as any))
      setGlobalStats(d?.globalStats ?? null)
      setRecentSalons(Array.isArray(d?.recentSalons) ? d.recentSalons : [])
      setSystemAlerts(Array.isArray(d?.systemAlerts) ? d.systemAlerts : [])
    } catch {
      setGlobalStats(null)
      setRecentSalons([])
      setSystemAlerts([])
    }
  }

  useEffect(() => {
    load()
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function openValidateModal() {
    setValidateOpen(true)
    setLoadingPending(true)
    try {
      const res = await fetch("/api/admin/dashboard/actions/validate-pending-salons")
      const data = await res.json()
      setPendingSalons(data.salons || [])
      setSelectedIds([])
    } catch {
      setPendingSalons([])
    } finally {
      setLoadingPending(false)
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function selectAll() {
    setSelectedIds(pendingSalons.map((s: any) => s.id))
  }

  function clearAll() {
    setSelectedIds([])
  }

  async function submitValidation() {
    if (selectedIds.length === 0) return alert("Sélectionnez au moins un salon")
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/dashboard/actions/validate-pending-salons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      })
      const data = await res.json()
      if (!res.ok) return alert(data?.error || "Action refusée")
      alert(`${data.validated} salon(s) validé(s)`)
      setValidateOpen(false)
      await load()
    } catch {
      alert("Erreur réseau")
    } finally {
      setSubmitting(false)
    }
  }

  function handleGoUsers() {
    window.location.href = "/admin/utilisateurs"
  }

  function handleGoStats() {
    window.location.href = "/admin/statistiques"
  }

  function handleExportFinancials() {
    // Trigger file download by navigating to the GET endpoint
    const url = "/api/admin/dashboard/actions/export-financials?period=current-month"
    const a = document.createElement("a")
    a.href = url
    a.download = ""
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const formatDA = (cents?: number) => {
    const v = cents ?? 0
    return new Intl.NumberFormat("fr-DZ").format(Math.round(v / 1)) + " DA"
  }

  if (loading) return <div className="flex items-center justify-center h-full">Chargement...</div>

  return (
    <ProtectedAdminPage requiredPermission="statistics">
      <>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 mb-6">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-black">Dashboard Administrateur</h2>
                <p className="text-gray-600">Vue d'ensemble de la plateforme Planity</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline">Exporter données</Button>
                <Button className="bg-black text-white hover:bg-gray-800">Paramètres système</Button>
              </div>
            </div>
          </div>
        </header>
        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-black">{globalStats?.totalSalons ?? "--"}</p>
                  <p className="text-gray-600">Salons inscrits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-black">{globalStats?.totalUsers ?? "--"}</p>
                  <p className="text-gray-600">Utilisateurs actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-black">{formatDA(globalStats?.monthlyRevenueCents)}</p>
                  <p className="text-gray-600">Revenus ce mois</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-black">{globalStats?.activeBookings ?? "--"}</p>
                  <p className="text-gray-600">RDV actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Salons */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-black">Salons récents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentSalons.map((salon) => (
                <div key={salon.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-black">{salon.name}</h3>
                      {salon.owner && <p className="text-sm text-gray-600">Par {salon.owner}</p>}
                      {salon.location && <p className="text-sm text-gray-500">{salon.location}</p>}
                    </div>
                    <div className="text-right">
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
                        <p className="text-xs text-gray-500 mt-1">{salon.subscription}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm text-gray-600">
                    {salon.joinDate && (
                      <span>Inscrit le {new Date(salon.joinDate).toLocaleDateString()}</span>
                    )}
                  </div>

                  <div className="flex space-x-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
                    >
                      Voir détails
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* System Alerts & Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-black">Alertes système</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {systemAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                    {alert.type === "warning" && <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />}
                    {alert.type === "error" && <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />}
                    {alert.type === "success" && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />}
                    <div className="flex-1">
                      <p className="text-sm text-black">{alert.message}</p>
                      <p className="text-xs text-gray-500">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-black">Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-black text-white hover:bg-gray-800" onClick={openValidateModal}>
                  <Building className="h-4 w-4 mr-2" />
                  Valider les salons en attente
                </Button>

                <Button variant="outline" className="w-full border-black text-black hover:bg-gray-50 bg-transparent" onClick={handleGoUsers}>
                  <Users className="h-4 w-4 mr-2" />
                  Gérer les utilisateurs
                </Button>

                <Button variant="outline" className="w-full border-black text-black hover:bg-gray-50 bg-transparent" onClick={handleExportFinancials}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Rapports financiers
                </Button>

                <Button variant="outline" className="w-full border-black text-black hover:bg-gray-50 bg-transparent" onClick={handleGoStats}>
                  <TrendingUp className="h-4 w-4 mr-2" />
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
                  <label key={s.id} className="flex items-center gap-3 border rounded p-2">
                    <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} />
                    <div className="flex-1">
                      <div className="font-medium text-black">{s.public_name || s.legal_name}</div>
                      <div className="text-xs text-gray-500">{s.users?.first_name || ""} {s.users?.last_name || ""} {s.users?.email ? `• ${s.users.email}` : ""}</div>
                    </div>
                  </label>
                ))}
                {pendingSalons.length === 0 && (
                  <div className="py-6 text-center text-gray-500">Aucun salon en attente.</div>
                )}
              </div>
            )}
            <div className="flex items-center justify-between mt-3">
              <div className="space-x-2">
                <Button variant="outline" onClick={selectAll}>Tout sélectionner</Button>
                <Button variant="outline" onClick={clearAll}>Tout effacer</Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setValidateOpen(false)}>Annuler</Button>
                <Button onClick={submitValidation} disabled={submitting || selectedIds.length === 0}>
                  {submitting ? "Validation…" : "Valider sélection"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </>
    </ProtectedAdminPage>
  )
}
