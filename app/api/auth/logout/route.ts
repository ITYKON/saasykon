import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "saas_session"

function getDomain() {
  if (process.env.VERCEL_ENV === 'production') {
    return '.yoursaasdomain.com' // Remplacez par votre domaine de production
  }
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return '.' + process.env.RAILWAY_PUBLIC_DOMAIN
  }
  return undefined
}

export async function POST() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (token) {
      await prisma.sessions.deleteMany({
        where: { token }
      }).catch(console.error)
    }

    const isProduction = process.env.NODE_ENV === 'production'
    const domain = getDomain()

    const response = NextResponse.json({ success: true })

    // Suppression des cookies
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      domain
    }

    // Suppression du cookie de session
    response.cookies.set(SESSION_COOKIE_NAME, '', cookieOptions)

    // Suppression du cookie des rôles
    response.cookies.set('saas_roles', '', {
      ...cookieOptions,
      httpOnly: false
    })

    // Suppression du cookie business_id
    response.cookies.set('business_id', '', {
      ...cookieOptions,
      httpOnly: false
    })

    return response
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la déconnexion' },
      { status: 500 }
    )
  }
}

