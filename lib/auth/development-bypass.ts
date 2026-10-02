type DevelopmentAuthEnvironment = Readonly<{
  NODE_ENV?: string;
  DEV_AUTH_BYPASS?: string;
  DEV_PREVIEW_PUBLIC_ACCESS?: string;
  GITHUB_ACTIONS?: string;
}>;

export type AdminAuthBoundary = "page" | "api" | null;

const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);
const DISPOSABLE_PREVIEW_HOST_SUFFIX = ".trycloudflare.com";

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

function requestHostname(host: string | null | undefined): string | null {
  if (!host) return null;
  try {
    return new URL(`http://${host}`).hostname.replace(/^\[|\]$/g, "").toLowerCase();
  } catch {
    return null;
  }
}

/** Local development bypass. Restricted to development + loopback. */
export function isDevelopmentAuthBypassEnabled(
  environment: DevelopmentAuthEnvironment = process.env,
): boolean {
  return environment.NODE_ENV === "development" && environment.DEV_AUTH_BYPASS === "true";
}

/**
 * Disposable GitHub Actions preview bypass feature flag.
 * Host authorization is deliberately separate and mandatory at request time.
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
  const hostname = requestHostname(host);
  return Boolean(hostname && LOOPBACK_HOSTNAMES.has(hostname));
}

export function isDisposablePreviewRequestHost(host: string | null | undefined): boolean {
  const hostname = requestHostname(host);
  return Boolean(
    hostname &&
    (LOOPBACK_HOSTNAMES.has(hostname) || hostname.endsWith(DISPOSABLE_PREVIEW_HOST_SUFFIX)),
  );
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
  return (
    isDevelopmentAuthBypassAllowed(host, environment) ||
    (isDisposablePreviewAuthBypassEnabled(environment) && isDisposablePreviewRequestHost(host))
  );
}

export function classifyAdminAuthBoundary(pathname: string): AdminAuthBoundary {
  if (pathname === "/api/admin" || pathname.startsWith("/api/admin/")) return "api";
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLogin = pathname === "/admin/login" || pathname.startsWith("/admin/login/");
  const isPasswordChange = pathname === "/admin/change-password" || pathname.startsWith("/admin/change-password/");
  if (!isAdminPage || isLogin || isPasswordChange) return null;
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
