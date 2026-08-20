"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "../../../lib/db";
import { adminUsers } from "../../../lib/db/schema";
import { audit, createAdminSession, verifyPassword } from "../../../lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) redirect("/admin/login?error=credentials");

  const db = getDb();
  const rows = await db
    .select()
    .from(adminUsers)
    .where(and(eq(adminUsers.email, email), eq(adminUsers.isActive, true)))
    .limit(1);
  const user = rows[0];

  if (!user) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    redirect("/admin/login?error=credentials");
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    redirect("/admin/login?error=locked");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const failures = user.failedLoginAttempts + 1;
    await db.update(adminUsers).set({
      failedLoginAttempts: failures,
      lockedUntil: failures >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
      updatedAt: new Date(),
    }).where(eq(adminUsers.id, user.id));
    await audit(user.id, "auth.login_failed", "admin_user", user.id, { failures });
    redirect("/admin/login?error=credentials");
  }

  await db.update(adminUsers).set({
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(adminUsers.id, user.id));

  await createAdminSession(user.id);
  await audit(user.id, "auth.login_success", "admin_user", user.id);
  redirect(user.mustChangePassword ? "/admin/change-password" : "/admin");
}
