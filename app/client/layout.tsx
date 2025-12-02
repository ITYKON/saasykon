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
  
  // Fermer le menu après la navigation sur mobile
  useEffect(() => {
    if (onLinkClick) onLinkClick()
  }, [pathname, onLinkClick])

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
    <aside className="w-80 bg-white border-r border-gray-200 h-screen sticky top-0 self-start overflow-y-auto">
      <div className="p-6">
        <div className="text-center mb-8">
          <Avatar className="h-20 w-20 mx-auto mb-4 bg-gray-200">
            {authUser?.avatar_url ? <AvatarImage src={authUser.avatar_url} /> : null}
            <AvatarFallback className="text-gray-600 text-xl font-medium">
              {`${(authUser?.first_name?.[0] || "M").toUpperCase()}${(authUser?.last_name?.[0] || "D").toUpperCase()}`}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-semibold text-black">{authUser ? `${authUser.first_name || ""} ${authUser.last_name || ""}`.trim() : "Utilisateur"}</h2>
          <p className="text-gray-600 text-sm">{authUser?.email || ""}</p>
        </div>

        <nav className="space-y-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            const base = "flex items-center px-4 py-3 rounded-lg"
            const activeClasses = "text-white bg-black"
            const inactiveClasses = "text-gray-700 hover:bg-gray-100"
            return (
              <Link key={href} href={href} className={`${base} ${active ? activeClasses : inactiveClasses}`}>
                <Icon className="h-5 w-5 mr-3" />
                {label}
              </Link>
            )
          })}

          <a href="/auth/logout" className="flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg">
            <LogOut className="h-5 w-5 mr-3" />
            Se déconnecter
          </a>
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
    <div className="min-h-screen bg-gray-50">
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

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar - maintenant conditionnelle sur mobile */}
        <div className={cn(
          "fixed inset-y-0 left-0 w-80 bg-white border-r border-gray-200 h-screen z-30 transition-transform duration-300 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          <ClientSidebar onLinkClick={() => setIsMobileMenuOpen(false)} />
        </div>

        {/* Overlay pour fermer le menu en cliquant à côté (mobile uniquement) */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Contenu principal avec marge conditionnelle */}
        <div className={cn(
          "w-full transition-all duration-300 pt-16 lg:pt-0 min-h-screen",
          isMobileMenuOpen ? "ml-80" : "lg:ml-80"
        )}>
          {children}
        </div>
      </div>
      <Toaster />
    </div>
  )
}
