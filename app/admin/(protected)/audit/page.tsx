import Link from "next/link";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { requireAdmin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { adminUsers, artists, auditLogs, posts } from "../../../../lib/db/schema";
import { AdminIcon, type IconName } from "../../components/AdminIcon";
import styles from "../DashboardCrud.module.css";

export const dynamic = "force-dynamic";

function countValue(rows: Array<{ count: number }>) { return rows[0]?.count ?? 0; }
function Metric({ accent, icon, label, value, hint }: { accent: "red" | "blue" | "green" | "orange"; icon: IconName; label: string; value: number; hint: string }) {
  return <article className={`adminMetricCard is-${accent}`}><span className="adminMetricIcon"><AdminIcon name={icon} size={24} /></span><div className="adminMetricCopy"><span>{label}</span><strong className={styles.metricNumber}>{new Intl.NumberFormat("pt-BR").format(value)}</strong><small>{hint}</small></div></article>;
}

export default async function AuditPage() {
  await requireAdmin("admin");
  const db = getDb();
  const [rows, missingCardRows, missingHeroRows, draftPostRows] = await Promise.all([
    db.select({ log: auditLogs, actorName: adminUsers.name, actorEmail: adminUsers.email }).from(auditLogs).leftJoin(adminUsers, eq(auditLogs.actorUserId, adminUsers.id)).orderBy(desc(auditLogs.createdAt)).limit(500),
    db.select({ count: sql<number>`count(*)::int` }).from(artists).where(and(isNull(artists.cardMediaId), isNull(artists.archivedAt))),
    db.select({ count: sql<number>`count(*)::int` }).from(artists).where(and(isNull(artists.heroMediaId), isNull(artists.archivedAt))),
    db.select({ count: sql<number>`count(*)::int` }).from(posts).where(and(eq(posts.status, "draft"), isNull(posts.archivedAt))),
  ]);
  const missingCard = countValue(missingCardRows);
  const missingHero = countValue(missingHeroRows);
  const draftPosts = countValue(draftPostRows);

  return <div className="adminDashboard">
    <header className="adminDashboardHeading"><div><h1>Auditoria</h1><p>Pendências editoriais e rastreabilidade administrativa no mesmo sistema visual do Dashboard.</p></div></header>

    <section className="adminMetricGrid" aria-label="Resumo da auditoria">
      <Metric accent="red" icon="image" label="Sem imagem principal" value={missingCard} hint="artistas para revisar" />
      <Metric accent="orange" icon="media" label="Sem banner" value={missingHero} hint="páginas de artista" />
      <Metric accent="blue" icon="document" label="Rascunhos" value={draftPosts} hint="notícias pendentes" />
      <Metric accent="green" icon="audit" label="Eventos registrados" value={rows.length} hint="últimos registros carregados" />
    </section>

    <div className={styles.stack}>
      <section className={`adminDashboardPanel ${styles.panel}`}>
        <div className="adminAnalyticsPanelHeading"><div className="adminPanelHeadingIdentity"><span className="adminPanelHeadingIcon"><AdminIcon name="activity" size={20} /></span><div><h2>Conteúdos que precisam de manutenção</h2><p>Acesso direto às pendências que exigem intervenção editorial.</p></div></div></div>
        {missingCard || missingHero || draftPosts ? <div className={styles.maintenanceGrid}>
          {missingCard ? <Link className={styles.maintenanceCard} href="/admin/artists"><strong>{missingCard} artista{missingCard > 1 ? "s" : ""} sem imagem principal</strong><span>Revisar cards e listagens →</span></Link> : null}
          {missingHero ? <Link className={styles.maintenanceCard} href="/admin/artists"><strong>{missingHero} artista{missingHero > 1 ? "s" : ""} sem imagem banner</strong><span>Revisar páginas individuais →</span></Link> : null}
          {draftPosts ? <Link className={styles.maintenanceCard} href="/admin/posts"><strong>{draftPosts} notícia{draftPosts > 1 ? "s" : ""} em rascunho</strong><span>Revisar publicação →</span></Link> : null}
        </div> : <div className={styles.empty}>Nenhuma pendência editorial crítica identificada.</div>}
      </section>

      <section className={`adminDashboardPanel ${styles.panel}`}>
        <div className="adminAnalyticsPanelHeading"><div className="adminPanelHeadingIdentity"><span className="adminPanelHeadingIcon"><AdminIcon name="audit" size={20} /></span><div><h2>Registro de operações</h2><p>Últimos {rows.length} eventos administrativos.</p></div></div></div>
        <div className={styles.tableWrap}><table className={styles.table}>
          <thead><tr><th>Data</th><th>Ator</th><th>Ação</th><th>Entidade</th><th>Metadados</th></tr></thead>
          <tbody>{rows.map(({ log, actorName, actorEmail }) => <tr key={log.id}><td>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(log.createdAt)}</td><td>{actorName || "Sistema"}<br /><small>{actorEmail || ""}</small></td><td><span className={styles.code}>{log.action}</span></td><td>{log.entityType}<br /><small>{log.entityId || ""}</small></td><td><pre className={styles.json}>{JSON.stringify(log.metadata)}</pre></td></tr>)}</tbody>
        </table></div>
      </section>
    </div>
  </div>;
}
