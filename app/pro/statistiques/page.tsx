"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Users, Calendar, DollarSign, Star, Target, Download } from "lucide-react"
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
  const [period, setPeriod] = useState("6months")

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
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>
                </div>
        </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
                <p className="text-2xl font-bold">348,000 DA</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5% vs mois dernier
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
                <p className="text-2xl font-bold">892</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8.3% vs mois dernier
                </p>
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
                <p className="text-sm font-medium text-gray-600">Taux d'occupation</p>
                <p className="text-2xl font-bold">87%</p>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -2.1% vs mois dernier
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Note moyenne</p>
                <p className="text-2xl font-bold">4.8</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <Star className="h-3 w-3 mr-1" />
                  +0.2 vs mois dernier
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="schedule">Horaires</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Évolution du chiffre d'affaires</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} DA`, "Chiffre d'affaires"]} />
                    <Area type="monotone" dataKey="revenue" stroke="#000000" fill="#000000" fillOpacity={0.1} />
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
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={servicesData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {servicesData.map((entry, index) => (
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
                <CardTitle>Services les plus populaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {servicesData.map((service, index) => (
                    <div key={service.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: service.color }} />
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{service.value}%</p>
                        <p className="text-sm text-gray-500">{Math.round(service.value * 8.92)} réservations</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Répartition des réservations par heure</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#000000" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 des clients fidèles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topClients.map((client, index) => (
                  <div key={client.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-gray-500">Dernière visite: {client.lastVisit}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{client.revenue.toLocaleString()} DA</p>
                      <p className="text-sm text-gray-500">{client.visits} visites</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
