import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../../../lib/db";
import { artistProfiles } from "../../../lib/db/artist-management-schema";
import { artists, auditLogs, pages, posts } from "../../../lib/db/schema";
import { requireAdmin } from "../../../lib/auth";
import { DashboardView } from "../components/DashboardView";

export const dynamic = "force-dynamic";
type AuditItem = { id: string; action: string; entityType: string; createdAt: Date };
function countValue(rows: Array<{ count: number }>) { return rows[0]?.count ?? 0; }
function activityLabel(action: string) {
  const labels: Record<string, string> = { "artist.created": "Artista adicionado", "artist.updated": "Artista atualizado", "artist.published": "Artista publicado", "artist.unpublished": "Publicação de artista alterada", "artist.deleted": "Artista excluído", "post.created": "Notícia criada", "post.updated": "Notícia atualizada", "post.published": "Notícia publicada", "post.draft": "Notícia movida para rascunho", "post.archived": "Notícia arquivada", "page_section.updated": "Conteúdo de seção atualizado", "page_section_item.updated": "Conteúdo interno de seção atualizado", "media.created": "Mídia adicionada", "media.updated": "Mídia atualizada", "auth.login": "Acesso administrativo", "auth.logout": "Sessão administrativa encerrada" };
  return labels[action] || action;
}

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  let artistTotal = 0, artistPublished = 0, postPublished = 0, artistDrafts = 0, postDrafts = 0, activePages = 0;
  let recentAudits: AuditItem[] = [];
  let databaseAvailable = Boolean(process.env.DATABASE_URL);
  if (databaseAvailable) {
    try {
      const db = getDb();
      const [artistTotalRows, , , artistPublishedRows, publishedPostRows, draftArtistRows, draftPostRows, activePageRows, auditRows] = await Promise.all([
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
      artistTotal = countValue(artistTotalRows); artistPublished = countValue(artistPublishedRows); postPublished = countValue(publishedPostRows); artistDrafts = countValue(draftArtistRows); postDrafts = countValue(draftPostRows); activePages = countValue(activePageRows); recentAudits = auditRows;
    } catch (error) {
      console.error("CMS dashboard database unavailable; rendering without indicators.", error);
      databaseAvailable = false;
    }
  }
  return <DashboardView data={{ activePages: databaseAvailable ? activePages : null, artistDrafts: databaseAvailable ? artistDrafts : null, artistPublished: databaseAvailable ? artistPublished : null, artistTotal: databaseAvailable ? artistTotal : null, postDrafts: databaseAvailable ? postDrafts : null, postPublished: databaseAvailable ? postPublished : null, recentActivity: recentAudits.map((item) => ({ id: item.id, label: activityLabel(item.action), meta: `${item.entityType} · ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(item.createdAt)}` })) }} name={session.user.name} role={session.user.role} />;
}
