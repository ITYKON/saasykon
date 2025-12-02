import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "saas_session"
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
    const domain = isProduction ? '.railway.app' : 'localhost'
    
    const response = NextResponse.redirect(new URL('/auth/login', request.url))
    
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
  }

  const isProtected = ["/admin", "/pro", "/client", "/api/admin", "/api/client"].some((p) => pathname.startsWith(p))
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const rolesCookie = request.cookies.get("saas_roles")?.value ?? ""
  const roles = rolesCookie.split(",").filter(Boolean) // filter out empty entries
  const businessId = request.cookies.get("business_id")?.value
  const SPECIAL_ADMIN_BUSINESS_ID = "00000000-0000-0000-0000-000000000000"
  
  // Users with ADMIN role have full access
  const isAdmin = roles.includes("ADMIN")
  
  // Users with special business_id AND any role are considered sub-admins (commercial, support, etc.)
  // They can access /admin routes but permissions will be checked at page/API level
  const isSubAdmin = businessId === SPECIAL_ADMIN_BUSINESS_ID && roles.length > 0
  
  // Admin-equivalent: ADMIN role OR sub-admin with special business
  const canAccessAdmin = isAdmin || isSubAdmin

  if (isProtected && !sessionToken) {
    if (isApiRequest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const url = new URL("/auth/login", request.url)
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  // Block access to admin routes for users without admin privileges
  // Fine-grained permission checks are done at page/API level via requireAdminOrPermission()
  const isAdminPath = pathname.startsWith("/admin") || pathname.startsWith("/api/admin")
  if (isAdminPath && !canAccessAdmin) {
    if (isApiRequest) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const url = new URL("/client/dashboard", request.url)
    return NextResponse.redirect(url)
  }

  // Redirect sub-admins trying to access client/pro routes to admin dashboard
  const isClientPath = pathname.startsWith("/client")
  const isProPath = pathname.startsWith("/pro")
  const isProOnboarding = pathname.startsWith("/pro/onboarding")
  
  if (canAccessAdmin && (isClientPath || isProPath)) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url))
  }

  // Allow PRO users to access dashboard even if onboarding is not completed
  // They will see a banner with a link to complete onboarding
  const onboardingDone = request.cookies.get("onboarding_done")?.value === "true"
  
  // Only redirect to onboarding if the user explicitly navigates to /pro/onboarding
  // Otherwise, they can access the dashboard and complete onboarding later
  if (roles.includes("PRO") && pathname === "/pro/onboarding" && onboardingDone) {
    return NextResponse.redirect(new URL("/pro/dashboard", request.url))
  }

  // Do NOT auto-redirect away from the invite or password reset flow, even if a session exists
  if (isAuthPage && !isInvitePage && !isResetPasswordPage && sessionToken) {
    // Redirect based on roles and business_id
    if (canAccessAdmin) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }
    if (roles.includes("PRO")) {
      return NextResponse.redirect(new URL("/pro/dashboard", request.url))
    }
    // All other users go to client dashboard
    return NextResponse.redirect(new URL("/client/dashboard", request.url))
  }

  // Fine-grained guard for PRO area: verify permissions against employee assignments
  if (isProPath && !isProOnboarding) {
    try {
      const url = new URL(request.url)
      // Skip API calls from middleware cycle
      if (!isApiRequest) {
        const guardUrl = new URL("/api/pro/guard", url.origin)
        guardUrl.searchParams.set("path", pathname)
        const res = await fetch(guardUrl, { headers: { cookie: request.headers.get("cookie") || "" } })
        if (!res.ok) {
          // Unauthorized or forbidden: bounce to /pro (dashboard)
          const redirectTo = new URL("/pro", request.url)
          redirectTo.searchParams.set("denied", "1")
          return NextResponse.redirect(redirectTo)
        }
      }
    } catch {
      // On error, be safe and redirect to /pro
      const redirectTo = new URL("/pro", request.url)
      redirectTo.searchParams.set("denied", "1")
      return NextResponse.redirect(redirectTo)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*", 
    "/pro/:path*", 
    "/client/:path*", 
    "/auth/:path*", 
    "/api/admin/:path*", 
    "/api/client/:path*"
  ]
}
