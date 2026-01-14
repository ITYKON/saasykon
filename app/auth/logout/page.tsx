"use client"

import { useEffect, useState } from "react"

export default function LogoutPage() {
  const [status, setStatus] = useState("Déconnexion en cours...")
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message])
  }

  useEffect(() => {

    
    const logout = async () => {
      try {
        addLog("🚀 Lancement de la déconnexion...")
        
        // 1. Appel à l'API de déconnexion
        addLog("📞 Appel API /api/auth/logout...")
        
        const response = await fetch("/api/auth/logout", { 
          method: "POST",
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const data = await response.json()
        addLog(`📊 Réponse API: ${JSON.stringify(data)}`)

        if (!response.ok) {
          addLog(`❌ Erreur API: ${response.status}`)
          throw new Error('Échec de la déconnexion')
        }

        addLog("✅ API déconnexion réussie")

        // 2. Suppression manuelle des cookies côté client
        addLog("🗑️ Suppression manuelle des cookies...")
        
        // Méthode SIMPLIFIÉE sans domaine complexe
        const deleteCookie = (name: string) => {
          // Méthode 1 : sans domaine (la plus fiable)
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
          addLog(`🗑️ Cookie ${name} supprimé`)
        }

        // Suppression des cookies
        deleteCookie('saas_session')
        deleteCookie('saas_roles')
        deleteCookie('business_id')
        deleteCookie('onboarding_done')

        // 3. Vérification finale
        addLog(`🔍 Cookies restants: ${document.cookie || "AUCUN"}`)

        // 4. Redirection
        addLog("🔄 Redirection vers /auth/login...")
        setStatus("Redirection vers la page de connexion...")
        setTimeout(() => {
          window.location.href = "/auth/login"
        }, 1000)

      } catch (error) {
        addLog(`💥 Erreur: ${error}`)
        console.error("❌ Erreur lors de la déconnexion:", error)
        setStatus("Erreur - Redirection...")
        setTimeout(() => {
          window.location.href = "/auth/login"
        }, 1000)
      }
    }

    logout()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="text-center">
          {/* Spinner animé */}
          <div className="mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          </div>
          
          {/* Message principal */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Déconnexion
          </h2>
          <p className="text-gray-600 mb-4">
            {status}
          </p>
          
          {/* Barre de progression */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
          </div>
          
          {/* Logs de débogage (optionnel) */}
          {logs.length > 0 && (
            <div className="text-left bg-gray-100 p-4 rounded mt-4 max-h-40 overflow-y-auto">
              <h3 className="font-semibold text-sm mb-2">Logs:</h3>
              {logs.map((log, index) => (
                <div key={index} className="text-xs text-gray-600 mb-1 font-mono">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}