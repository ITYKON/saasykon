import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getAuthDataFromTokenEdge } from "@/lib/session-edge"
import { getToken } from "next-auth/jwt"

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "__yk_sb_"
const PUBLIC_FILE = /\.(.*)$/

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isApiRequest = pathname.startsWith("/api/")
  
  // Gestion CORS pour les requêtes API
  if (isApiRequest) {
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || 'https://saasykon-production.up.railway.app')
    response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization')
    
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200 })
    }
    
    return response
  }
  
  // Ignorer les fichiers statiques et les fichiers de l'API
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
    
    // Suppression du cookie de session
    response.cookies.set(SESSION_COOKIE_NAME, '', cookieOptions)
    
    // Suppression des cookies de session
    response.cookies.delete(SESSION_COOKIE_NAME)
    response.cookies.delete("next_auth_session")
    response.cookies.delete("saas_roles")
    response.cookies.delete("business_id")
    response.cookies.delete("onboarding_done")
    
    return response
  }

  const isProtected = ["/admin", "/pro", "/client", "/api/admin", "/api/client"].some((p) => pathname.startsWith(p))
  // SECURITY: Fetch verified roles and businessId
  let roles: string[] = []
  let businessId: string | undefined = undefined
  
  const customToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const nextAuthToken = await getToken({ 
    req: request as any, 
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: "next_auth_session"
  })

  // 1. Try NextAuth (prioritized)
  if (nextAuthToken) {
    roles = (nextAuthToken.roles as string[]) || []
    businessId = nextAuthToken.businessId as string
  } 
  // 2. Try Custom Session JWT
  else if (customToken) {
    const authData = await getAuthDataFromTokenEdge(customToken)
    if (authData) {
      roles = authData.roles
      businessId = authData.businessId
    } 
  }

  const sessionToken = customToken || (nextAuthToken ? "exists" : undefined)

  const SPECIAL_ADMIN_BUSINESS_ID = "00000000-0000-0000-0000-000000000000"
  
  // Roles check
  const isAdmin = roles.includes("ADMIN")
  const isPro = roles.includes("PRO") || roles.includes("PROFESSIONNEL") || roles.includes("EMPLOYEE")
  const isClient = roles.includes("CLIENT")
  
  // Admin-equivalent: ADMIN role OR sub-admin with special business
  // We limit sub-admin roles to specific ones to avoid CLIENTS being considered sub-admins
  const isSubAdmin = businessId === SPECIAL_ADMIN_BUSINESS_ID && (roles.includes("SUPPORT") || roles.includes("SALES"))
  const canAccessAdmin = isAdmin || isSubAdmin
  
  // Documents verification check moved to pages to support Edge middleware

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
  const isProOnboarding = pathname.startsWith("/pro/onboarding")
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
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (isPro) {
      return NextResponse.redirect(new URL("/pro/dashboard", request.url));
    }
    if (isClient) {
      return NextResponse.redirect(new URL("/client/dashboard", request.url));
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
  if (request.cookies.has("business_id") && !isAdmin) {
    // Only delete business_id if it's not the one we just set for admin
    // Actually, if it's already there but insecure, we want to replace it anyway.
    // In our case, the middleware logic above for admin sets it on a fresh response.
  }
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
