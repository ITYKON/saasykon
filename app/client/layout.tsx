"use client"

import type React from "react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Heart, Settings, LogOut, LayoutDashboard, Menu, X } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AuthUser = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  roles: string[]
  avatar_url?: string | null
}

function ClientSidebar({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname()
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  
  // La fermeture du menu est maintenant gérée directement dans le onClick des liens

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setAuthUser(d.user || null))
      .catch(() => setAuthUser(null))
  }, [])

  const navItems = [
    { href: "/client/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/client/reservations", label: "Mes rendez-vous", icon: Calendar },
    { href: "/client/favoris", label: "Mes favoris", icon: Heart },
    { href: "/client/profil", label: "Mon profil", icon: Settings },
  ]

  return (
    <aside className="sticky top-0 h-screen w-full overflow-y-auto">
      <div className="p-6 mt-12">
        <div className="text-center mb-8">
          {/* <div className="flex justify-center mb-6">
            <div className="relative h-28 w-28 rounded-full border-2 border-gray-200 overflow-hidden flex items-center justify-center">
              {authUser?.avatar_url ? (
                <img 
                  src={authUser.avatar_url} 
                  alt="Photo de profil"
                  className="h-full w-full object-cover object-center"
                  style={{ objectPosition: 'center 30%' }}
                />
              ) : (
                <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-600 text-3xl font-medium">
                  {`${(authUser?.first_name?.[0] || "M").toUpperCase()}${(authUser?.last_name?.[0] || "D").toUpperCase()}`}
                </span>
              </div>
              )}
            </div>
          </div> */}
          <h2 className="text-3xl font-semibold text-black">{authUser ? `${authUser.first_name || ""} ${authUser.last_name || ""}`.trim() : "Utilisateur"}</h2>
          <p className="text-gray-600 text-sm">{authUser?.email || ""}</p>
        </div>

        <nav className="space-y-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            const base = "flex items-center px-4 py-3 rounded-lg"
            const activeClasses = "text-white bg-black"
            const inactiveClasses = "text-gray-700 hover:bg-gray-100"
            return (
              <Link 
                key={href} 
                href={href} 
                className={`${base} ${active ? activeClasses : inactiveClasses}`}
                onClick={() => onLinkClick?.()}
              >
                <Icon className="h-5 w-5 mr-3" />
                {label}
              </Link>
            )
          })}

          <button 
            onClick={async (e) => {
              e.preventDefault();
              onLinkClick?.();
              try {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/auth/login";
              } catch (error) {
                console.error("Erreur lors de la déconnexion:", error);
                window.location.href = "/auth/login";
              }
            }}
            className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg text-left"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Se déconnecter
          </button>
        </nav>
      </div>
    </aside>
  )
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Gestion du redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Barre de navigation mobile */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-40">
        <h2 className="text-xl font-bold text-gray-900">Mon Espace Client</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={cn(
          "fixed inset-y-0 left-0 w-80 bg-white border-r border-gray-200 z-30 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:z-auto lg:flex-shrink-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="full">
            <ClientSidebar onLinkClick={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>

        {/* Contenu principal */}
        <main className="flex-1 overflow-y-auto lg:ml-0 bg-white lg:bg-gray-50" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
