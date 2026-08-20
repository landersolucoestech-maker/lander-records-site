import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { adminUsers, auditLogs } from "../../../../lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  await requireAdmin("admin");
  const db = getDb();
  const rows = await db.select({
    log: auditLogs,
    actorName: adminUsers.name,
    actorEmail: adminUsers.email,
  }).from(auditLogs).leftJoin(adminUsers, eq(auditLogs.actorUserId, adminUsers.id)).orderBy(desc(auditLogs.createdAt)).limit(500);

  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">GOVERNANÇA</p><h1>Auditoria</h1><p>Últimas 500 operações relevantes do painel administrativo.</p></div></header>
      <section className="adminPanel"><table className="adminTable"><thead><tr><th>Data</th><th>Ator</th><th>Ação</th><th>Entidade</th><th>Metadados</th></tr></thead><tbody>{rows.map(({log,actorName,actorEmail}) => <tr key={log.id}><td>{new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"medium"}).format(log.createdAt)}</td><td>{actorName || "Sistema"}<br/><small>{actorEmail || ""}</small></td><td><span className="adminCode">{log.action}</span></td><td>{log.entityType}<br/><small>{log.entityId || ""}</small></td><td><pre style={{whiteSpace:"pre-wrap",margin:0}}>{JSON.stringify(log.metadata)}</pre></td></tr>)}</tbody></table></section>
    </div>
  );
}
