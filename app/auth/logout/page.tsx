"use client"

import { useEffect } from "react"

export default function LogoutPage() {
  useEffect(() => {
    const logout = async () => {
      try {
        // Appel à l'API de déconnexion
        const response = await fetch("/api/auth/logout", { 
          method: "POST",
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Échec de la déconnexion')
        }

        // Suppression manuelle des cookies côté client
        const domain = window.location.hostname
        document.cookie = `${process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME || 'saas_session'}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${domain};`
        document.cookie = `saas_roles=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${domain};`
        document.cookie = `business_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${domain};`

        // Forcer un rechargement complet
        window.location.href = "/auth/login"
      } catch (error) {
        console.error("Erreur lors de la déconnexion:", error)
        window.location.href = "/auth/login"
      }
    }

    logout()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg">Déconnexion en cours...</p>
      </div>
    </div>
  )
}
