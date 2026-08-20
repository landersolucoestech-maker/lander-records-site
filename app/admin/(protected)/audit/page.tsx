import Link from "next/link";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { requireAdmin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { adminUsers, artists, auditLogs, posts } from "../../../../lib/db/schema";

export const dynamic = "force-dynamic";

function countValue(rows: Array<{ count: number }>) {
  return rows[0]?.count ?? 0;
}

export default async function AuditPage() {
  await requireAdmin("admin");
  const db = getDb();
  const [rows, missingCardRows, missingHeroRows, draftPostRows] = await Promise.all([
    db.select({
      log: auditLogs,
      actorName: adminUsers.name,
      actorEmail: adminUsers.email,
    }).from(auditLogs).leftJoin(adminUsers, eq(auditLogs.actorUserId, adminUsers.id)).orderBy(desc(auditLogs.createdAt)).limit(500),
    db.select({ count: sql<number>`count(*)::int` }).from(artists).where(and(isNull(artists.cardMediaId), isNull(artists.archivedAt))),
    db.select({ count: sql<number>`count(*)::int` }).from(artists).where(and(isNull(artists.heroMediaId), isNull(artists.archivedAt))),
    db.select({ count: sql<number>`count(*)::int` }).from(posts).where(and(eq(posts.status, "draft"), isNull(posts.archivedAt))),
  ]);

  const missingCard = countValue(missingCardRows);
  const missingHero = countValue(missingHeroRows);
  const draftPosts = countValue(draftPostRows);

  return (
    <div className="adminPage">
      <header className="adminPageHeader">
        <div>
          <h1>Auditoria</h1>
          <p>Pendências operacionais, manutenção de conteúdo e registro das operações administrativas.</p>
        </div>
      </header>

      <section className="adminPanel adminStack">
        <h2>Conteúdos que precisam de manutenção</h2>
        {missingCard ? <Link className="adminSectionCard" href="/admin/artists"><strong>{missingCard} artista{missingCard > 1 ? "s" : ""} sem imagem principal</strong><span>Revisar cards e listagens →</span></Link> : null}
        {missingHero ? <Link className="adminSectionCard" href="/admin/artists"><strong>{missingHero} artista{missingHero > 1 ? "s" : ""} sem imagem banner</strong><span>Revisar páginas individuais →</span></Link> : null}
        {draftPosts ? <Link className="adminSectionCard" href="/admin/posts"><strong>{draftPosts} notícia{draftPosts > 1 ? "s" : ""} em rascunho</strong><span>Revisar publicação →</span></Link> : null}
        {!missingCard && !missingHero && !draftPosts ? <div className="adminEmpty">Nenhuma pendência editorial crítica identificada.</div> : null}
      </section>

      <section className="adminPanel">
        <h2>Registro de operações</h2>
        <table className="adminTable">
          <thead><tr><th>Data</th><th>Ator</th><th>Ação</th><th>Entidade</th><th>Metadados</th></tr></thead>
          <tbody>{rows.map(({log,actorName,actorEmail}) => <tr key={log.id}><td>{new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"medium"}).format(log.createdAt)}</td><td>{actorName || "Sistema"}<br/><small>{actorEmail || ""}</small></td><td><span className="adminCode">{log.action}</span></td><td>{log.entityType}<br/><small>{log.entityId || ""}</small></td><td><pre style={{whiteSpace:"pre-wrap",margin:0}}>{JSON.stringify(log.metadata)}</pre></td></tr>)}</tbody>
        </table>
      </section>
    </div>
  );
}
