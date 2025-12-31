import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getAuthUserFromCookies } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    
    // Suppression du cookie des rôles
    response.cookies.set('saas_roles', '', {
      ...cookieOptions,
      httpOnly: false,
    })
    
    // Suppression du cookie business_id
    response.cookies.set('business_id', '', {
      ...cookieOptions,
      httpOnly: false,
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
  
  // Vérifier si l'utilisateur a déjà soumis ses documents de vérification
  let hasSubmittedDocuments = false;
  if (sessionToken && pathname.startsWith('/pro/') && !pathname.startsWith('/pro/documents-verification')) {
    try {
      const user = await getAuthUserFromCookies();
      if (user) {
        const business = await prisma.businesses.findFirst({
          where: { owner_user_id: user.id },
          include: { business_verifications: true }
        });
        
        // Si l'entreprise est marquée comme provenant d'un lead et qu'aucune vérification n'existe
        if (business?.claim_status === 'not_claimable' && !business.business_verifications.length) {
          hasSubmittedDocuments = false;
          
          // Rediriger vers la page de vérification des documents si ce n'est pas déjà la page actuelle
          if (!pathname.startsWith('/pro/documents-verification')) {
            return NextResponse.redirect(new URL('/pro/documents-verification', request.url));
          }
        } else {
          hasSubmittedDocuments = true;
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des documents:', error);
      // En cas d'erreur, on laisse passer pour ne pas bloquer l'utilisateur
      hasSubmittedDocuments = true;
    }
  }

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

  // Log des informations de base pour le débogage
  console.log('=== MIDDLEWARE DEBUG ===');
  console.log('Path:', pathname);
  console.log('Is API Request:', isApiRequest);
  console.log('Session Token:', sessionToken ? 'Present' : 'Missing');
  console.log('User Roles:', roles);
  console.log('Business ID:', businessId || 'Not set');
  console.log('Onboarding Done:', request.cookies.get('onboarding_done')?.value || 'false');
  console.log('=======================');

  // Fine-grained guard for PRO area: verify permissions against employee assignments
  if (isProPath && !isProOnboarding) {
    console.log('=== PRO AREA ACCESS CHECK ===');
    console.log('Path:', pathname);
    console.log('Session Token:', sessionToken ? 'Present' : 'Missing');
    console.log('User Roles:', roles);
    console.log('Business ID:', businessId || 'Not set');
    
    // Skip if we're already in a redirect loop
    if (pathname === '/pro' && request.nextUrl.searchParams.get('denied') === '1') {
      console.log('Redirect loop detected, showing access denied');
      return NextResponse.redirect(new URL('/pro/access-denied', request.url));
    }

    // Vérification basique des rôles sans faire d'appel fetch
    const hasProRole = roles.includes('PRO');
    const hasAdminRole = roles.includes('ADMIN');
    const hasBusinessId = !!businessId;
    const hasEmployeeRole = roles.includes('EMPLOYEE');

    console.log('Role Check - PRO:', hasProRole, 'ADMIN:', hasAdminRole, 'EMPLOYEE:', hasEmployeeRole, 'Business ID Present:', hasBusinessId);

    // Si l'utilisateur n'a aucun rôle autorisé, on refuse l'accès
    if (!hasProRole && !hasAdminRole && !hasEmployeeRole) {
      console.log('Access denied: User has no authorized role');
      // Si l'utilisateur a une session mais pas de rôle, le déconnecter
      if (sessionToken) {
        console.log('User has session but no valid role, redirecting to logout');
        return NextResponse.redirect(new URL('/auth/logout', request.url));
      }
      return NextResponse.redirect(new URL('/auth/signin?error=unauthorized', request.url));
    }

    // Si l'utilisateur est PRO/EMPLOYEE mais n'a pas de business_id, on redirige vers l'onboarding
    if ((hasProRole || hasEmployeeRole) && !hasAdminRole && !hasBusinessId) {
      console.log('Redirecting to onboarding: User without business_id');
      return NextResponse.redirect(new URL('/pro/onboarding', request.url));
    }

    // Si l'utilisateur a le rôle ADMIN mais pas de business_id, on utilise le business_id spécial
    if (hasAdminRole && !hasBusinessId) {
      console.log('Admin user without business_id, using special business_id');
      const response = NextResponse.next();
      response.cookies.set('business_id', '00000000-0000-0000-0000-000000000000', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      return response;
    }

    console.log('Access granted to PRO area');
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
