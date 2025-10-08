'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  Calendar,
  MapPin,
  Star,
  Clock,
  DollarSign,
  UserCheck,
} from "lucide-react"
import { ProtectedAdminPage } from "@/components/admin/ProtectedAdminPage"

// Types de réponse API (résumé)
type StatsResponse = {
  summary: {
    totalRevenueCents: number
    activeUsers: number
    partnerSalons: number
    reservations: number
    conversionRate: number
    averageRating: number
    avgSessionSeconds: number | null
  }
  timeseries: Array<{ key: string; revenueCents: number; activeUsers: number; reservations: number }>
  regions: Array<{ name: string; revenueCents: number; reservations: number }>
  topSalons: Array<{ business_id: string; name: string; revenueCents: number; paymentsCount: number; reservations: number }>
  activity: Array<{ id: string; time: string; event: string; user_id: string | null; business_id: string | null }>
  params: { start: string; end: string; granularity: 'day' | 'month' }
  previousSummary: {
    totalRevenueCents: number
    activeUsers: number
    partnerSalons: number
    reservations: number
    conversionRate: number
    averageRating: number
    avgSessionSeconds: number | null
  }
  deltas: { totalRevenue: number; activeUsers: number; partnerSalons: number; reservations: number; conversionRate: number }
}

export default function AdminStatisticsPage() {
  return (
    <ProtectedAdminPage requiredPermission="statistics">
      <AdminStatisticsPageContent />
    </ProtectedAdminPage>
  );
}

function AdminStatisticsPageContent() {
  const [rangeDays, setRangeDays] = useState<string>('30');
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<StatsResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      try {
        const days = parseInt(rangeDays, 10);
        const granularity = days >= 90 ? 'month' : 'day';
        const res = await fetch(`/api/admin/statistics?range=${days}d&granularity=${granularity}`, { signal: controller.signal });
        const json: StatsResponse = await res.json();
        if (!controller.signal.aborted) setData(json);
      } catch (_) {
        if (!controller.signal.aborted) setData(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [rangeDays]);

  // Dérivations pour les graphiques
  const revenueData = useMemo(() => {
    if (!data?.timeseries) return [] as Array<{ month: string; revenue: number; subscriptions?: number; commissions?: number }>;
    return data.timeseries.map(p => ({
      month: p.key,
      revenue: Math.round((p.revenueCents || 0) / 100),
      subscriptions: 0,
      commissions: 0,
    }));
  }, [data]);

  const userGrowthData = useMemo(() => {
    if (!data?.timeseries) return [] as Array<{ month: string; clients: number; professionnels: number; total: number }>;
    return data.timeseries.map(p => ({ month: p.key, clients: 0, professionnels: 0, total: p.activeUsers }));
  }, [data]);

  const regionData = useMemo(() => {
    if (!data?.regions) return [] as Array<{ region: string; salons?: number; reservations: number; revenue: number }>;
    return data.regions.map(r => ({ region: r.name, reservations: r.reservations, revenue: Math.round(r.revenueCents / 100) }));
  }, [data]);

  const topSalonsData = useMemo(() => {
    if (!data?.topSalons) return [] as Array<{ name: string; reservations: number; revenue: number; rating: number; growth: number }>;
    return data.topSalons.map(s => ({ name: s.name, reservations: s.reservations, revenue: Math.round(s.revenueCents / 100), rating: 0, growth: 0 }));
  }, [data]);

  // Placeholder en attendant un backend abonnements dédié
  const subscriptionData: Array<{ name: string; value: number; color: string }> = [];

  const activityData = useMemo(() => {
    // Agréger par heure de la journée
    const buckets: Record<string, number> = {};
    for (let h = 0; h < 24; h++) buckets[`${String(h).padStart(2, '0')}:00`] = 0;
    (data?.activity || []).forEach(a => {
      const d = new Date(a.time);
      const key = `${String(d.getUTCHours()).padStart(2, '0')}:00`;
      buckets[key] = (buckets[key] || 0) + 1;
    });
    return Object.keys(buckets).map(k => ({ hour: k, reservations: buckets[k] }));
  }, [data]);

  return (
    <div className="space-y-6">
          <div className="space-y-6">
        {/* Header ajusté pour ressembler au dashboard */}
        <header className="bg-white border-b border-gray-200 mb-6">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-black">Statistiques de la plateforme</h2>
                <p className="text-gray-600">Vue d'ensemble complète des performances de Planity</p>
              </div>
              <div className="flex items-center space-x-4">
                <Select value={rangeDays} onValueChange={setRangeDays}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 derniers jours</SelectItem>
                    <SelectItem value="30">30 derniers jours</SelectItem>
                    <SelectItem value="90">3 derniers mois</SelectItem>
                    <SelectItem value="365">12 derniers mois</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">Exporter les données</Button>
              </div>
            </div>
          </div>
        </header>

        {/* KPIs principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenus totaux</p>
                  <p className="text-3xl font-bold text-gray-900">{data ? (Math.round((data.summary.totalRevenueCents || 0) / 100)).toLocaleString() : '--'} DA</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">{data ? `${((data.deltas.totalRevenue || 0) * 100).toFixed(1)}% vs période précédente` : ''}</span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Utilisateurs actifs</p>
                  <p className="text-3xl font-bold text-gray-900">{data ? (data.summary.activeUsers || 0).toLocaleString() : '--'}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-sm text-blue-600">{data ? `${((data.deltas.activeUsers || 0) * 100).toFixed(1)}% vs période précédente` : ''}</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Salons partenaires</p>
                  <p className="text-3xl font-bold text-gray-900">{data ? (data.summary.partnerSalons || 0).toLocaleString() : '--'}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
                    <span className="text-sm text-purple-600">{data ? `${((data.deltas.partnerSalons || 0) * 100).toFixed(1)}% vs période précédente` : ''}</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Réservations</p>
                  <p className="text-3xl font-bold text-gray-900">{data ? (data.summary.reservations || 0).toLocaleString() : '--'}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-orange-500 mr-1" />
                    <span className="text-sm text-orange-600">{data ? `${((data.deltas.reservations || 0) * 100).toFixed(1)}% vs période précédente` : ''}</span>
                  </div>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métriques secondaires */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taux de conversion</p>
                  <p className="text-2xl font-bold text-gray-900">{data ? `${((data.summary.conversionRate || 0) * 100).toFixed(1)}%` : '--'}</p>
                </div>
                <UserCheck className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Note moyenne</p>
                  <p className="text-2xl font-bold text-gray-900">{data ? `${(data.summary.averageRating || 0).toFixed(1)}/5` : '--'}</p>
                </div>
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Temps moyen session</p>
                  <p className="text-2xl font-bold text-gray-900">{data && data.summary.avgSessionSeconds != null ? `${Math.floor(data.summary.avgSessionSeconds/60)}m ${Math.floor(data.summary.avgSessionSeconds%60)}s` : '—'}</p>
                </div>
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="revenus" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="revenus">Revenus</TabsTrigger>
            <TabsTrigger value="utilisateurs">Utilisateurs</TabsTrigger>
            <TabsTrigger value="abonnements">Abonnements</TabsTrigger>
            <TabsTrigger value="regions">Régions</TabsTrigger>
            <TabsTrigger value="salons">Top Salons</TabsTrigger>
            <TabsTrigger value="activite">Activité</TabsTrigger>
          </TabsList>

          <TabsContent value="revenus" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Évolution des revenus</CardTitle>
                <CardDescription>Revenus mensuels par source</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} DA`, ""]} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="utilisateurs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Croissance des utilisateurs</CardTitle>
                <CardDescription>Évolution du nombre d'utilisateurs par type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="abonnements" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Répartition des abonnements</CardTitle>
                  <CardDescription>Distribution par type d'abonnement</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={subscriptionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {subscriptionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Détails des abonnements</CardTitle>
                  <CardDescription>Statistiques par plan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subscriptionData.map((plan) => (
                    <div key={plan.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: plan.color }} />
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-sm text-gray-600">{plan.value}% des salons</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{Math.round((180 * plan.value) / 100)} salons</p>
                        <p className="text-sm text-gray-600">
                          {plan.name === "Basic"
                            ? "2,500 DA/mois"
                            : plan.name === "Pro"
                              ? "5,000 DA/mois"
                              : "8,500 DA/mois"}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="regions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance par région</CardTitle>
                <CardDescription>Activité et revenus par wilaya</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {regionData.map((region) => (
                    <div key={region.region} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{region.region}</p>
                          <p className="text-sm text-gray-600">&nbsp;</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{region.reservations} réservations</p>
                        <p className="text-sm text-gray-600">{region.revenue.toLocaleString()} DA</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salons" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 des salons</CardTitle>
                <CardDescription>Salons les plus performants ce mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topSalonsData.map((salon, index) => (
                    <div key={salon.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{salon.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm text-gray-600">{salon.rating}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{salon.reservations} réservations</p>
                        <p className="text-sm text-gray-600">{salon.revenue.toLocaleString()} DA</p>
                        <div className="flex items-center justify-end mt-1">
                          {salon.growth > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className={`text-sm ${salon.growth > 0 ? "text-green-600" : "text-red-600"}`}>
                            {salon.growth > 0 ? "+" : ""}
                            {salon.growth}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activite" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activité par heure</CardTitle>
                <CardDescription>Répartition des réservations dans la journée</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="reservations" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
