import type React from "react"
import Link from "next/link"
import {
  Calendar,
  Users,
  Settings,
  BarChart3,
  UserCheck,
  Building2,
  TrendingUp,
  CreditCard,
  BookOpen,
  Shield,
  Archive,
} from "lucide-react"

export default function ProLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="p-6">
          <h2 className="text-xl font-bold">Dashboard Pro</h2>
        </div>
        <nav className="mt-6">
          <Link href="/pro/dashboard" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <BarChart3 className="h-5 w-5 mr-3" />
            Tableau de bord
          </Link>
          <Link href="/pro/agenda" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <Calendar className="h-5 w-5 mr-3" />
            Agenda
          </Link>
          <Link href="/pro/reservations" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <BookOpen className="h-5 w-5 mr-3" />
            Réservations
          </Link>
          <Link href="/pro/clients" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <Users className="h-5 w-5 mr-3" />
            Clients
          </Link>
          <Link href="/pro/employes" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <UserCheck className="h-5 w-5 mr-3" />
            Employés
          </Link>
          <Link href="/pro/comptes-employes" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <Shield className="h-5 w-5 mr-3" />
            Comptes Employés
          </Link>
          <Link href="/pro/services" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <Settings className="h-5 w-5 mr-3" />
            Services
          </Link>
          <Link href="/pro/profil-institut" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <Building2 className="h-5 w-5 mr-3" />
            Profil Institut
          </Link>
          <Link href="/pro/statistiques" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <TrendingUp className="h-5 w-5 mr-3" />
            Statistiques
          </Link>
          <Link href="/pro/abonnement" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <CreditCard className="h-5 w-5 mr-3" />
            Mon Abonnement
          </Link>
          <Link href="/pro/archives" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
            <Archive className="h-5 w-5 mr-3" />
            Archives
          </Link>
        </nav>
      </div>

      <div className="ml-64">{children}</div>
    </div>
  )
}
