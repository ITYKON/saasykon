"use client"

import type React from "react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Heart, Settings, LogOut, LayoutDashboard } from "lucide-react"

type AuthUser = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  roles: string[]
  avatar_url?: string | null
}

function ClientSidebar() {
  const pathname = usePathname()
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)

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
    <aside className="w-80 bg-white border-r border-gray-200 h-screen sticky top-0 self-start">
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
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-start">
        <ClientSidebar />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
