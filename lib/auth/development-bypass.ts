type DevelopmentAuthEnvironment = Readonly<{
  NODE_ENV?: string;
  DEV_AUTH_BYPASS?: string;
}>;

export type AdminAuthBoundary = "page" | "api" | null;

const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

export type DevelopmentAdminSession = {
  source: "development-auth-bypass";
  user: {
    id: null;
    email: "development@localhost";
    name: "Development Admin";
    role: "owner";
    mustChangePassword: false;
  };
  sessionId: null;
};

/**
 * The single authority for the local CMS authentication bypass.
 * Every non-development environment fails closed, even when the flag is set.
 */
export function isDevelopmentAuthBypassEnabled(
  environment: DevelopmentAuthEnvironment = process.env,
): boolean {
  return environment.NODE_ENV === "development" && environment.DEV_AUTH_BYPASS === "true";
}

export function isLoopbackRequestHost(host: string | null | undefined): boolean {
  if (!host) return false;
  try {
    return LOOPBACK_HOSTNAMES.has(new URL(`http://${host}`).hostname.replace(/^\[|\]$/g, "").toLowerCase());
  } catch {
    return false;
  }
}

export function isDevelopmentAuthBypassAllowed(
  host: string | null | undefined,
  environment: DevelopmentAuthEnvironment = process.env,
): boolean {
  return isDevelopmentAuthBypassEnabled(environment) && isLoopbackRequestHost(host);
}

export function classifyAdminAuthBoundary(pathname: string): AdminAuthBoundary {
  if (pathname === "/api/admin" || pathname.startsWith("/api/admin/")) return "api";
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLogin = pathname === "/admin/login" || pathname.startsWith("/admin/login/");
  const isPasswordChange = pathname === "/admin/change-password" || pathname.startsWith("/admin/change-password/");
  if (!isAdminPage || isLogin || isPasswordChange) {
    return null;
  }
  return "page";
}

export function shouldBypassAdminAuthentication(
  pathname: string,
  environment: DevelopmentAuthEnvironment = process.env,
  host?: string | null,
): boolean {
  return classifyAdminAuthBoundary(pathname) !== null && isDevelopmentAuthBypassAllowed(host, environment);
}

export function getDevelopmentAdminSession(): DevelopmentAdminSession {
  return {
    source: "development-auth-bypass",
    sessionId: null,
    user: {
      id: null,
      email: "development@localhost",
      name: "Development Admin",
      role: "owner",
      mustChangePassword: false,
    },
  };
}

export function isPersistentAdminSession<T extends { source: string }>(
  session: T,
): session is Extract<T, { source: "session" }> {
  return session.source === "session";
}

export function selectAdminSessionForRequest<T>(
  realSession: T | null,
  environment: DevelopmentAuthEnvironment = process.env,
  host?: string | null,
): T | DevelopmentAdminSession | null {
  if (realSession) return realSession;
  return isDevelopmentAuthBypassAllowed(host, environment) ? getDevelopmentAdminSession() : null;
}
