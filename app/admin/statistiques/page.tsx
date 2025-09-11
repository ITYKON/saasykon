'use client';

import dynamic from 'next/dynamic';

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

const revenueData = [
  { month: "Jan", revenue: 45000, subscriptions: 12000, commissions: 33000 },
  { month: "Fév", revenue: 52000, subscriptions: 14000, commissions: 38000 },
  { month: "Mar", revenue: 48000, subscriptions: 13500, commissions: 34500 },
  { month: "Avr", revenue: 61000, subscriptions: 16000, commissions: 45000 },
  { month: "Mai", revenue: 58000, subscriptions: 15500, commissions: 42500 },
  { month: "Jun", revenue: 67000, subscriptions: 18000, commissions: 49000 },
]

const userGrowthData = [
  { month: "Jan", clients: 1200, professionnels: 180, total: 1380 },
  { month: "Fév", clients: 1450, professionnels: 210, total: 1660 },
  { month: "Mar", clients: 1680, professionnels: 245, total: 1925 },
  { month: "Avr", clients: 1920, professionnels: 280, total: 2200 },
  { month: "Mai", clients: 2150, professionnels: 315, total: 2465 },
  { month: "Jun", clients: 2380, professionnels: 350, total: 2730 },
]

const subscriptionData = [
  { name: "Basic", value: 45, color: "#94a3b8" },
  { name: "Pro", value: 35, color: "#3b82f6" },
  { name: "Premium", value: 20, color: "#1d4ed8" },
]

const regionData = [
  { region: "Alger", salons: 45, reservations: 1250, revenue: 28000 },
  { region: "Oran", salons: 32, reservations: 890, revenue: 19500 },
  { region: "Constantine", salons: 28, reservations: 720, revenue: 16200 },
  { region: "Annaba", salons: 18, reservations: 480, revenue: 11800 },
  { region: "Sétif", salons: 15, reservations: 420, revenue: 9600 },
  { region: "Autres", salons: 42, reservations: 1140, revenue: 24900 },
]

const topSalonsData = [
  { name: "PAVANA", reservations: 156, revenue: 34200, rating: 4.9, growth: 12 },
  { name: "BELLA VISTA", reservations: 142, revenue: 31800, rating: 4.8, growth: 8 },
  { name: "GLAMOUR STUDIO", reservations: 128, revenue: 28600, rating: 4.7, growth: 15 },
  { name: "ELITE BEAUTY", reservations: 115, revenue: 25400, rating: 4.6, growth: -3 },
  { name: "ROYAL SPA", reservations: 98, revenue: 22100, rating: 4.8, growth: 6 },
]

const activityData = [
  { hour: "08:00", reservations: 12 },
  { hour: "09:00", reservations: 28 },
  { hour: "10:00", reservations: 45 },
  { hour: "11:00", reservations: 52 },
  { hour: "12:00", reservations: 38 },
  { hour: "13:00", reservations: 25 },
  { hour: "14:00", reservations: 48 },
  { hour: "15:00", reservations: 65 },
  { hour: "16:00", reservations: 72 },
  { hour: "17:00", reservations: 58 },
  { hour: "18:00", reservations: 42 },
  { hour: "19:00", reservations: 28 },
]

export default function AdminStatisticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Statistiques de la plateforme</h1>
            <p className="text-gray-600 mt-2">Vue d'ensemble complète des performances de Planity</p>
          </div>
          <div className="flex gap-3">
            <Select defaultValue="30">
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
            <Button>Exporter les données</Button>
          </div>
        </div>

        {/* KPIs principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenus totaux</p>
                  <p className="text-3xl font-bold text-gray-900">67,000 DA</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+12.5% vs mois dernier</span>
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
                  <p className="text-3xl font-bold text-gray-900">2,730</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-sm text-blue-600">+8.2% vs mois dernier</span>
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
                  <p className="text-3xl font-bold text-gray-900">180</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
                    <span className="text-sm text-purple-600">+15.3% vs mois dernier</span>
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
                  <p className="text-3xl font-bold text-gray-900">4,900</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-orange-500 mr-1" />
                    <span className="text-sm text-orange-600">+18.7% vs mois dernier</span>
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
                  <p className="text-2xl font-bold text-gray-900">3.2%</p>
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
                  <p className="text-2xl font-bold text-gray-900">4.7/5</p>
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
                  <p className="text-2xl font-bold text-gray-900">12m 34s</p>
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
                    <Area
                      type="monotone"
                      dataKey="subscriptions"
                      stackId="2"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="commissions"
                      stackId="3"
                      stroke="#f59e0b"
                      fill="#f59e0b"
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
                    <Line type="monotone" dataKey="clients" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="professionnels" stroke="#f59e0b" strokeWidth={2} />
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
                          <p className="text-sm text-gray-600">{region.salons} salons partenaires</p>
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
