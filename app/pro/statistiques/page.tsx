"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Users, Calendar, DollarSign, Star, Target, Loader2 } from "lucide-react"

interface ServiceStat {
  name: string
  count: number
  revenue: number
}

interface EmployeeStat {
  name: string
  count: number
  revenue: number
}

interface DailyStat {
  date: string
  count: number
  revenue: number
}

interface RecentAppointment {
  id: string
  customerName: string
  date: string
  time: string
  services: string
  status: string
  total: number
}

interface StatisticsData {
  overview: {
    totalAppointments: number
    completedAppointments: number
    cancelledAppointments: number
    noShowAppointments: number
    totalRevenue: number
    averageRevenuePerAppointment: number
  }
  dailyStats: DailyStat[]
  serviceStats: ServiceStat[]
  employeeStats: EmployeeStat[]
  recentAppointments: RecentAppointment[]
}
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const revenueData = [
  { month: "Jan", revenue: 45000, bookings: 120 },
  { month: "Fév", revenue: 52000, bookings: 140 },
  { month: "Mar", revenue: 48000, bookings: 130 },
  { month: "Avr", revenue: 61000, bookings: 165 },
  { month: "Mai", revenue: 55000, bookings: 150 },
  { month: "Jun", revenue: 67000, bookings: 180 },
]

const servicesData = [
  { name: "Coupe", value: 35, color: "#000000" },
  { name: "Coloration", value: 25, color: "#404040" },
  { name: "Brushing", value: 20, color: "#808080" },
  { name: "Soins", value: 15, color: "#C0C0C0" },
  { name: "Autres", value: 5, color: "#E0E0E0" },
]

const hourlyData = [
  { hour: "9h", bookings: 5 },
  { hour: "10h", bookings: 12 },
  { hour: "11h", bookings: 18 },
  { hour: "12h", bookings: 8 },
  { hour: "13h", bookings: 3 },
  { hour: "14h", bookings: 15 },
  { hour: "15h", bookings: 22 },
  { hour: "16h", bookings: 25 },
  { hour: "17h", bookings: 20 },
  { hour: "18h", bookings: 12 },
]

const topClients = [
  { name: "Marie Dupont", visits: 24, revenue: 4800, lastVisit: "2 jours" },
  { name: "Sarah Benali", visits: 18, revenue: 3600, lastVisit: "1 semaine" },
  { name: "Amina Khelifi", visits: 15, revenue: 3000, lastVisit: "3 jours" },
  { name: "Fatima Ouali", visits: 12, revenue: 2400, lastVisit: "5 jours" },
  { name: "Leila Mansouri", visits: 10, revenue: 2000, lastVisit: "1 semaine" },
]

export default function StatistiquesPage() {
  const [period, setPeriod] = useState("1month")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<StatisticsData | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {

        setIsLoading(true)
        setError(null)
        
        const response = await fetch('/api/pro/dashboard/statistics')
        const data = await response.json()
        

        
        if (!response.ok) {
          const errorMessage = data?.error || 'Erreur inconnue'
          const errorDetails = data?.details || ''
          console.error('Erreur API:', { status: response.status, errorMessage, errorDetails })
          throw new Error(`${errorMessage}${errorDetails ? ` (${errorDetails})` : ''}`)
        }
        
        if (!data) {
          throw new Error('Aucune donnée reçue du serveur')
        }
        

        
        setStats(data)
      } catch (err) {
        console.error('Erreur lors de la récupération des statistiques:', err)
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [period])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(amount) + ' DA'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2">Chargement des statistiques...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erreur lors du chargement des statistiques</strong>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-sm">
            Veuillez rafraîchir la page ou réessayer plus tard. Si le problème persiste, contactez le support.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 font-medium py-1 px-3 rounded text-sm"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <p>Aucune donnée statistique disponible pour le moment.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium py-1 px-3 rounded text-sm"
          >
            Actualiser
          </button>
        </div>
      </div>
    )
  }

  const { overview, dailyStats, serviceStats, employeeStats, recentAppointments } = stats

  // Formatage des données pour les graphiques
  const chartData = dailyStats.map(day => ({
    date: new Date(day.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    revenue: day.revenue,
    count: day.count
  }))

  const serviceChartData = serviceStats.map(service => ({
    name: service.name,
    value: service.count,
    revenue: service.revenue,
    color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
  }))

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Statistiques Avancées</h1>
              <p className="text-gray-600">Analysez les performances de votre institut</p>
            </div>
            <div className="flex gap-3">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">1 mois</SelectItem>
                  <SelectItem value="3months">3 mois</SelectItem>
                  <SelectItem value="6months">6 mois</SelectItem>
                  <SelectItem value="1year">1 an</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>
<div className="px-6 py-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
                <p className="text-2xl font-bold">{formatCurrency(overview.totalRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {overview.completedAppointments} réservations
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Réservations</p>
                <p className="text-2xl font-bold">{overview.totalAppointments}</p>
                <div className="flex gap-2 text-xs mt-1">
                  <span className="text-green-600">✓ {overview.completedAppointments} terminées</span>
                  <span className="text-red-600">✗ {overview.cancelledAppointments + overview.noShowAppointments} annulées</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Moyenne par réservation</p>
                <p className="text-2xl font-bold">{formatCurrency(overview.averageRevenuePerAppointment)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {overview.completedAppointments} réservations terminées
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taux d'occupation</p>
                <p className="text-2xl font-bold">
                  {Math.round((overview.completedAppointments / Math.max(1, overview.totalAppointments)) * 100)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {overview.completedAppointments} / {overview.totalAppointments} réservations
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="clients">Dernières réservations</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Évolution du chiffre d'affaires</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'revenue') {
                          return [formatCurrency(Number(value)), "Chiffre d'affaires"]
                        }
                        return [value, 'Nombre de réservations']
                      }}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      name="Chiffre d'affaires"
                      stroke="#000000" 
                      fill="#000000" 
                      fillOpacity={0.1} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      name="Réservations"
                      stroke="#8884d8" 
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nombre de réservations</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="bookings" stroke="#000000" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  {serviceChartData.length > 0 ? (
                    <PieChart width={300} height={300}>
                      <Pie
                        data={serviceChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {serviceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => {
                          if (props && props.payload) {
                            const data = props.payload as any
                            return [
                              `${data.revenue ? formatCurrency(data.revenue) : value}`, 
                              data.name
                            ]
                          }
                          return [value, name]
                        }} 
                      />
                    </PieChart>
                  ) : (
                    <div className="text-gray-500">Aucune donnée de service disponible</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top services par revenu</CardTitle>
              </CardHeader>
              <CardContent>
                {serviceChartData.length > 0 ? (
                  <div className="space-y-4">
                    {serviceChartData
                      .sort((a, b) => b.revenue - a.revenue)
                      .slice(0, 5)
                      .map((service) => (
                        <div key={service.name} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{service.name}</p>
                            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-black" 
                                style={{ 
                                  width: `${(service.revenue / Math.max(1, serviceChartData.reduce((a, b) => a + b.revenue, 0))) * 100}%` 
                                }}
                              />
                            </div>
                          </div>
                          <p className="ml-4 font-medium">{formatCurrency(service.revenue)}</p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-gray-500">Aucun service avec revenu disponible</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dernières réservations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAppointments.length > 0 ? (
                  recentAppointments.map((appointment) => (
                    <div 
                      key={appointment.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{appointment.customerName}</p>
                        <p className="text-sm text-gray-500">
                          {appointment.date} à {appointment.time} • {appointment.services}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(appointment.total)}</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          appointment.status === 'COMPLETED' 
                            ? 'bg-green-100 text-green-800' 
                            : appointment.status === 'CANCELLED' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status === 'COMPLETED' ? 'Terminé' : 
                           appointment.status === 'CANCELLED' ? 'Annulé' : 'À venir'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Aucune réservation récente
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
