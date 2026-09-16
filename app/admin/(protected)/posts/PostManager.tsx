"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { deletePostAction, savePostAction, type PostActionState } from "../../post-actions";
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

type CategoryOption = { id: string; name: string };

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

function CreateButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return <button className={styles.modalPrimary} disabled={disabled || pending} type="submit"><AdminIcon name="check" size={14}/>{pending ? "Criando..." : "Criar conteúdo"}</button>;
}

function NewContentModal({ canEdit, categories, onClose, open }: { canEdit: boolean; categories: CategoryOption[]; onClose: () => void; open: boolean }) {
  const [state, action] = useActionState<PostActionState, FormData>(savePostAction, { ok: false });
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => titleRef.current?.focus(), 0);
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keydown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return <div className={styles.modalBackdrop} onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <section aria-labelledby="new-content-title" aria-modal="true" className={styles.modal} role="dialog">
      <header className={styles.modalHeader}>
        <div><span>NOVO CONTEÚDO</span><h2 id="new-content-title">Criar publicação</h2><p>Cadastre os dados essenciais. Depois de criar, a edição completa continua disponível no módulo.</p></div>
        <button aria-label="Fechar modal" className={styles.modalClose} onClick={onClose} type="button">×</button>
      </header>
      <form action={action} className={styles.modalForm}>
        {state.error ? <div className={styles.modalError} role="alert">{state.error}</div> : null}
        {!canEdit ? <div className={styles.modalReadOnly}>Este preview é somente leitura. O modal está disponível para validação visual, mas a criação exige uma sessão administrativa persistente.</div> : null}
        <div className={styles.modalGrid}>
          <label className={styles.modalSpan2}><span>Título</span><input autoComplete="off" maxLength={240} name="title" ref={titleRef} required /></label>
          <label><span>Categoria</span><select defaultValue="" name="categoryId" required><option disabled value="">Selecione</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label><span>Status</span><select defaultValue="draft" name="status"><option value="draft">Rascunho</option><option value="published">Publicado</option></select></label>
          <label className={styles.modalSpan2}><span>Autor</span><input defaultValue="Lander Records" maxLength={180} name="authorName" required /></label>
          <label className={styles.modalSpan2}><span>Resumo</span><textarea name="excerpt" placeholder="Resumo exibido nas listagens." rows={3}/></label>
          <label className={styles.modalSpan2}><span>Conteúdo</span><textarea name="contentMarkdown" placeholder="Escreva o conteúdo inicial..." required rows={8}/></label>
        </div>
        <input name="homePosition" type="hidden" value="0" />
        <footer className={styles.modalFooter}><button className={styles.modalSecondary} onClick={onClose} type="button">Cancelar</button><CreateButton disabled={!canEdit} /></footer>
      </form>
    </section>
  </div>;
}

export default function PostManager({
  canDelete = false,
  canEdit = true,
  createCategories = [],
  deleted,
  developmentMode = false,
  posts,
  preview = false,
}: {
  canDelete?: boolean;
  canEdit?: boolean;
  createCategories?: CategoryOption[];
  deleted?: boolean;
  developmentMode?: boolean;
  posts: PostSummary[];
  preview?: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(posts.length / pageSize));
  const safePage = clampPage(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const visiblePosts = useMemo(() => posts.slice(startIndex, startIndex + pageSize), [pageSize, posts, startIndex]);
  const firstShown = posts.length ? startIndex + 1 : 0;
  const lastShown = Math.min(startIndex + visiblePosts.length, posts.length);
  const changePageSize = (value: number) => { setPageSize(value); setPage(1); };

  useEffect(() => {
    const openModal = () => setCreateOpen(true);
    const interceptLegacyNewContentLink = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!target) return;
      const href = target.getAttribute("href");
      if (href !== "/admin/posts/new" && href !== "/cms-preview/posts/new") return;
      event.preventDefault();
      event.stopPropagation();
      setCreateOpen(true);
    };
    window.addEventListener("admin:new-content", openModal);
    document.addEventListener("click", interceptLegacyNewContentLink, true);
    return () => {
      window.removeEventListener("admin:new-content", openModal);
      document.removeEventListener("click", interceptLegacyNewContentLink, true);
    };
  }, []);

  return <div className={styles.manager} data-testid="news-manager">
    {deleted ? <div className={styles.successNotice}>Conteúdo excluído com sucesso.</div> : null}

    <nav aria-label="Seção de conteúdos" className={styles.viewTabs}><span aria-current="page" className={styles.activeTab}>Publicações</span></nav>

    {developmentMode && !preview ? <section className={styles.notice} role="status"><span aria-hidden="true" className={styles.noticeIcon}>i</span><div><strong>Modo de desenvolvimento liberado</strong><p>Você pode navegar pelos conteúdos usando o banco descartável do preview. Alterações persistentes continuam protegidas pelas regras administrativas do projeto.</p></div></section> : null}

    <section className={styles.catalog} aria-label="Publicações">
      {posts.length ? <div className={`tableview-surface cms-tableview-surface ${styles.tableSurface}`} aria-label="Lista de publicações">
        <div className={styles.scrollArea}><table className={styles.contentTable}>
          <thead><tr><th>Conteúdo</th><th>Página</th><th>Slug</th><th>Status</th><th>Autor</th><th>Atualização</th><th className={styles.actions}>Ações</th></tr></thead>
          <tbody>{visiblePosts.map((post) => <tr data-testid="news-row" key={post.id}>
            <td><div className={styles.identity}><span className={styles.documentIcon} aria-hidden="true"><AdminIcon name="document" size={15} /></span><span><strong>{post.title}</strong><small>{post.excerpt || "Sem resumo"}</small></span></div></td>
            <td><span className={styles.pageLabel}>Notícias</span></td>
            <td><span className={styles.slug}>/{post.slug}</span></td>
            <td><StatusBadge status={post.status} /></td>
            <td><span className={styles.author}>{post.authorName || "—"}</span></td>
            <td><time className={styles.date}>{post.updatedAt}</time></td>
            <td className={styles.actions}><details><summary aria-label={`Ações de ${post.title}`}><AdminIcon name="more" size={17}/></summary><div className={styles.actionMenu}>
              <Link href={preview ? "/cms-preview/posts" : `/admin/posts/${post.id}/view`}><AdminIcon name="eye" size={14}/>Ver</Link>
              {canEdit && !preview ? <Link href={`/admin/posts/${post.id}`}><AdminIcon name="edit" size={14}/>Editar</Link> : <button aria-disabled="true" className={styles.disabledAction} disabled type="button"><AdminIcon name="edit" size={14}/>Editar</button>}
              {canDelete && !preview ? <form action={deletePostAction} onSubmit={(event) => { if (!window.confirm(`Excluir definitivamente “${post.title}”?`)) event.preventDefault(); }}><input name="id" type="hidden" value={post.id}/><button className={styles.deleteAction} type="submit"><AdminIcon name="trash" size={14}/>Excluir</button></form> : <button aria-disabled="true" className={`${styles.deleteAction} ${styles.disabledAction}`} disabled type="button"><AdminIcon name="trash" size={14}/>Excluir</button>}
            </div></details></td>
          </tr>)}</tbody>
        </table></div>
        <footer className={styles.pagination}><div className={styles.paginationSummary}><strong>{posts.length}</strong><span>registros</span><i aria-hidden="true" /><span>{firstShown}–{lastShown} exibidos</span></div><div className={styles.paginationNav} aria-label="Paginação"><button aria-label="Primeira página" disabled={safePage === 1} onClick={() => setPage(1)} type="button">«</button><button aria-label="Página anterior" disabled={safePage === 1} onClick={() => setPage((current) => clampPage(current - 1, totalPages))} type="button">‹</button><span>Página <strong>{safePage}</strong> de <strong>{totalPages}</strong></span><button aria-label="Próxima página" disabled={safePage === totalPages} onClick={() => setPage((current) => clampPage(current + 1, totalPages))} type="button">›</button><button aria-label="Última página" disabled={safePage === totalPages} onClick={() => setPage(totalPages)} type="button">»</button></div><label className={styles.pageSize}><span>Por página</span><select aria-label="Registros por página" onChange={(event) => changePageSize(Number(event.target.value))} value={pageSize}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label></footer>
      </div> : <div className={styles.empty}><span className={styles.emptyIcon}><AdminIcon name="document" size={20} /></span><strong>Nenhum conteúdo cadastrado.</strong><span>As publicações editoriais aparecerão aqui assim que forem criadas.</span><button className="adminPrimaryCompact" onClick={() => setCreateOpen(true)} type="button">Criar primeiro conteúdo</button></div>}
    </section>

    <div id="new-content-modal"><NewContentModal canEdit={canEdit} categories={createCategories} onClose={() => setCreateOpen(false)} open={createOpen} /></div>
  </div>;
}