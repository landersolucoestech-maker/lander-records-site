import { NextResponse, type NextRequest } from "next/server.js";
import {
  classifyAdminAuthBoundary,
  shouldBypassAdminAuthentication,
} from "./lib/auth/development-bypass.ts";

const SESSION_COOKIE = "lander_admin_session";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const boundary = classifyAdminAuthBoundary(pathname);

  if (!boundary) return NextResponse.next();
  const requestHost = request.headers.get("host") || request.nextUrl.host;
  if (shouldBypassAdminAuthentication(pathname, process.env, requestHost)) return NextResponse.next();

  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (hasSessionCookie) return NextResponse.next();

  if (boundary === "api") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const login = new URL("/admin/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
