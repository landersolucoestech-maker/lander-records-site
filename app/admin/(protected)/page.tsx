import Link from "next/link";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../../../lib/db";
import { artistProfiles } from "../../../lib/db/artist-management-schema";
import { artists, auditLogs, pages, posts } from "../../../lib/db/schema";

export const dynamic = "force-dynamic";

type AuditItem = {
  id: string;
  action: string;
  entityType: string;
  createdAt: Date;
};

function countValue(rows: Array<{ count: number }>) {
  return rows[0]?.count ?? 0;
}

function activityLabel(action: string) {
  const labels: Record<string, string> = {
    "artist.created": "Artista adicionado",
    "artist.updated": "Artista atualizado",
    "artist.published": "Artista publicado",
    "artist.unpublished": "Publicação de artista alterada",
    "artist.deleted": "Artista excluído",
    "post.created": "Notícia criada",
    "post.updated": "Notícia atualizada",
    "post.published": "Notícia publicada",
    "post.draft": "Notícia movida para rascunho",
    "post.archived": "Notícia arquivada",
    "page_section.updated": "Conteúdo de seção atualizado",
    "page_section_item.updated": "Conteúdo interno de seção atualizado",
    "media.created": "Mídia adicionada",
    "media.updated": "Mídia atualizada",
    "auth.login": "Acesso administrativo",
    "auth.logout": "Sessão administrativa encerrada",
  };
  return labels[action] || action;
}

export default async function AdminDashboardPage() {
  let artistTotal = 0;
  let artistActive = 0;
  let artistInactive = 0;
  let artistPublished = 0;
  let postPublished = 0;
  let drafts = 0;
  let activePages = 0;
  let recentAudits: AuditItem[] = [];
  let databaseAvailable = Boolean(process.env.DATABASE_URL);

  if (databaseAvailable) {
    try {
      const db = getDb();
      const [
        artistTotalRows,
        artistActiveRows,
        artistInactiveRows,
        artistPublishedRows,
        publishedPostRows,
        draftArtistRows,
        draftPostRows,
        activePageRows,
        auditRows,
      ] = await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(artists).where(isNull(artists.archivedAt)),
        db.select({ count: sql<number>`count(*)::int` }).from(artistProfiles).where(eq(artistProfiles.isActive, true)),
        db.select({ count: sql<number>`count(*)::int` }).from(artistProfiles).where(eq(artistProfiles.isActive, false)),
        db.select({ count: sql<number>`count(*)::int` }).from(artists).where(and(eq(artists.isPublished, true), isNull(artists.archivedAt))),
        db.select({ count: sql<number>`count(*)::int` }).from(posts).where(and(eq(posts.status, "published"), isNull(posts.archivedAt))),
        db.select({ count: sql<number>`count(*)::int` }).from(artists).where(and(eq(artists.isPublished, false), isNull(artists.archivedAt))),
        db.select({ count: sql<number>`count(*)::int` }).from(posts).where(and(eq(posts.status, "draft"), isNull(posts.archivedAt))),
        db.select({ count: sql<number>`count(*)::int` }).from(pages).where(eq(pages.enabled, true)),
        db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(12),
      ]);

      artistTotal = countValue(artistTotalRows);
      artistActive = countValue(artistActiveRows);
      artistInactive = countValue(artistInactiveRows);
      artistPublished = countValue(artistPublishedRows);
      postPublished = countValue(publishedPostRows);
      drafts = countValue(draftArtistRows) + countValue(draftPostRows);
      activePages = countValue(activePageRows);
      recentAudits = auditRows;
    } catch (error) {
      console.error("CMS dashboard database unavailable; rendering temporary preview mode.", error);
      databaseAvailable = false;
    }
  }

  const cards = [
    ["Total de artistas", artistTotal, databaseAvailable ? `${artistActive} ativos · ${artistInactive} inativos` : "Banco ainda não conectado", "/admin/artists"],
    ["Artistas publicados", artistPublished, databaseAvailable ? `${Math.max(artistTotal - artistPublished, 0)} fora de publicação` : "Visualização temporária", "/admin/artists"],
    ["Notícias publicadas", postPublished, databaseAvailable ? "Conteúdo editorial público" : "Visualização temporária", "/admin/posts"],
    ["Rascunhos", drafts, databaseAvailable ? "Artistas + notícias aguardando publicação" : "Visualização temporária", "/admin/posts"],
    ["Páginas ativas", activePages, databaseAvailable ? "Estrutura detectada no projeto" : "Visualização temporária", "/admin/pages"],
  ] as const;

  return (
    <div className="adminPage">
      <header className="adminPageHeader">
        <div>
          <h1>Dashboard</h1>
          <p>Painel operacional do conteúdo publicado, pendências editoriais e atividades recentes do site.</p>
        </div>
      </header>

      {!databaseAvailable ? (
        <section className="adminPanel adminStack">
          <strong>CMS liberado para visualização</strong>
          <span>O acesso está sem autenticação neste momento. O banco de dados da Lander Records ainda não está conectado neste ambiente, então os indicadores aparecem zerados temporariamente.</span>
        </section>
      ) : null}

      <div className="adminMetricGrid">
        {cards.map(([label, value, detail, href]) => (
          <Link className="adminMetricCard" href={href} key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{detail}</small>
          </Link>
        ))}
      </div>

      <section className="adminPanel adminStack">
        <h2>Atividades recentes</h2>
        {recentAudits.length ? recentAudits.map((item) => (
          <div className="adminSectionCard" key={item.id}>
            <strong>{activityLabel(item.action)}</strong>
            <span>{item.entityType} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(item.createdAt)}</span>
          </div>
        )) : <div className="adminEmpty">{databaseAvailable ? "Nenhuma atividade registrada." : "Atividades ficarão disponíveis quando o banco for conectado."}</div>}
      </section>
    </div>
  );
}
