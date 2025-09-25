import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "saas_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith("/auth/");
  if (pathname === "/auth/logout") {
    return NextResponse.next();
  }
  const isProtected = ["/admin", "/pro", "/client"].some((p) => pathname.startsWith(p));

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const roles = request.cookies.get("saas_roles")?.value?.split(",") ?? [];

  if (isProtected && !sessionToken) {
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // If already authenticated and on an auth page, send to appropriate home
  // If roles cookie is missing (legacy sessions or cookie issues), avoid forcing redirects
  // so the login page can reset cookies via a fresh auth flow.
  if (isAuthPage && sessionToken && roles.length > 0) {
    if (roles.includes("ADMIN")) return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    if (roles.includes("PRO")) return NextResponse.redirect(new URL("/pro/dashboard", request.url));
    return NextResponse.redirect(new URL("/client/dashboard", request.url));
  }

  // Role-based gating for sections
  if (sessionToken && roles.length > 0) {
    const isAdmin = roles.includes("ADMIN");
    const isPro = roles.includes("PRO") || isAdmin; // admins can access pro
    const isClient = roles.includes("CLIENT");

    if (pathname.startsWith("/admin")) {
      if (!isAdmin) {
        // Non-admins cannot access admin; send to their home
        const redirect = isPro ? "/pro/dashboard" : "/client/dashboard";
        return NextResponse.redirect(new URL(redirect, request.url));
      }
    }

    if (pathname.startsWith("/pro")) {
      if (!isPro) {
        // Only PRO or ADMIN can access /pro
        return NextResponse.redirect(new URL("/client/dashboard", request.url));
      }
    }

    if (pathname.startsWith("/client")) {
      if (!isClient) {
        // If no CLIENT role, prefer pro/admin area
        const redirect = isPro ? "/pro/dashboard" : "/auth/login";
        return NextResponse.redirect(new URL(redirect, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/pro/:path*", "/client/:path*", "/auth/:path*"],
};


