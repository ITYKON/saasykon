'use client' // Add this at the top to mark this as a Client Component
import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  const pathname = usePathname()
  const linkBase = "flex items-center px-6 py-3 rounded-lg font-medium transition-colors"
  const inactive = "text-gray-700 hover:bg-gray-100"
  const active = "bg-gray-100 text-gray-900"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg border-r h-screen overflow-y-auto z-30">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">PLANITY PRO</h2>
        </div>
        <nav className="mt-4 px-2 space-y-1">
          <Link href="/pro/dashboard" className={`${linkBase} ${pathname === "/pro/dashboard" ? active : inactive}`}>
            <BarChart3 className="h-5 w-5 mr-3" />
            Tableau de bord
          </Link>
          <Link href="/pro/agenda" className={`${linkBase} ${pathname?.startsWith("/pro/agenda") ? active : inactive}`}>
            <Calendar className="h-5 w-5 mr-3" />
            Agenda
          </Link>
          <Link href="/pro/reservations" className={`${linkBase} ${pathname?.startsWith("/pro/reservations") ? active : inactive}`}>
            <BookOpen className="h-5 w-5 mr-3" />
            Réservations
          </Link>
          <Link href="/pro/clients" className={`${linkBase} ${pathname?.startsWith("/pro/clients") ? active : inactive}`}>
            <Users className="h-5 w-5 mr-3" />
            Clients
          </Link>
          <Link href="/pro/employes" className={`${linkBase} ${pathname?.startsWith("/pro/employes") ? active : inactive}`}>
            <UserCheck className="h-5 w-5 mr-3" />
            Employés
          </Link>
          <Link href="/pro/comptes-employes" className={`${linkBase} ${pathname?.startsWith("/pro/comptes-employes") ? active : inactive}`}>
            <Shield className="h-5 w-5 mr-3" />
            Comptes Employés
          </Link>
          <Link href="/pro/services" className={`${linkBase} ${pathname?.startsWith("/pro/services") ? active : inactive}`}>
            <Settings className="h-5 w-5 mr-3" />
            Services
          </Link>
          <Link href="/pro/profil-institut" className={`${linkBase} ${pathname?.startsWith("/pro/profil-institut") ? active : inactive}`}>
            <Building2 className="h-5 w-5 mr-3" />
            Profil Institut
          </Link>
          <Link href="/pro/statistiques" className={`${linkBase} ${pathname?.startsWith("/pro/statistiques") ? active : inactive}`}>
            <TrendingUp className="h-5 w-5 mr-3" />
            Statistiques
          </Link>
          <Link href="/pro/abonnement" className={`${linkBase} ${pathname?.startsWith("/pro/abonnement") ? active : inactive}`}>
            <CreditCard className="h-5 w-5 mr-3" />
            Mon Abonnement
          </Link>
          <Link href="/pro/archives" className={`${linkBase} ${pathname?.startsWith("/pro/archives") ? active : inactive}`}>
            <Archive className="h-5 w-5 mr-3" />
            Archives
          </Link>
        </nav>
      </aside>

      <main className="ml-64">{children}</main>
    </div>
  )
}
