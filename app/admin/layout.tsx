"use client";
import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Users, Building2, CreditCard, Settings, Calendar, TrendingUp, Shield, Archive, FileText, CheckCircle2 } from "lucide-react";
import useAuth from "@/hooks/useAuth";

// Map navigation items to an optional permission code required to view them.
const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: BarChart3, permission: null },
  { name: "Leads", href: "/admin/leads", icon: Users, permission: null },
  { name: "Revendications", href: "/admin/claims", icon: FileText, permission: null },
  { name: "Vérifications", href: "/admin/verifications", icon: CheckCircle2, permission: "BUSINESS_VERIFY" },
  { name: "Utilisateurs", href: "/admin/utilisateurs", icon: Users, permission: "users" },
  { name: "Salons", href: "/admin/salons", icon: Building2, permission: "salons" },
  { name: "Réservations", href: "/admin/reservations", icon: Calendar, permission: "reservations" },
  { name: "Abonnements", href: "/admin/abonnements", icon: CreditCard, permission: "subscriptions" },
  { name: "Statistiques", href: "/admin/statistiques", icon: TrendingUp, permission: "statistics" },
  { name: "Rôles", href: "/admin/roles", icon: Shield, permission: "roles" },
  { name: "Archives", href: "/admin/archives", icon: Archive, permission: "archives" },
  { name: "Paramètres", href: "/admin/parametres", icon: Settings, permission: "settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { auth } = useAuth();
  const permissions = auth?.permissions || [];
  const isAdmin = auth?.roles?.includes("ADMIN");
  // Compute display info for current user
  const roleLabelMap: Record<string, string> = {
    ADMIN: "Admin",
    AGENT_COMMERCIAL: "Agent commercial",
    agent_commercial: "Agent commercial",
    COMMERCIAL: "Commercial",
    SUPPORT: "Support",
    MANAGER: "Manager",
    PROFESSIONNEL: "Professionnel",
    PRO: "Professionnel",
    CLIENT: "Client",
  };
  const primaryRoleCode = auth?.roles?.[0] || (permissions.includes("statistics") ? "ADMIN" : "");
  const primaryRoleLabel = primaryRoleCode ? (roleLabelMap[primaryRoleCode] || primaryRoleCode) : "";
  const fullName = [auth?.first_name, auth?.last_name].filter(Boolean).join(" ");
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r sticky top-0 h-screen overflow-y-auto">
          <div className="p-6">
            {/* Title becomes the main role */}
            <h2 className="text-xl font-bold text-gray-900">{primaryRoleLabel || "Admin"}</h2>
            {/* Full name below */}
            {fullName && <div className="mt-1 text-sm text-gray-500">{fullName}</div>}
          </div>
          <nav className="px-4 space-y-2">
            {navigation
              .filter((item) => isAdmin || !item.permission || permissions.includes(item.permission))
              .map((item) => {
                const Icon = item.icon as any;
                const isActive = pathname ? (pathname === item.href || pathname.startsWith(item.href + "/")) : false;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors text-gray-700 hover:bg-gray-100 ${isActive ? "bg-gray-100 text-gray-900" : ""}`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-gray-500"}`} />
                    {item.name}
                  </Link>
                );
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
