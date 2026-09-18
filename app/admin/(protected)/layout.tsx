import { desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { adminUsers, auditLogs } from "../../../lib/db/schema";
import { logoutAction } from "../actions";
import { AdminShell, type AdminNotificationItem } from "../components/AdminShell";
import "../dashboard.css";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  if (session.user.mustChangePassword) redirect("/admin/change-password");

  const notificationRows = await getDb()
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorName: adminUsers.name,
    })
    .from(auditLogs)
    .leftJoin(adminUsers, eq(auditLogs.actorUserId, adminUsers.id))
    .where(inArray(auditLogs.entityType, ["artist", "post", "media_asset"]))
    .orderBy(desc(auditLogs.createdAt))
    .limit(12);

  const notifications: AdminNotificationItem[] = notificationRows.map((row) => ({
    id: row.id,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
    actorName: row.actorName || "Sistema",
  }));

  return <AdminShell
    email={session.user.email}
    footerAction={<form action={logoutAction}><button type="submit">Sair</button></form>}
    name={session.user.name}
    notifications={notifications}
    notificationScope={session.user.id}
    role={session.user.role}
    sessionSource={session.source}
  >{children}</AdminShell>;
}
