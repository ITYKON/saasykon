'use client' // Add this at the top to mark this as a Client Component
import type React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Toaster } from "sonner"
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
  const router = useRouter()
  const linkBase = "flex items-center px-6 py-3 rounded-lg font-medium transition-colors"
  const inactive = "text-gray-700 hover:bg-gray-100"
  const active = "bg-gray-100 text-gray-900"
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [me, setMe] = useState<{ 
    employee: { name: string | null; role: string | null } | null; 
    permissions: string[];
    needsVerification?: boolean;
  }>({ employee: null, permissions: [], needsVerification: false })
  const perms = me.permissions || []
  const [roles, setRoles] = useState<string[]>([])

  // Combined effect for layout, viewport height and resize handling
  useEffect(() => {
    const handleResize = () => {
      // Force mobile viewport height
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
      
      // Close mobile menu on desktop
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false)
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const sidebar = document.querySelector('aside');
      const menuButton = document.querySelector('button[aria-label*="menu"]');
      
      if (isMobileMenuOpen && 
          sidebar && !sidebar.contains(target) && 
          menuButton && !menuButton.contains(target) &&
          window.innerWidth < 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen])

  // Effect for body overflow
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

  // Loading user data
  useEffect(() => {
    let mounted = true
    fetch('/api/pro/me').then(async (r) => {
      const data = await r.json().catch(() => ({}))
      if (mounted && r.ok) {
        setMe({ 
          employee: data?.employee || null, 
          permissions: data?.permissions || [] ,
          needsVerification: !!data?.needsVerification
        })
        if (data?.roles) setRoles(data.roles)
        
        // Redirection logic for needsVerification
        if (data?.needsVerification && !pathname?.startsWith('/pro/documents-verification')) {
          router.push('/pro/documents-verification');
        }
      }
    }).catch(() => {})
    
    return () => { mounted = false }
  }, [])

  function hasAny(req: string[] | undefined) {
    if (roles.includes('PRO') || roles.includes('ADMIN')) return true
    if (!req || req.length === 0) return true
    if (!perms || perms.length === 0) return false
    return perms.some(p => req.some(r => p === r || p.startsWith(r)))
  }

  return (
    <div 
      className="min-h-screen bg-white relative overflow-x-hidden"
      style={{
        '--vh': '1vh',
      } as React.CSSProperties}
    >
      <Toaster position="top-center" richColors closeButton />
      
      {/* Mobile nav bar */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 z-50 bg-white/70 supports-[backdrop-filter]:bg-white/60 backdrop-blur">
        <h2 className="text-xl font-bold text-gray-900">YOKA</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white shadow-xl border-r h-[calc(var(--vh,1vh)*100)] overflow-y-auto transition-transform duration-300 ease-in-out z-[60]",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">YOKA</h2>
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
              className={cn(linkBase, pathname === "/pro/dashboard" ? active : inactive)}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <BarChart3 className="h-5 w-5 mr-3" />
              Tableau de bord
            </Link>
          )}
          
          {hasAny(['agenda', 'agenda_view']) && (
            <Link 
              href="/pro/agenda" 
              className={cn(linkBase, pathname?.startsWith("/pro/agenda") ? active : inactive)}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Calendar className="h-5 w-5 mr-3" />
              Agenda
            </Link>
          )}
          
          {hasAny(['reservations', 'reservations_view', 'reservations_manage']) && (
            <Link 
              href="/pro/reservations" 
              className={cn(linkBase, pathname?.startsWith("/pro/reservations") ? active : inactive)}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <BookOpen className="h-5 w-5 mr-3" />
              Réservations
            </Link>
          )}
          
          {hasAny(['clients_view', 'clients_manage']) && (
            <Link 
              href="/pro/clients" 
              className={cn(linkBase, pathname?.startsWith("/pro/clients") ? active : inactive)}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Users className="h-5 w-5 mr-3" />
              Clients
            </Link>
          )}
          
          {hasAny(['employees', 'employees_manage']) && (
            <Link 
              href="/pro/employes" 
              className={cn(linkBase, pathname?.startsWith("/pro/employes") ? active : inactive)}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <UserCheck className="h-5 w-5 mr-3" />
              Employés
            </Link>
          )}
          
          
          {hasAny(['services', 'services_manage']) && (
            <Link 
              href="/pro/services" 
              className={cn(linkBase, pathname?.startsWith("/pro/services") ? active : inactive)}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Settings className="h-5 w-5 mr-3" />
              Services
            </Link>
          )}
          
          {hasAny(['settings', 'settings_edit', 'profil']) && (
            <Link 
              href="/pro/profil-institut" 
              className={cn(linkBase, pathname?.startsWith("/pro/profil-institut") ? active : inactive)}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Building2 className="h-5 w-5 mr-3" />
              Profil Institut
            </Link>
          )}
          
          {hasAny(['stats', 'reports_view']) && (
            <Link 
              href="/pro/statistiques" 
              className={cn(linkBase, pathname?.startsWith("/pro/statistiques") ? active : inactive)}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <TrendingUp className="h-5 w-5 mr-3" />
              Statistiques
            </Link>
          )}
          
          {hasAny(['subscription', 'subscription_view']) && (
            <Link 
              href="/pro/abonnement" 
              className={cn(linkBase, pathname?.startsWith("/pro/abonnement") ? active : inactive)}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <CreditCard className="h-5 w-5 mr-3" />
              Mon Abonnement
            </Link>
          )}
          
          {hasAny(['archives', 'archives_view']) && (
            <Link 
              href="/pro/archives" 
              className={cn(linkBase, pathname?.startsWith("/pro/archives") ? active : inactive)}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Archive className="h-5 w-5 mr-3" />
              Archives
            </Link>
          )}
        </nav>

        <div className="px-4 pb-4 mt-auto">
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
            Se déconnecter
          </button>
        </div>
      </aside>

      <main className="lg:pl-64 min-h-screen">
        <div>
          {children}
        </div>
      </main>
    </div>
  )
}
