'use client' // Add this at the top to mark this as a Client Component
import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
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

  const [me, setMe] = useState<{ employee: { name: string | null; role: string | null } | null; permissions: string[] }>({ employee: null, permissions: [] })
  const perms = me.permissions || []
  const [roles, setRoles] = useState<string[]>([])

  useEffect(() => {
    let mounted = true
    fetch('/api/pro/me').then(async (r) => {
      const data = await r.json().catch(() => ({}))
      if (mounted && r.ok) setMe({ employee: data?.employee || null, permissions: data?.permissions || [] })
    }).catch(() => {})
    // read roles from cookie for owner/pro accounts
    try {
      const m = typeof document !== 'undefined' ? document.cookie.match(/(?:^|; )saas_roles=([^;]+)/) : null
      const val = m ? decodeURIComponent(m[1]) : ''
      const list = val ? val.split(',').filter(Boolean) : []
      if (mounted) setRoles(list)
    } catch {}
    return () => { mounted = false }
  }, [])

  function hasAny(req: string[] | undefined) {
    // PRO or ADMIN can access everything
    if (roles.includes('PRO') || roles.includes('ADMIN')) return true
    if (!req || req.length === 0) return true
    if (!perms || perms.length === 0) return false
    return perms.some(p => req.some(r => p === r || p.startsWith(r)))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg border-r h-screen overflow-y-auto z-30">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">PLANITY PRO</h2>
          {/* Hide employee identity for PRO/ADMIN accounts */}
          {me.employee && !(roles.includes('PRO') || roles.includes('ADMIN')) && (
            <div className="mt-2 text-sm text-gray-700">
              <div className="font-medium truncate" title={me.employee.name || undefined}>{me.employee.name || ''}</div>
              {me.employee.role && me.employee.role.toLowerCase() !== 'employé' && (
                <div className="inline-flex items-center mt-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700" title={me.employee.role}>{me.employee.role}</div>
              )}
            </div>
          )}
        </div>
        <nav className="mt-4 px-2 space-y-1">
          {hasAny(['pro_portal_access', 'dashboard', 'reports_view']) && (
          <Link href="/pro/dashboard" className={`${linkBase} ${pathname === "/pro/dashboard" ? active : inactive}`}>
            <BarChart3 className="h-5 w-5 mr-3" />
            Tableau de bord
          </Link>
          )}
          {hasAny(['agenda', 'agenda_view']) && (
          <Link href="/pro/agenda" className={`${linkBase} ${pathname?.startsWith("/pro/agenda") ? active : inactive}`}>
            <Calendar className="h-5 w-5 mr-3" />
            Agenda
          </Link>
          )}
          {hasAny(['reservations', 'reservations_view', 'reservations_manage']) && (
          <Link href="/pro/reservations" className={`${linkBase} ${pathname?.startsWith("/pro/reservations") ? active : inactive}`}>
            <BookOpen className="h-5 w-5 mr-3" />
            Réservations
          </Link>
          )}
          {hasAny(['clients_view', 'clients_manage']) && (
          <Link href="/pro/clients" className={`${linkBase} ${pathname?.startsWith("/pro/clients") ? active : inactive}`}>
            <Users className="h-5 w-5 mr-3" />
            Clients
          </Link>
          )}
          {hasAny(['employees', 'employees_manage']) && (
          <Link href="/pro/employes" className={`${linkBase} ${pathname?.startsWith("/pro/employes") ? active : inactive}`}>
            <UserCheck className="h-5 w-5 mr-3" />
            Employés
          </Link>
          )}
          {hasAny(['pro_accounts', 'pro_accounts_manage', 'comptes', 'employee_accounts']) && (
          <Link href="/pro/comptes-employes" className={`${linkBase} ${pathname?.startsWith("/pro/comptes-employes") ? active : inactive}`}>
            <Shield className="h-5 w-5 mr-3" />
            Comptes Employés
          </Link>
          )}
          {hasAny(['services', 'services_manage']) && (
          <Link href="/pro/services" className={`${linkBase} ${pathname?.startsWith("/pro/services") ? active : inactive}`}>
            <Settings className="h-5 w-5 mr-3" />
            Services
          </Link>
          )}
          {hasAny(['settings', 'settings_edit', 'profil']) && (
          <Link href="/pro/profil-institut" className={`${linkBase} ${pathname?.startsWith("/pro/profil-institut") ? active : inactive}`}>
            <Building2 className="h-5 w-5 mr-3" />
            Profil Institut
          </Link>
          )}
          {hasAny(['stats', 'reports_view']) && (
          <Link href="/pro/statistiques" className={`${linkBase} ${pathname?.startsWith("/pro/statistiques") ? active : inactive}`}>
            <TrendingUp className="h-5 w-5 mr-3" />
            Statistiques
          </Link>
          )}
          {hasAny(['subscription', 'subscription_view']) && (
          <Link href="/pro/abonnement" className={`${linkBase} ${pathname?.startsWith("/pro/abonnement") ? active : inactive}`}>
            <CreditCard className="h-5 w-5 mr-3" />
            Mon Abonnement
          </Link>
          )}
          {hasAny(['archives', 'archives_view']) && (
          <Link href="/pro/archives" className={`${linkBase} ${pathname?.startsWith("/pro/archives") ? active : inactive}`}>
            <Archive className="h-5 w-5 mr-3" />
            Archives
          </Link>
          )}
        </nav>
      </aside>

      <main className="ml-64">{children}</main>
    </div>
  )
}
