import { compare, hash } from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { AUTHENTICATION_ENABLED } from "./auth-config";
import { getDb } from "./db";
import { adminSessions, adminUsers, auditLogs } from "./db/schema";

export const SESSION_COOKIE = "lander_admin_session";
const SESSION_DAYS = 7;

export type AdminRole = "owner" | "admin" | "editor" | "viewer";

export type AdminSession = {
  user: {
    id: string;
    email: string;
    name: string;
    role: AdminRole;
    mustChangePassword: boolean;
  };
  sessionId: string;
};

const AUTH_DISABLED_SESSION: AdminSession = {
  sessionId: "authentication-disabled",
  user: {
    id: "00000000-0000-0000-0000-000000000000",
    email: "",
    name: "Lander CMS",
    role: "owner",
    mustChangePassword: false,
  },
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function roleLevel(role: AdminRole) {
  return { viewer: 1, editor: 2, admin: 3, owner: 4 }[role];
}

export async function getAdminSession(): Promise<AdminSession | null> {
  if (!AUTHENTICATION_ENABLED) {
    return AUTH_DISABLED_SESSION;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = getDb();
  const rows = await db
    .select({
      sessionId: adminSessions.id,
      userId: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
      isActive: adminUsers.isActive,
      mustChangePassword: adminUsers.mustChangePassword,
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.userId, adminUsers.id))
    .where(
      and(
        eq(adminSessions.tokenHash, hashToken(token)),
        gt(adminSessions.expiresAt, new Date()),
        eq(adminUsers.isActive, true),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row || !row.isActive) return null;

  return {
    sessionId: row.sessionId,
    user: {
      id: row.userId,
      email: row.email,
      name: row.name,
      role: row.role as AdminRole,
      mustChangePassword: row.mustChangePassword,
    },
  };
}

export async function requireAdmin(minimumRole: AdminRole = "viewer") {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (roleLevel(session.user.role) < roleLevel(minimumRole)) {
    redirect("/admin?error=forbidden");
  }
  return session;
}

export async function createAdminSession(userId: string) {
  const db = getDb();
  const rawToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent") || "";

  await db.insert(adminSessions).values({
    userId,
    tokenHash: hashToken(rawToken),
    expiresAt,
    userAgent,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroyAdminSession() {
  if (!AUTHENTICATION_ENABLED) return;

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const db = getDb();
    await db.delete(adminSessions).where(eq(adminSessions.tokenHash, hashToken(token)));
  }

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export async function hashPassword(password: string) {
  if (password.length < 12) {
    throw new Error("A senha administrativa precisa ter pelo menos 12 caracteres.");
  }
  return hash(password, 12);
}

export async function audit(
  actorUserId: string | null,
  action: string,
  entityType: string,
  entityId?: string | null,
  metadata: Record<string, unknown> = {},
) {
  const db = getDb();
  await db.insert(auditLogs).values({
    actorUserId: AUTHENTICATION_ENABLED ? actorUserId || null : null,
    action,
    entityType,
    entityId: entityId || null,
    metadata,
  });
}
