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

  if (isAuthPage && sessionToken) {
    // Redirect based on roles
    if (roles.includes("ADMIN")) return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    if (roles.includes("PRO")) return NextResponse.redirect(new URL("/pro/dashboard", request.url));
    return NextResponse.redirect(new URL("/client/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/pro/:path*", "/client/:path*", "/auth/:path*"],
};


