import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "saas_session"

export async function POST() {
  try {
    console.log("=== DÉCONNEXION API DÉMARRÉE ===")
    
    const cookieStore = cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

    console.log(" Cookie trouvé:", token ? "OUI" : "NON")
    console.log(" Nom du cookie:", SESSION_COOKIE_NAME)

    // 1. Suppression en base de données
    if (token) {
      try {
        const result = await prisma.sessions.deleteMany({
          where: { token }
        })
        console.log(" Sessions supprimées:", result.count)
      } catch (error) {
        console.log(" Erreur suppression BDD:", error)
      }
    }

    // 2. Créer la réponse
    const response = NextResponse.json({ 
      success: true, 
      message: "Déconnexion réussie" 
    })

    // 3. Configuration pour Railway - SANS DOMAINE SPÉCIFIQUE
    const isProduction = process.env.NODE_ENV === 'production'
    const isSecure = isProduction && process.env.DISABLE_SECURE_COOKIES !== "true"
    
    console.log(` Environnement: ${isProduction ? "PRODUCTION" : "DEVELOPMENT"}, Secure Cookie: ${isSecure}`)

    // Liste des cookies à supprimer
    const cookiesToDelete = [
      SESSION_COOKIE_NAME,
      'saas_roles', 
      'business_id', 
      'onboarding_done'
    ]

    // Supprimer chaque cookie - SANS DOMAIN POUR RAILWAY
    cookiesToDelete.forEach(cookieName => {
      try {
        response.cookies.set(cookieName, '', {
          httpOnly: cookieName === SESSION_COOKIE_NAME,
          secure: isSecure,
          sameSite: 'lax',
          path: '/',
          maxAge: 0,
          expires: new Date(0)
          // ❌ PAS DE DOMAIN SPÉCIFIÉ - Laisse le navigateur gérer
        })
        console.log(` Cookie ${cookieName} supprimé`)
      } catch (error) {
        console.log(` Erreur suppression ${cookieName}:`, error)
      }
    })

    console.log("=== DÉCONNEXION API TERMINÉE ===")
    return response

  } catch (error) {
    console.error(' Erreur lors de la déconnexion:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}