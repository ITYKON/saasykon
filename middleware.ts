import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "saas_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith("/auth/");
  const isApiRequest = pathname.startsWith("/api/");
  if (pathname === "/auth/logout") {
    return NextResponse.next();
  }
  const isProtected = ["/admin", "/pro", "/client", "/api/admin", "/api/client"].some((p) => pathname.startsWith(p));

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const rolesCookie = request.cookies.get("saas_roles")?.value ?? "";
  const roles = rolesCookie.split(",").filter(Boolean); // filter out empty entries
  const businessId = request.cookies.get("business_id")?.value;
  const SPECIAL_ADMIN_BUSINESS_ID = "00000000-0000-0000-0000-000000000000";
  
  // Users with ADMIN role have full access
  const isAdmin = roles.includes("ADMIN");
  
  // Users with special business_id AND any role are considered sub-admins (commercial, support, etc.)
  // They can access /admin routes but permissions will be checked at page/API level
  const isSubAdmin = businessId === SPECIAL_ADMIN_BUSINESS_ID && roles.length > 0;
  
  // Admin-equivalent: ADMIN role OR sub-admin with special business
  const canAccessAdmin = isAdmin || isSubAdmin;

  if (isProtected && !sessionToken) {
    if (isApiRequest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Block access to admin routes for users without admin privileges
  // Fine-grained permission checks are done at page/API level via requireAdminOrPermission()
  const isAdminPath = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (isAdminPath && !canAccessAdmin) {
    if (isApiRequest) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const url = new URL("/client/dashboard", request.url);
    return NextResponse.redirect(url);
  }

  // Redirect sub-admins trying to access client/pro routes to admin dashboard
  const isClientPath = pathname.startsWith("/client");
  const isProPath = pathname.startsWith("/pro");
  
  if (canAccessAdmin && (isClientPath || isProPath)) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  if (isAuthPage && sessionToken) {
    // Redirect based on roles and business_id
    if (canAccessAdmin) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (roles.includes("PRO")) {
      return NextResponse.redirect(new URL("/pro/dashboard", request.url));
    }
    // All other users go to client dashboard
    return NextResponse.redirect(new URL("/client/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/pro/:path*", "/client/:path*", "/auth/:path*", "/api/admin/:path*", "/api/client/:path*"],
};


