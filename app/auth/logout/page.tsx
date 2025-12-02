"use client"

import { useEffect } from "react"

function deleteCookie(name: string) {
  const domain = window.location.hostname
  const isLocalhost = domain === 'localhost' || domain.endsWith('.localhost')
  
  // Pour le domaine, on utilise le domaine parent en production
  const domainPart = isLocalhost ? '' : `; domain=.${domain.split('.').slice(-2).join('.')}`
  
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${domainPart}; samesite=lax` + 
    (window.location.protocol === 'https:' ? '; secure' : '')
}

export default function LogoutPage() {
  useEffect(() => {
    const logout = async () => {
      try {
        // Suppression côté client d'abord pour s'assurer qu'ils sont effacés
        deleteCookie(process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME || 'saas_session')
        deleteCookie('saas_roles')
        deleteCookie('business_id')

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

        // Redirection après un court délai pour s'assurer que les cookies sont supprimés
        setTimeout(() => {
          window.location.href = "/auth/login"
        }, 300)
      } catch (error) {
        console.error("Erreur lors de la déconnexion:", error)
        // En cas d'erreur, on redirige quand même vers la page de connexion
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
