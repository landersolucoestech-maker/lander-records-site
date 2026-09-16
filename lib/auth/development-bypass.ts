type DevelopmentAuthEnvironment = Readonly<{
  NODE_ENV?: string;
  DEV_AUTH_BYPASS?: string;
  DEV_PREVIEW_PUBLIC_ACCESS?: string;
  GITHUB_ACTIONS?: string;
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
 * Local development bypass. This remains restricted to development + loopback.
 */
export function isDevelopmentAuthBypassEnabled(
  environment: DevelopmentAuthEnvironment = process.env,
): boolean {
  return environment.NODE_ENV === "development" && environment.DEV_AUTH_BYPASS === "true";
}

/**
 * Disposable GitHub Actions preview bypass.
 * It is intentionally allowed with NODE_ENV=production because the preview build
 * runs the production Next runtime, but it can only activate inside GitHub Actions
 * when the dedicated preview flag is explicitly enabled by the dev-preview workflow.
 */
export function isDisposablePreviewAuthBypassEnabled(
  environment: DevelopmentAuthEnvironment = process.env,
): boolean {
  return (
    environment.NODE_ENV === "production" &&
    environment.GITHUB_ACTIONS === "true" &&
    environment.DEV_PREVIEW_PUBLIC_ACCESS === "true"
  );
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

export function isAdminAuthBypassAllowed(
  host: string | null | undefined,
  environment: DevelopmentAuthEnvironment = process.env,
): boolean {
  return isDevelopmentAuthBypassAllowed(host, environment) || isDisposablePreviewAuthBypassEnabled(environment);
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
  return classifyAdminAuthBoundary(pathname) !== null && isAdminAuthBypassAllowed(host, environment);
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
  return isAdminAuthBypassAllowed(host, environment) ? getDevelopmentAdminSession() : null;
}
