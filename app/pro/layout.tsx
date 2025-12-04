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
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function ProLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const linkBase = "flex items-center px-6 py-3 rounded-lg font-medium transition-colors"
  const inactive = "text-gray-700 hover:bg-gray-100"
  const active = "bg-gray-100 text-gray-900"
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [me, setMe] = useState<{ employee: { name: string | null; role: string | null } | null; permissions: string[] }>({ employee: null, permissions: [] })
  const perms = me.permissions || []
  const [roles, setRoles] = useState<string[]>([])

  // Gestion du redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      // On ferme le menu uniquement si on passe en mode desktop
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
      // On s'assure que le menu reste fermé par défaut sur mobile au chargement
      if (window.innerWidth < 1024) {
        setIsMobileMenuOpen(false);
      }
    }
    
    // Exécuter au chargement initial
    handleResize();
    
    // Ajouter le listener de redimensionnement
    window.addEventListener('resize', handleResize);
    
    // Nettoyer le listener au démontage
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [])

  // Gestion de la touche Échap pour fermer le menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Chargement des données utilisateur
  useEffect(() => {
    let mounted = true
    fetch('/api/pro/me').then(async (r) => {
      const data = await r.json().catch(() => ({}))
      if (mounted && r.ok) setMe({ employee: data?.employee || null, permissions: data?.permissions || [] })
    }).catch(() => {})
    
    // Lecture des rôles depuis les cookies pour les comptes propriétaires/pro
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

  // Fermer le menu quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const sidebar = document.querySelector('aside');
      const menuButton = document.querySelector('button[aria-label*="menu"]');
      
      if (isMobileMenuOpen && 
          !sidebar?.contains(target) && 
          !menuButton?.contains(target) &&
          window.innerWidth < 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Ajout d'un effet pour gérer le défilement et le débordement
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Effet pour gérer le défilement et le viewport mobile
  useEffect(() => {
    if (isMobileMenuOpen) {
      // Empêcher le défilement du body quand le menu est ouvert
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      // Forcer le viewport mobile
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    
    const handleResize = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobileMenuOpen]);

  return (
    <div 
      className="min-h-screen bg-white relative overflow-x-hidden"
      style={{
        '--vh': '1vh', // Variable CSS pour la hauteur du viewport
      } as React.CSSProperties}
    >
      {/* Barre de navigation mobile */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 z-50 bg-white/70 supports-[backdrop-filter]:bg-white/60 backdrop-blur">
        <h2 className="text-xl font-bold text-gray-900">YOKA</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          className="lg:hidden"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Overlay transparent pour mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-white/5 backdrop-blur-sm z-[55] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'pan-y',
            animation: 'fadeIn 150ms ease-out',
            pointerEvents: 'auto'
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white shadow-xl border-r h-[calc(var(--vh,1vh)*100)] overflow-y-auto transition-transform duration-300 ease-in-out z-[60]",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )} style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        overscrollBehavior: 'contain',
        width: '16rem', // 64 * 0.25rem = 16rem = 256px
        maxWidth: '90vw' // Ne pas dépasser 90% de la largeur de l'écran
      }}>
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">YOKA</h2>
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
          <Link 
            href="/pro/dashboard" 
            className={`${linkBase} ${pathname === "/pro/dashboard" ? active : inactive}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <BarChart3 className="h-5 w-5 mr-3" />
            Tableau de bord
          </Link>
          )}
          {hasAny(['agenda', 'agenda_view']) && (
          <Link 
            href="/pro/agenda" 
            className={`${linkBase} ${pathname?.startsWith("/pro/agenda") ? active : inactive}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Calendar className="h-5 w-5 mr-3" />
            Agenda
          </Link>
          )}
          {hasAny(['reservations', 'reservations_view', 'reservations_manage']) && (
          <Link 
            href="/pro/reservations" 
            className={`${linkBase} ${pathname?.startsWith("/pro/reservations") ? active : inactive}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <BookOpen className="h-5 w-5 mr-3" />
            Réservations
          </Link>
          )}
          {hasAny(['clients_view', 'clients_manage']) && (
          <Link 
            href="/pro/clients" 
            className={`${linkBase} ${pathname?.startsWith("/pro/clients") ? active : inactive}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Users className="h-5 w-5 mr-3" />
            Clients
          </Link>
          )}
          {hasAny(['employees', 'employees_manage']) && (
          <Link 
            href="/pro/employes" 
            className={`${linkBase} ${pathname?.startsWith("/pro/employes") ? active : inactive}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <UserCheck className="h-5 w-5 mr-3" />
            Employés
          </Link>
          )}
          {hasAny(['pro_accounts', 'pro_accounts_manage', 'comptes', 'employee_accounts']) && (
          <Link 
            href="/pro/comptes-employes" 
            className={`${linkBase} ${pathname?.startsWith("/pro/comptes-employes") ? active : inactive}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Shield className="h-5 w-5 mr-3" />
            Comptes Employés
          </Link>
          )}
          {hasAny(['services', 'services_manage']) && (
          <Link 
            href="/pro/services" 
            className={`${linkBase} ${pathname?.startsWith("/pro/services") ? active : inactive}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Settings className="h-5 w-5 mr-3" />
            Services
          </Link>
          )}
          {hasAny(['settings', 'settings_edit', 'profil']) && (
          <Link 
            href="/pro/profil-institut" 
            className={`${linkBase} ${pathname?.startsWith("/pro/profil-institut") ? active : inactive}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Building2 className="h-5 w-5 mr-3" />
            Profil Institut
          </Link>
          )}
          {hasAny(['stats', 'reports_view']) && (
          <Link 
            href="/pro/statistiques" 
            className={`${linkBase} ${pathname?.startsWith("/pro/statistiques") ? active : inactive}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <TrendingUp className="h-5 w-5 mr-3" />
            Statistiques
          </Link>
          )}
          {hasAny(['subscription', 'subscription_view']) && (
          <Link 
            href="/pro/abonnement" 
            className={`${linkBase} ${pathname?.startsWith("/pro/abonnement") ? active : inactive}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <CreditCard className="h-5 w-5 mr-3" />
            Mon Abonnement
          </Link>
          )}
          {hasAny(['archives', 'archives_view']) && (
          <Link 
            href="/pro/archives" 
            className={`${linkBase} ${pathname?.startsWith("/pro/archives") ? active : inactive}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Archive className="h-5 w-5 mr-3" />
            Archives
          </Link>
          )}
        </nav>
        {/* Logout button */}
        <div className="px-4 pb-4">
          <button
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
              } catch (err) {
                console.error("Erreur réseau :", err);
              }
              window.location.href = "/auth/login";
            }}
            className="mt-4 w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors text-red-700 hover:bg-red-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" /></svg>
            Se déconnecter
          </button>
        </div>
      </aside>


      {/* Contenu principal avec marge conditionnelle */}
      <main className={cn(
        "transition-all duration-300 ease-in-out min-h-[calc(var(--vh,1vh)*100)] w-full",
        isMobileMenuOpen ? "lg:pl-64" : "lg:pl-64"
      )}>
        <div className="p-4 sm:p-6 w-full max-w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
