export const ADMIN_ROLES = ["viewer", "editor", "admin", "owner"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export type SessionRecord = {
  expiresAt: Date;
  isActive: boolean;
  role: unknown;
};

export type AuthorizationSession = {
  user: {
    role: unknown;
    mustChangePassword: boolean;
  };
};

export type AdminAccessDecision =
  | "authorized"
  | "unauthenticated"
  | "password-change-required"
  | "forbidden";

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && ADMIN_ROLES.includes(value as AdminRole);
}

export function isValidSessionRecord(
  record: SessionRecord | null | undefined,
  now = new Date(),
): record is SessionRecord & { role: AdminRole } {
  return Boolean(
    record &&
    record.isActive === true &&
    record.expiresAt instanceof Date &&
    Number.isFinite(record.expiresAt.getTime()) &&
    record.expiresAt.getTime() > now.getTime() &&
    isAdminRole(record.role),
  );
}

export function hasMinimumRole(role: unknown, minimumRole: AdminRole): boolean {
  if (!isAdminRole(role)) return false;
  return ADMIN_ROLES.indexOf(role) >= ADMIN_ROLES.indexOf(minimumRole);
}

export function evaluateAdminAuthorization(
  session: AuthorizationSession | null | undefined,
  minimumRole: AdminRole = "viewer",
): AdminAccessDecision {
  if (!session) return "unauthenticated";
  if (session.user.mustChangePassword) return "password-change-required";
  if (!hasMinimumRole(session.user.role, minimumRole)) return "forbidden";
  return "authorized";
}
