"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminIcon } from "../../components/AdminIcon";
import styles from "./NewsManager.module.css";

export type PostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: "draft" | "published" | "archived" | "unpublished";
  category: string;
  authorName: string;
  publishedAt: string;
  coverImage: string;
  featuredOnHome: boolean;
  tags: string[];
  isPubliclyVisible: boolean;
  updatedAt: string;
};

type Filters = { category?: string; q?: string; status?: string; tag?: string };
type ContentView = "publications" | "collaborations";

const statusLabel: Record<PostSummary["status"], string> = {
  published: "published",
  draft: "draft",
  archived: "archived",
  unpublished: "unpublished",
};

function StatusBadge({ status }: { status: PostSummary["status"] }) {
  return <span className={`${styles.statusBadge} ${styles[status]}`}>{statusLabel[status]}</span>;
}

function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(page, 1), Math.max(totalPages, 1));
}

export default function PostManager({
  canEdit = true,
  deleted,
  posts,
  preview = false,
}: {
  availableCategories?: string[];
  availableTags?: string[];
  canEdit?: boolean;
  deleted?: boolean;
  initialFilters?: Filters;
  metrics?: { archived: number; drafts: number; published: number; total: number };
  posts: PostSummary[];
  preview?: boolean;
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

  const changePageSize = (value: number) => {
    setPageSize(value);
    setPage(1);
  };

  return <div className={styles.manager} data-testid="news-manager">
    <nav aria-label="Visualização de conteúdo" className={styles.viewTabs}>
      <button aria-current={view === "publications" ? "page" : undefined} className={view === "publications" ? styles.activeTab : undefined} onClick={() => setView("publications")} type="button"><AdminIcon name="posts" size={15} /><span>Publicações</span></button>
      <button aria-current={view === "collaborations" ? "page" : undefined} className={view === "collaborations" ? styles.activeTab : undefined} onClick={() => setView("collaborations")} type="button"><AdminIcon name="mail" size={15} /><span>Colaborações recebidas</span></button>
    </nav>

    {deleted ? <div className={styles.successNotice}>Publicação excluída com sucesso.</div> : null}
    <section className={styles.notice} aria-label="Fluxo editorial">
      <strong>{preview ? "Preview administrativo" : "Fluxo editorial da Lander Records"}</strong>
      <p>{preview ? "Este ambiente apresenta os dados de demonstração sem alterar a persistência real." : "Crie, revise e publique conteúdos usando os dados, permissões e estados editoriais reais da Lander Records."}</p>
    </section>

    {view === "publications" ? <section className={styles.catalog} aria-label="Publicações">
      {posts.length ? <div className={`tableview-surface cms-tableview-surface ${styles.tableSurface}`} aria-label="Publicações cadastradas">
        <section className={`table-card ${styles.tableCard}`}>
          <div className={styles.scrollArea}><table>
            <thead><tr><th>Conteúdo</th><th>Página</th><th>Slug</th><th>Status</th><th>Autor</th><th>Atualização</th><th className={styles.actions}>Ações</th></tr></thead>
            <tbody>{visiblePosts.map((post) => <tr data-testid="news-row" key={post.id}>
              <td><div className={`table-primary ${styles.identity}`}><span className={styles.documentIcon} aria-hidden="true"><AdminIcon name="document" size={15} /></span><span><strong>{post.title}</strong><small>{post.excerpt || "Sem resumo"}</small></span></div></td>
              <td><span className={styles.category}>{post.category || "Sem categoria"}</span></td>
              <td><span className={styles.slug}>/noticias/{post.slug}</span></td>
              <td><StatusBadge status={post.status} /></td>
              <td><span className={styles.author}>{post.authorName || "—"}</span></td>
              <td><time className={styles.date}>{post.updatedAt}</time></td>
              <td className={styles.actions}><details><summary aria-label={`Ações de ${post.title}`}><AdminIcon name="more" size={17}/></summary><div className={styles.actionMenu}>{canEdit && !preview ? <Link href={`/admin/posts/${post.id}`}><AdminIcon name="edit" size={14}/>Editar</Link> : null}{post.isPubliclyVisible && !preview ? <Link href={`/noticias/${post.slug}`} target="_blank"><AdminIcon name="eye" size={14}/>Visualizar</Link> : null}<Link href={preview ? "/cms-preview/posts" : `/admin/posts/${post.id}/view`}><AdminIcon name="document" size={14}/>Consultar</Link></div></details></td>
            </tr>)}</tbody>
          </table></div>
          <footer className={styles.pagination}>
            <div className={styles.paginationSummary}><strong>{posts.length}</strong><span>registros</span><i aria-hidden="true" /><span>{firstShown}-{lastShown} exibidos</span></div>
            <div className={styles.paginationNav} aria-label="Paginação">
              <button aria-label="Primeira página" disabled={safePage === 1} onClick={() => setPage(1)} type="button">«</button>
              <button aria-label="Página anterior" disabled={safePage === 1} onClick={() => setPage((current) => clampPage(current - 1, totalPages))} type="button">‹</button>
              <span>Página <strong>{safePage}</strong> de <strong>{totalPages}</strong></span>
              <button aria-label="Próxima página" disabled={safePage === totalPages} onClick={() => setPage((current) => clampPage(current + 1, totalPages))} type="button">›</button>
              <button aria-label="Última página" disabled={safePage === totalPages} onClick={() => setPage(totalPages)} type="button">»</button>
            </div>
            <label className={styles.pageSize}><span>Por página</span><select aria-label="Registros por página" onChange={(event) => changePageSize(Number(event.target.value))} value={pageSize}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label>
          </footer>
        </section>
      </div> : <div className={`admin-empty ${styles.empty}`}><strong>Nenhuma publicação cadastrada.</strong>{canEdit && !preview ? <Link className="adminButton primary" href="/admin/posts/new">Criar primeira publicação</Link> : null}</div>}
    </section> : <section className={styles.collaborations} aria-label="Colaborações recebidas"><AdminIcon name="mail" size={24}/><strong>Nenhuma fonte de colaborações está configurada.</strong><p>O projeto Lander Records ainda não possui um fluxo externo de submissões conectado ao CMS. Esta área permanece separada das publicações para não inventar dados nem misturar regras editoriais.</p></section>}

    <section className={styles.notice} aria-label="Candidatos editoriais">
      <strong>Candidatos editoriais</strong>
      <p>Nenhuma fonte externa de candidatos editoriais está configurada na Lander Records. Quando uma integração real existir, ela deverá alimentar este fluxo sem misturar as publicações internas.</p>
    </section>
  </div>;
}
