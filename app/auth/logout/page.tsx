"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const logout = async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" })
      } catch (err) {
        console.error("Erreur réseau :", err)
      }
      router.replace("/auth/login")
    }
    logout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg">Déconnexion en cours...</p>
      </div>
    </div>
  )
}
