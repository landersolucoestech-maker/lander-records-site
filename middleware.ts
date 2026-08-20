import { NextResponse, type NextRequest } from "next/server";
import { AUTHENTICATION_ENABLED } from "./lib/auth-config";

const SESSION_COOKIE = "lander_admin_session";

export function middleware(request: NextRequest) {
  if (!AUTHENTICATION_ENABLED) return NextResponse.next();

  const pathname = request.nextUrl.pathname;
  const isAdminApi = pathname.startsWith("/api/admin");
  const isProtectedAdmin =
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/admin/login") &&
    !pathname.startsWith("/admin/change-password");

  if (!isAdminApi && !isProtectedAdmin) return NextResponse.next();

  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (hasSessionCookie) return NextResponse.next();

  if (isAdminApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const login = new URL("/admin/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
