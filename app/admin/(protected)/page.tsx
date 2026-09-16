import { desc, isNull } from "drizzle-orm";
import { getDb } from "../../../lib/db";
import { auditLogs, posts } from "../../../lib/db/schema";
import { requireAdmin } from "../../../lib/auth";
import { DashboardView } from "../components/DashboardView";

export const dynamic = "force-dynamic";
type AuditItem = { id: string; action: string; entityType: string; createdAt: Date };
type PublicationItem = { id: string; title: string; status: "draft" | "published" | "archived"; updatedAt: Date };

function activityLabel(action: string) {
  const labels: Record<string, string> = {
    "artist.created": "Novo artista cadastrado",
    "artist.updated": "Artista atualizado",
    "artist.published": "Artista publicado",
    "artist.unpublished": "Publicação de artista alterada",
    "artist.deleted": "Artista excluído",
    "post.created": "Nova notícia criada",
    "post.updated": "Notícia atualizada",
    "post.published": "Nova notícia publicada",
    "post.draft": "Notícia movida para rascunho",
    "post.archived": "Notícia arquivada",
    "page_section.updated": "Conteúdo de seção atualizado",
    "page_section_item.updated": "Conteúdo interno de seção atualizado",
    "media.created": "Mídia enviada",
    "media.updated": "Mídia atualizada",
    "auth.login": "Acesso administrativo",
    "auth.logout": "Sessão administrativa encerrada",
  };
  return labels[action] || action;
}

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  let recentAudits: AuditItem[] = [];
  let recentPosts: PublicationItem[] = [];
  let databaseAvailable = Boolean(process.env.DATABASE_URL);

  if (databaseAvailable) {
    try {
      const db = getDb();
      const [auditRows, postRows] = await Promise.all([
        db.select({ id: auditLogs.id, action: auditLogs.action, entityType: auditLogs.entityType, createdAt: auditLogs.createdAt }).from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(8),
        db.select({ id: posts.id, title: posts.title, status: posts.status, updatedAt: posts.updatedAt }).from(posts).where(isNull(posts.archivedAt)).orderBy(desc(posts.updatedAt)).limit(5),
      ]);
      recentAudits = auditRows;
      recentPosts = postRows;
    } catch (error) {
      console.error("CMS dashboard database unavailable; rendering without database-backed summaries.", error);
      databaseAvailable = false;
    }
  }

  const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
  const dateOnly = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });

  return <DashboardView
    data={{
      analytics: null,
      recentActivity: databaseAvailable ? recentAudits.map((item) => ({ id: item.id, label: activityLabel(item.action), meta: `${item.entityType} · ${dateTime.format(item.createdAt)}` })) : [],
      recentPublications: databaseAvailable ? recentPosts.map((item) => ({ id: item.id, title: item.title, type: "Notícia", status: item.status, updatedAt: dateOnly.format(item.updatedAt) })) : [],
    }}
    demoMode={session.source === "development-auth-bypass"}
    name={session.user.name}
    readOnly={session.source !== "session"}
    role={session.user.role}
  />;
}
