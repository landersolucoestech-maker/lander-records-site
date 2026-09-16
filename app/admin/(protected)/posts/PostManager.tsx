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

const statusLabel: Record<PostSummary["status"], string> = {
  published: "Publicado",
  draft: "Rascunho",
  archived: "Arquivado",
  unpublished: "Não publicado",
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
  developmentMode = false,
  posts,
  preview = false,
}: {
  canEdit?: boolean;
  deleted?: boolean;
  developmentMode?: boolean;
  posts: PostSummary[];
  preview?: boolean;
}) {
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
    {deleted ? <div className={styles.successNotice}>Conteúdo excluído com sucesso.</div> : null}

    <nav aria-label="Seção de conteúdos" className={styles.viewTabs}>
      <span aria-current="page" className={styles.activeTab}>Publicações</span>
    </nav>

    {developmentMode && !preview ? <section className={styles.notice} role="status">
      <span aria-hidden="true" className={styles.noticeIcon}>i</span>
      <div>
        <strong>Modo de desenvolvimento liberado</strong>
        <p>Você pode navegar pelos conteúdos usando o banco descartável do preview. Alterações persistentes continuam protegidas pelas regras administrativas do projeto.</p>
      </div>
    </section> : null}

    <section className={styles.catalog} aria-label="Publicações">
      {posts.length ? <div className={`tableview-surface cms-tableview-surface ${styles.tableSurface}`} aria-label="Tabela de publicações">
        <div className={styles.scrollArea}>
          <table className={styles.contentTable}>
            <thead><tr>
              <th>Conteúdo</th>
              <th>Página</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Autor</th>
              <th>Atualização</th>
              <th className={styles.actions}>Ações</th>
            </tr></thead>
            <tbody>{visiblePosts.map((post) => <tr data-testid="news-row" key={post.id}>
              <td>
                <div className={styles.identity}>
                  <span className={styles.documentIcon} aria-hidden="true"><AdminIcon name="document" size={15} /></span>
                  <span><strong>{post.title}</strong><small>{post.excerpt || "Sem resumo"}</small></span>
                </div>
              </td>
              <td><span className={styles.pageLabel}>Notícias</span></td>
              <td><span className={styles.slug}>/{post.slug}</span></td>
              <td><StatusBadge status={post.status} /></td>
              <td><span className={styles.author}>{post.authorName || "—"}</span></td>
              <td><time className={styles.date}>{post.updatedAt}</time></td>
              <td className={styles.actions}>
                <details>
                  <summary aria-label={`Ações de ${post.title}`}><AdminIcon name="more" size={17}/></summary>
                  <div className={styles.actionMenu}>
                    {canEdit && !preview ? <Link href={`/admin/posts/${post.id}`}><AdminIcon name="edit" size={14}/>Editar</Link> : null}
                    {post.isPubliclyVisible && !preview ? <Link href={`/noticias/${post.slug}`} target="_blank"><AdminIcon name="eye" size={14}/>Visualizar</Link> : null}
                    <Link href={preview ? "/cms-preview/posts" : `/admin/posts/${post.id}/view`}><AdminIcon name="document" size={14}/>Consultar</Link>
                  </div>
                </details>
              </td>
            </tr>)}</tbody>
          </table>
        </div>

        <footer className={styles.pagination}>
          <div className={styles.paginationSummary}><strong>{posts.length}</strong><span>registros</span><i aria-hidden="true" /><span>{firstShown}–{lastShown} exibidos</span></div>
          <div className={styles.paginationNav} aria-label="Paginação">
            <button aria-label="Primeira página" disabled={safePage === 1} onClick={() => setPage(1)} type="button">«</button>
            <button aria-label="Página anterior" disabled={safePage === 1} onClick={() => setPage((current) => clampPage(current - 1, totalPages))} type="button">‹</button>
            <span>Página <strong>{safePage}</strong> de <strong>{totalPages}</strong></span>
            <button aria-label="Próxima página" disabled={safePage === totalPages} onClick={() => setPage((current) => clampPage(current + 1, totalPages))} type="button">›</button>
            <button aria-label="Última página" disabled={safePage === totalPages} onClick={() => setPage(totalPages)} type="button">»</button>
          </div>
          <label className={styles.pageSize}><span>Por página</span><select aria-label="Registros por página" onChange={(event) => changePageSize(Number(event.target.value))} value={pageSize}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label>
        </footer>
      </div> : <div className={styles.empty}>
        <span className={styles.emptyIcon}><AdminIcon name="document" size={20} /></span>
        <strong>Nenhum conteúdo cadastrado.</strong>
        <span>As publicações editoriais aparecerão aqui assim que forem criadas.</span>
        {canEdit && !preview ? <Link className="adminPrimaryCompact" href="/admin/posts/new">Criar primeiro conteúdo</Link> : null}
      </div>}
    </section>
  </div>;
}
