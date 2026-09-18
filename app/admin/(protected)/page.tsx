import { and, desc, gte, isNull, lt, ne, sql } from "drizzle-orm";
import { getDb } from "../../../lib/db";
import { artists, auditLogs, contactSubmissions, pages, posts } from "../../../lib/db/schema";
import { requireAdmin } from "../../../lib/auth";
import { DashboardView } from "../components/DashboardView";

export const dynamic = "force-dynamic";
type AuditItem = { id: string; action: string; entityType: string; createdAt: Date };
type PublicationItem = { id: string; title: string; type: "Notícia" | "Artista" | "Página"; status: "draft" | "published" | "archived"; updatedAt: Date; href: string };

function activityLabel(action: string) {
  const labels: Record<string, string> = {
    "artist.created": "Novo artista cadastrado",
    "artist.updated": "Artista atualizado",
    "artist.published": "Artista publicado",
    "artist.unpublished": "Publicação de artista alterada",
    "artist.deleted": "Artista excluído",
    "artist_category.created": "Categoria de artista criada",
    "artist_category.updated": "Categoria de artista atualizada",
    "artist_category.deleted": "Categoria de artista excluída",
    "post.created": "Nova notícia criada",
    "post.updated": "Notícia atualizada",
    "post.published": "Nova notícia publicada",
    "post.draft": "Notícia movida para rascunho",
    "post.archived": "Notícia arquivada",
    "post.deleted": "Notícia excluída",
    "post_category.created": "Categoria de notícia criada",
    "post_category.updated": "Categoria de notícia atualizada",
    "post_category.deleted": "Categoria de notícia excluída",
    "page.deleted": "Página excluída",
    "page.section_created": "Seção de página criada",
    "page.section_attached": "Seção vinculada à página",
    "page.section_detached": "Seção removida da página",
    "page_section.updated": "Conteúdo de seção atualizado",
    "page_section_item.updated": "Conteúdo interno de seção atualizado",
    "navigation.created": "Item de navegação criado",
    "navigation.updated": "Item de navegação atualizado",
    "navigation.deleted": "Item de navegação excluído",
    "site_settings.company_updated": "Dados da empresa atualizados",
    "site_settings.identity_updated": "Identidade do site atualizada",
    "social_link.created": "Link social criado",
    "social_link.updated": "Link social atualizado",
    "contact_topic.created": "Assunto de contato criado",
    "contact_topic.updated": "Assunto de contato atualizado",
    "media.created": "Mídia enviada",
    "media.updated": "Mídia atualizada",
    "media.uploaded": "Mídia enviada",
    "media.archived": "Mídia arquivada",
    "integration.lander_records.updated": "Configurações de integração atualizadas",
    "integration.sync.requested": "Sincronização de integrações executada",
    "admin_user.created": "Usuário administrativo criado",
    "admin_user.updated": "Usuário administrativo atualizado",
    "admin_user.password_reset": "Senha administrativa redefinida",
    "auth.login": "Acesso administrativo",
    "auth.login_success": "Acesso administrativo",
    "auth.login_failed": "Tentativa de acesso administrativo falhou",
    "auth.password_changed": "Senha administrativa alterada",
    "auth.logout": "Sessão administrativa encerrada",
  };
  return labels[action] || action;
}

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  let recentAudits: AuditItem[] = [];
  let recentPublications: PublicationItem[] = [];
  let leadCount: number | null = null;
  let previousLeadChange: number | null = null;
  let databaseAvailable = Boolean(process.env.DATABASE_URL);

  if (databaseAvailable) {
    try {
      const db = getDb();
      const now = new Date();
      const currentLeadPeriodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const previousLeadPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const [auditRows, postRows, artistRows, pageRows, currentLeadRows, previousLeadRows] = await Promise.all([
        db.select({ id: auditLogs.id, action: auditLogs.action, entityType: auditLogs.entityType, createdAt: auditLogs.createdAt }).from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(8),
        db.select({ id: posts.id, title: posts.title, status: posts.status, updatedAt: posts.updatedAt }).from(posts).where(isNull(posts.archivedAt)).orderBy(desc(posts.updatedAt)).limit(5),
        db.select({ id: artists.id, title: artists.name, isPublished: artists.isPublished, updatedAt: artists.updatedAt }).from(artists).where(isNull(artists.archivedAt)).orderBy(desc(artists.updatedAt)).limit(5),
        db.select({ id: pages.id, title: pages.title, enabled: pages.enabled, updatedAt: pages.updatedAt }).from(pages).orderBy(desc(pages.updatedAt)).limit(5),
        db.select({ count: sql<number>`count(*)::int` }).from(contactSubmissions).where(and(gte(contactSubmissions.createdAt, currentLeadPeriodStart), ne(contactSubmissions.status, "spam"))),
        db.select({ count: sql<number>`count(*)::int` }).from(contactSubmissions).where(and(gte(contactSubmissions.createdAt, previousLeadPeriodStart), lt(contactSubmissions.createdAt, currentLeadPeriodStart), ne(contactSubmissions.status, "spam"))),
      ]);
      recentAudits = auditRows;
      leadCount = currentLeadRows[0]?.count ?? 0;
      const previousLeadCount = previousLeadRows[0]?.count ?? 0;
      previousLeadChange = previousLeadCount > 0 ? ((leadCount - previousLeadCount) / previousLeadCount) * 100 : null;
      recentPublications = [
        ...postRows.map((item) => ({ ...item, type: "Notícia" as const, href: "/admin/posts" })),
        ...artistRows.map((item) => ({ id: item.id, title: item.title, type: "Artista" as const, status: item.isPublished ? "published" as const : "draft" as const, updatedAt: item.updatedAt, href: "/admin/artists" })),
        ...pageRows.map((item) => ({ id: item.id, title: item.title, type: "Página" as const, status: item.enabled ? "published" as const : "draft" as const, updatedAt: item.updatedAt, href: `/admin/pages/${item.id}/view` })),
      ].sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime()).slice(0, 5);
    } catch (error) {
      console.error("CMS dashboard database unavailable; rendering without database-backed summaries.", error);
      databaseAvailable = false;
    }
  }

  const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
  const dateOnly = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });

  return <DashboardView
    data={{
      analytics: databaseAvailable && leadCount !== null ? { visitors: null, views: null, engagementRate: null, conversions: leadCount, previousConversionsChange: previousLeadChange } : null,
      recentActivity: databaseAvailable ? recentAudits.map((item) => ({ id: item.id, label: activityLabel(item.action), meta: `${item.entityType} · ${dateTime.format(item.createdAt)}` })) : [],
      recentPublications: databaseAvailable ? recentPublications.map((item) => ({ id: item.id, title: item.title, type: item.type, status: item.status, updatedAt: dateOnly.format(item.updatedAt), href: item.href })) : [],
    }}
    demoMode={session.source === "development-auth-bypass"}
    name={session.user.name}
    readOnly={session.source !== "session"}
    role={session.user.role}
  />;
}
