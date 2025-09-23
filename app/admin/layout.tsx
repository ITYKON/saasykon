'use client';
import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Users, Building2, CreditCard, Settings, Calendar, TrendingUp, Shield, Archive } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: BarChart3 },
  { name: "Utilisateurs", href: "/admin/utilisateurs", icon: Users },
  { name: "Salons", href: "/admin/salons", icon: Building2 },
  { name: "Réservations", href: "/admin/reservations", icon: Calendar },
  { name: "Abonnements", href: "/admin/abonnements", icon: CreditCard },
  { name: "Statistiques", href: "/admin/statistiques", icon: TrendingUp },
  { name: "Rôles", href: "/admin/roles", icon: Shield },
  { name: "Archives", href: "/admin/archives", icon: Archive },
  { name: "Paramètres", href: "/admin/parametres", icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r sticky top-0 h-screen overflow-y-auto">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900">Admin Planity</h2>
          </div>
          <nav className="px-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors text-gray-700 hover:bg-gray-100 ${isActive ? "bg-gray-100 text-gray-900" : ""}`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-gray-500"}`} />
                  {item.name}
                </Link>
              )
            })}
            {/* Bouton se déconnecter */}
            <button
              onClick={async () => {
                try {
                  await fetch("/api/auth/logout", { method: "POST" });
                } catch (err) {
                  console.error("Erreur réseau :", err);
                }
                window.location.href = "/auth/login";
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors text-red-700 hover:bg-red-100 w-full mt-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" /></svg>
              Se déconnecter
            </button>
          </nav>
        </div>
        {/* Main content */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
