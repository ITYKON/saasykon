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
  const roles = request.cookies.get("saas_roles")?.value?.split(",") ?? [];
  const businessId = request.cookies.get("business_id")?.value;
  const SPECIAL_ADMIN_BUSINESS_ID = "00000000-0000-0000-0000-000000000000";
  const isAdminEquivalent = roles.includes("ADMIN") || businessId === SPECIAL_ADMIN_BUSINESS_ID;

  if (isProtected && !sessionToken) {
    if (isApiRequest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Enforce ADMIN or admin-equivalent (special business) on admin routes (pages + API)
  const isAdminPath = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (isAdminPath && !isAdminEquivalent) {
    if (isApiRequest) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const url = new URL("/client/dashboard", request.url);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && sessionToken) {
    // Redirect based on roles and business_id
    if (isAdminEquivalent) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (roles.includes("PRO")) {
      return NextResponse.redirect(new URL("/pro/dashboard", request.url));
    }
    // All other users (including support/commercial with admin business_id) go to client dashboard
    return NextResponse.redirect(new URL("/client/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/pro/:path*", "/client/:path*", "/auth/:path*", "/api/admin/:path*", "/api/client/:path*"],
};


