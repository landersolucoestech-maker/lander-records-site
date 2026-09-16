"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminIcon } from "../../components/AdminIcon";
import styles from "./NewsManager.module.css";

export type PostSummary = {
  id: string; title: string; slug: string; excerpt: string;
  status: "draft" | "published" | "archived" | "unpublished";
  category: string; authorName: string; publishedAt: string; coverImage: string;
  featuredOnHome: boolean; tags: string[]; isPubliclyVisible: boolean; updatedAt: string;
};

type Filters = { category?: string; q?: string; status?: string; tag?: string };
type ContentView = "publications" | "collaborations";
type Metrics = { archived: number; drafts: number; published: number; total: number };

const statusLabel: Record<PostSummary["status"], string> = { published: "Publicado", draft: "Rascunho", archived: "Arquivado", unpublished: "Não publicado" };
function StatusBadge({ status }: { status: PostSummary["status"] }) { return <span className={`${styles.statusBadge} ${styles[status]}`}>{statusLabel[status]}</span>; }
function clampPage(page: number, totalPages: number) { return Math.min(Math.max(page, 1), Math.max(totalPages, 1)); }
function Metric({ accent, icon, label, value, hint }: { accent: "red" | "blue" | "green" | "orange"; icon: "posts" | "check" | "document" | "audit"; label: string; value: number; hint: string }) {
  return <article className={`adminMetricCard is-${accent}`}><span className="adminMetricIcon"><AdminIcon name={icon} size={24} /></span><div className="adminMetricCopy"><span>{label}</span><strong>{new Intl.NumberFormat("pt-BR").format(value)}</strong><small>{hint}</small></div></article>;
}

export default function PostManager({ canEdit = true, deleted, metrics = { archived: 0, drafts: 0, published: 0, total: 0 }, posts, preview = false }: {
  availableCategories?: string[]; availableTags?: string[]; canEdit?: boolean; deleted?: boolean; initialFilters?: Filters; metrics?: Metrics; posts: PostSummary[]; preview?: boolean;
}) {
  const [view, setView] = useState<ContentView>("publications");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(posts.length / pageSize));
  const safePage = clampPage(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const visiblePosts = useMemo(() => posts.slice(startIndex, startIndex + pageSize), [pageSize, posts, startIndex]);
  const firstShown = posts.length ? startIndex + 1 : 0;
  const lastShown = Math.min(startIndex + visiblePosts.length, posts.length);
  const changePageSize = (value: number) => { setPageSize(value); setPage(1); };

  return <div className="adminDashboard" data-testid="news-manager">
    <header className="adminDashboardHeading"><div><h1>Conteúdos</h1><p>Gerencie publicações, estados editoriais e distribuição de notícias da Lander Records.</p></div>{canEdit && !preview ? <Link className="adminPrimaryCompact" href="/admin/posts/new"><AdminIcon name="plus" size={14} />Nova publicação</Link> : null}</header>

    <section className="adminMetricGrid" aria-label="Resumo editorial">
      <Metric accent="red" icon="posts" label="Publicações" value={metrics.total} hint="total cadastrado" />
      <Metric accent="green" icon="check" label="Publicadas" value={metrics.published} hint="visíveis no site" />
      <Metric accent="blue" icon="document" label="Rascunhos" value={metrics.drafts} hint="aguardando revisão" />
      <Metric accent="orange" icon="audit" label="Arquivadas" value={metrics.archived} hint="fora de circulação" />
    </section>

    {deleted ? <div className="adminNotice">Publicação excluída com sucesso.</div> : null}

    <nav aria-label="Visualização de conteúdo" className={styles.viewTabs}>
      <button aria-current={view === "publications" ? "page" : undefined} className={view === "publications" ? styles.activeTab : undefined} onClick={() => setView("publications")} type="button"><AdminIcon name="posts" size={15} /><span>Publicações</span></button>
      <button aria-current={view === "collaborations" ? "page" : undefined} className={view === "collaborations" ? styles.activeTab : undefined} onClick={() => setView("collaborations")} type="button"><AdminIcon name="mail" size={15} /><span>Colaborações recebidas</span></button>
    </nav>

    {view === "publications" ? <section className={styles.catalog} aria-label="Publicações">
      {posts.length ? <div className={`adminDashboardPanel tableview-surface cms-tableview-surface ${styles.tableSurface}`} aria-label="Publicações cadastradas">
        <div className="adminAnalyticsPanelHeading"><div className="adminPanelHeadingIdentity"><span className="adminPanelHeadingIcon"><AdminIcon name="posts" size={20} /></span><div><h2>Publicações cadastradas</h2><p>{posts.length} {posts.length === 1 ? "registro" : "registros"} no catálogo editorial.</p></div></div></div>
        <section className={`table-card ${styles.tableCard}`}><div className={styles.scrollArea}><table>
          <thead><tr><th>Conteúdo</th><th>Categoria</th><th>Slug</th><th>Status</th><th>Autor</th><th>Atualização</th><th className={styles.actions}>Ações</th></tr></thead>
          <tbody>{visiblePosts.map((post) => <tr data-testid="news-row" key={post.id}>
            <td><div className={`table-primary ${styles.identity}`}><span className={styles.documentIcon} aria-hidden="true"><AdminIcon name="document" size={15} /></span><span><strong>{post.title}</strong><small>{post.excerpt || "Sem resumo"}</small></span></div></td>
            <td><span className={styles.category}>{post.category || "Sem categoria"}</span></td><td><span className={styles.slug}>/noticias/{post.slug}</span></td><td><StatusBadge status={post.status} /></td><td><span className={styles.author}>{post.authorName || "—"}</span></td><td><time className={styles.date}>{post.updatedAt}</time></td>
            <td className={styles.actions}><details><summary aria-label={`Ações de ${post.title}`}><AdminIcon name="more" size={17}/></summary><div className={styles.actionMenu}>{canEdit && !preview ? <Link href={`/admin/posts/${post.id}`}><AdminIcon name="edit" size={14}/>Editar</Link> : null}{post.isPubliclyVisible && !preview ? <Link href={`/noticias/${post.slug}`} target="_blank"><AdminIcon name="eye" size={14}/>Visualizar</Link> : null}<Link href={preview ? "/cms-preview/posts" : `/admin/posts/${post.id}/view`}><AdminIcon name="document" size={14}/>Consultar</Link></div></details></td>
          </tr>)}</tbody>
        </table></div>
        <footer className={styles.pagination}><div className={styles.paginationSummary}><strong>{posts.length}</strong><span>registros</span><i aria-hidden="true" /><span>{firstShown}-{lastShown} exibidos</span></div><div className={styles.paginationNav} aria-label="Paginação"><button aria-label="Primeira página" disabled={safePage === 1} onClick={() => setPage(1)} type="button">«</button><button aria-label="Página anterior" disabled={safePage === 1} onClick={() => setPage((current) => clampPage(current - 1, totalPages))} type="button">‹</button><span>Página <strong>{safePage}</strong> de <strong>{totalPages}</strong></span><button aria-label="Próxima página" disabled={safePage === totalPages} onClick={() => setPage((current) => clampPage(current + 1, totalPages))} type="button">›</button><button aria-label="Última página" disabled={safePage === totalPages} onClick={() => setPage(totalPages)} type="button">»</button></div><label className={styles.pageSize}><span>Por página</span><select aria-label="Registros por página" onChange={(event) => changePageSize(Number(event.target.value))} value={pageSize}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label></footer>
        </section>
      </div> : <div className={`adminDashboardPanel admin-empty ${styles.empty}`}><strong>Nenhuma publicação cadastrada.</strong>{canEdit && !preview ? <Link className="adminPrimaryCompact" href="/admin/posts/new">Criar primeira publicação</Link> : null}</div>}
    </section> : <section className={`adminDashboardPanel ${styles.collaborations}`} aria-label="Colaborações recebidas"><AdminIcon name="mail" size={24}/><strong>Nenhuma fonte de colaborações está configurada.</strong><p>Quando uma integração real existir, ela deverá alimentar este fluxo sem misturar as publicações internas.</p></section>}
  </div>;
}
