import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "saas_session"

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
    const domain = isProduction ? '.railway.app' : 'localhost'

    const response = NextResponse.json({ success: true })

    // Suppression des cookies
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0,
      expires: new Date(0)
    }

    // Suppression du cookie de session
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      ...cookieOptions,
      domain: isProduction ? domain : undefined
    })

    // Suppression du cookie des rôles
    response.cookies.set('saas_roles', '', {
      ...cookieOptions,
      httpOnly: false,
      domain: isProduction ? domain : undefined
    })

    // Suppression du cookie business_id
    response.cookies.set('business_id', '', {
      ...cookieOptions,
      httpOnly: false,
      domain: isProduction ? domain : undefined
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

