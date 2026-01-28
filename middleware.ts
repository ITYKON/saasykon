import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getAuthDataFromTokenEdge } from "@/lib/session-edge"

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "__yk_sb_hg"
const PUBLIC_FILE = /\.(.*)$/

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isApiRequest = pathname.startsWith("/api/")
  
  // Gestion CORS pour les requêtes API
  if (isApiRequest) {
    const response = NextResponse.next()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://saasykon-production.up.railway.app'
    
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Origin', appUrl)
    response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization')
    
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200 })
    }
    
    return response
  }
  
  // Ignorer les fichiers statiques
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next()
  }

  const isAuthPage = pathname.startsWith("/auth/")
  const isInvitePage = pathname.startsWith("/auth/invite")
  const isResetPasswordPage = pathname.startsWith("/auth/reset-password")
  
  // Gestion de la déconnexion
  if (pathname === "/auth/logout") {
    const isProduction = process.env.NODE_ENV === 'production'
    const isSecure = isProduction && process.env.DISABLE_SECURE_COOKIES !== "true"
    
    const response = NextResponse.redirect(new URL('/auth/login', request.url))
    
    // Suppression des cookies
    const cookieOptions = {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0,
      expires: new Date(0)
    }
    
    // On nettoie tous les cookies de session
    const cookiesToClear = [
      SESSION_COOKIE_NAME,
      "next_auth_session",
      "saas_roles",
      "business_id",
      "onboarding_done"
    ]

    cookiesToClear.forEach(name => {
      response.cookies.set(name, '', cookieOptions)
      response.cookies.delete(name)
    })
    
    return response
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const authData = sessionToken ? await getAuthDataFromTokenEdge(sessionToken) : null
  
  if (pathname !== "/" && !pathname.startsWith("/_next") && !pathname.startsWith("/static") && !PUBLIC_FILE.test(pathname)) {
    
    if (sessionToken && !authData) {
      console.warn(`[Middleware] Token found but verification failed for path: ${pathname}`)
    }
  }

  const roles = authData?.roles || []
  const businessId = authData?.businessId || request.cookies.get("business_id")?.value
  const SPECIAL_ADMIN_BUSINESS_ID = "00000000-0000-0000-0000-000000000000"
  
  // Roles check
  const isAdmin = roles.includes("ADMIN")
  const isPro = roles.includes("PRO") || roles.includes("PROFESSIONNEL") || roles.includes("EMPLOYEE")
  const isClient = roles.includes("CLIENT")

  // Admin-equivalent: ADMIN role OR sub-admin with special business
  const isSubAdmin = businessId === SPECIAL_ADMIN_BUSINESS_ID && (roles.includes("SUPPORT") || roles.includes("SALES"))
  const canAccessAdmin = isAdmin || isSubAdmin
  
  if (sessionToken && authData) {
    
  }
  
  const isProtected = ["/admin", "/pro", "/client", "/api/admin", "/api/client"].some((p) => pathname.startsWith(p))

  if (isProtected && !sessionToken) {
    if (isApiRequest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const url = new URL("/auth/login", request.url)
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  // --- ACCESS CONTROL & REDIRECTION ---
  
  // 1. ADMIN SPACE PROTECTION
  const isAdminPath = pathname.startsWith("/admin") || pathname.startsWith("/api/admin")
  if (isAdminPath && !canAccessAdmin) {
    if (isApiRequest) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.redirect(new URL(isClient ? "/client/dashboard" : (isPro ? "/pro/dashboard" : "/auth/login"), request.url))
  }

  // 2. PRO SPACE PROTECTION
  const isProPath = pathname.startsWith("/pro") || pathname.startsWith("/api/pro")
  if (isProPath && !isPro && !isAdmin) {
    if (isApiRequest) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.redirect(new URL(isClient ? "/client/dashboard" : "/auth/login", request.url))
  }

  // 3. CLIENT SPACE PROTECTION
  const isClientPath = pathname.startsWith("/client") || pathname.startsWith("/api/client")
  if (isClientPath && !isClient && !isAdmin) {
    if (isApiRequest) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.redirect(new URL(isPro ? "/pro/dashboard" : "/auth/login", request.url))
  }

  // 4. AUTH PAGE REDIRECTION (If already logged in)
  if (isAuthPage && !isInvitePage && !isResetPasswordPage && sessionToken) {
    if (canAccessAdmin) return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    if (isPro) return NextResponse.redirect(new URL("/pro/dashboard", request.url))
    if (isClient) return NextResponse.redirect(new URL("/client/dashboard", request.url))
  }

  // 5. ROOT REDIRECTION
  if (pathname === "/") {
    if (canAccessAdmin) {
      console.log(`[Middleware] Root redirecting ADMIN to /admin/dashboard`)
      return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }
    if (isPro) {
      console.log(`[Middleware] Root redirecting PRO to /pro/dashboard`)
      return NextResponse.redirect(new URL("/pro/dashboard", request.url))
    }
    if (isClient) {
      console.log(`[Middleware] Root redirecting CLIENT to /client/dashboard`)
      return NextResponse.redirect(new URL("/client/dashboard", request.url))
    }
  }

  // 6. BUSINESS_ID FOR ADMINS
  if (isAdmin && !businessId) {
    const response = NextResponse.next()
    response.cookies.set('business_id', SPECIAL_ADMIN_BUSINESS_ID, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
    return response
  }

  // --- FINAL RESPONSE & COOKIE CLEANUP ---
  const response = NextResponse.next()
  
  // Proactively delete old insecure cookies if they exist
  if (request.cookies.has("saas_roles")) response.cookies.delete("saas_roles")
  if (request.cookies.has("onboarding_done")) response.cookies.delete("onboarding_done")

  return response
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*", 
    "/pro/:path*", 
    "/client/:path*", 
    "/auth/:path*", 
    "/api/admin/:path*", 
    "/api/client/:path*"
  ]
}

