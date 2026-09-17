"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { createPortal, useFormStatus } from "react-dom";
import { deletePostAction, savePostAction, type PostActionState } from "../../post-actions";
import { AdminIcon } from "../../components/AdminIcon";
import { AdminMediaPicker, type AdminMediaPickerItem } from "../../components/AdminMediaPicker";
import styles from "./NewsManager.module.css";

export type PostRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentMarkdown: string;
  status: "draft" | "published" | "archived" | "unpublished";
  editorStatus: "draft" | "published" | "archived";
  category: string;
  categoryId: string;
  authorName: string;
  publishedAt: string;
  publishedAtInput: string;
  coverImage: string;
  coverMediaId: string;
  authorMediaId: string;
  authorImage: string;
  publicationLink: string;
  links: Record<string, string>;
  featuredOnHome: boolean;
  homePosition: number;
  tags: string[];
  tagIds: string[];
  isPubliclyVisible: boolean;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  updatedAt: string;
};

type Option = { id: string; name: string };
type MediaOption = AdminMediaPickerItem;
type ModalMode = "create" | "edit" | "view";
type ModalState = { mode: ModalMode; postId?: string } | null;
type ActionMenuState = { postId: string; top: number; left: number } | null;

const statusLabel: Record<PostRecord["status"], string> = {
  published: "Publicado",
  draft: "Rascunho",
  archived: "Arquivado",
  unpublished: "Não publicado",
};

function StatusBadge({ status }: { status: PostRecord["status"] }) {
  return <span className={`${styles.statusBadge} ${styles[status]}`}>{statusLabel[status]}</span>;
}

function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(page, 1), Math.max(totalPages, 1));
}

function localDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 16);
}

function slugifyClient(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function getActionMenuPosition(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const gap = 6;
  const padding = 10;
  const menuWidth = 168;
  const menuHeight = 122;
  const maxLeft = Math.max(padding, window.innerWidth - menuWidth - padding);
  const left = Math.min(Math.max(padding, rect.right - menuWidth), maxLeft);
  const top = rect.bottom + gap + menuHeight <= window.innerHeight - padding ? rect.bottom + gap : Math.max(padding, rect.top - menuHeight - gap);
  return { top, left };
}

function SaveButton({ mode, disabled }: { mode: "create" | "edit"; disabled: boolean }) {
  const { pending } = useFormStatus();
  return <button className={styles.modalPrimary} disabled={disabled || pending} type="submit"><AdminIcon name="check" size={14}/>{pending ? "Salvando..." : mode === "create" ? "Criar conteúdo" : "Salvar alterações"}</button>;
}

function ViewFact({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className={styles.viewFact}><span>{label}</span><strong>{children || "—"}</strong></div>;
}

function ContentView({ post }: { post: PostRecord }) {
  const socialLinks = Object.entries(post.links || {}).filter(([, url]) => Boolean(url));
  return <div className={styles.viewBody}>
    <section className={styles.viewHero}>
      <div className={styles.viewHeroMedia}>
        {post.coverImage ? <Image alt={`Capa de ${post.title}`} fill sizes="(max-width: 760px) 100vw, 380px" src={post.coverImage} unoptimized /> : <div className={styles.viewHeroFallback}><AdminIcon name="document" size={34}/><span>Sem imagem de capa</span></div>}
      </div>
      <div className={styles.viewHeroContent}>
        <div className={styles.viewHeroTop}><StatusBadge status={post.status}/><span className={styles.viewCategory}>{post.category || "Sem categoria"}</span></div>
        <h3>{post.title}</h3>
        <p>{post.excerpt || "Esta publicação ainda não possui um resumo editorial."}</p>
        <div className={styles.viewMetaStrip}>
          <ViewFact label="Autor">{post.authorName || "—"}</ViewFact>
          <ViewFact label="Publicação">{post.publishedAt || "Não definida"}</ViewFact>
          <ViewFact label="Slug">/{post.slug}</ViewFact>
        </div>
      </div>
    </section>

    <div className={styles.viewLayout}>
      <section className={`${styles.viewCard} ${styles.viewMainCard}`}>
        <header className={styles.viewCardHeader}><div><span>CONTEÚDO</span><h4>Corpo da publicação</h4></div><small>Somente leitura</small></header>
        <div className={styles.viewArticle}>{post.contentMarkdown || "Nenhum conteúdo foi cadastrado para esta publicação."}</div>
      </section>

      <aside className={styles.viewSidebar}>
        <section className={styles.viewCard}>
          <header className={styles.viewCardHeader}><div><span>PUBLICAÇÃO</span><h4>Distribuição</h4></div></header>
          <div className={styles.viewInfoList}>
            <div className={styles.viewInfoRow}><span>Visível no site</span><strong>{post.isPubliclyVisible ? "Sim" : "Não"}</strong></div>
            <div className={styles.viewInfoRow}><span>Exibir na Home</span><strong>{post.featuredOnHome ? "Sim" : "Não"}</strong></div>
            <div className={styles.viewInfoRow}><span>Posição na Home</span><strong>{post.homePosition || "—"}</strong></div>
            <div className={styles.viewInfoRow}><span>Última atualização</span><strong>{post.updatedAt || "—"}</strong></div>
          </div>
        </section>

        <section className={styles.viewCard}>
          <header className={styles.viewCardHeader}><div><span>ORGANIZAÇÃO</span><h4>Tags</h4></div></header>
          {post.tags.length ? <div className={styles.viewChipList}>{post.tags.map((tag) => <span className={styles.viewChip} key={tag}>{tag}</span>)}</div> : <p className={styles.viewEmptyCopy}>Nenhuma tag vinculada.</p>}
        </section>
      </aside>
    </div>

    <div className={styles.viewLowerGrid}>
      <section className={styles.viewCard}>
        <header className={styles.viewCardHeader}><div><span>LINKS</span><h4>Redes relacionadas</h4></div></header>
        {socialLinks.length ? <div className={styles.viewLinkList}>{socialLinks.map(([platform, url]) => <a className={styles.viewLinkItem} href={url} key={platform} rel="noreferrer" target="_blank"><span>{platform}</span><strong>Abrir ↗</strong></a>)}</div> : <p className={styles.viewEmptyCopy}>Nenhum link relacionado cadastrado.</p>}
      </section>

      <section className={styles.viewCard}>
        <header className={styles.viewCardHeader}><div><span>SEO</span><h4>Metadados</h4></div></header>
        <div className={styles.viewInfoList}>
          <div className={styles.viewInfoRow}><span>Meta title</span><strong>{post.seoTitle || "Não definido"}</strong></div>
          <div className={styles.viewInfoRow}><span>Canonical</span><strong>{post.canonicalUrl || "Não definido"}</strong></div>
        </div>
        <div className={styles.viewSeoText}><span>Meta description</span><p>{post.seoDescription || "Não definida"}</p></div>
      </section>
    </div>
  </div>;
}

function ContentEditorForm({
  canEdit,
  categories,
  initial,
  media,
  mode,
  onClose,
  tags,
}: {
  canEdit: boolean;
  categories: Option[];
  initial?: PostRecord;
  media: MediaOption[];
  mode: "create" | "edit";
  onClose: () => void;
  tags: Option[];
}) {
  const [state, action] = useActionState<PostActionState, FormData>(savePostAction, { ok: false });
  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [excerpt, setExcerpt] = useState(initial?.excerpt || "");
  const [content, setContent] = useState(initial?.contentMarkdown || "");
  const [author, setAuthor] = useState(initial?.authorName || "Lander Records");
  const [coverMediaId, setCoverMediaId] = useState(initial?.coverMediaId || "");
  const [coverImage, setCoverImage] = useState(initial?.coverImage || "");
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { window.setTimeout(() => titleRef.current?.focus(), 0); }, []);

  const chooseCover = (item: MediaOption) => {
    setCoverMediaId(item.id);
    setCoverImage(item.url);
    setCoverPickerOpen(false);
  };

  const changeTitle = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(slugifyClient(value));
  };

  return <>
    <form action={action} className={styles.modalForm} encType="multipart/form-data">
      {initial?.id ? <input name="id" type="hidden" value={initial.id}/> : null}
      <input name="coverMediaId" type="hidden" value={coverMediaId}/>
      {state.error ? <div className={styles.modalError} role="alert">{state.error}</div> : null}
      {!canEdit ? <div className={styles.modalReadOnly}>Este ambiente está em modo de leitura. O formulário pode ser conferido, mas salvar exige uma sessão administrativa persistente.</div> : null}

      <div className={styles.modalBody}>
        <section className={styles.modalSection}>
          <header><div><span>PUBLICAÇÃO</span><h3>Dados editoriais</h3><p>Defina identidade, categoria, URL, autoria e estado da publicação.</p></div></header>
          <div className={styles.formGrid}>
            <label><span>Título</span><input maxLength={240} name="title" onChange={(event) => changeTitle(event.target.value)} ref={titleRef} required value={title}/></label>
            <label><span>Slug</span><input maxLength={260} name="slug" onChange={(event) => { setSlugTouched(true); setSlug(event.target.value); }} placeholder="slug-da-publicacao" required value={slug}/></label>
            <label><span>Categoria</span><select defaultValue={initial?.categoryId || ""} name="categoryId" required><option value="">Selecione</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label><span>Status</span><select defaultValue={initial?.editorStatus || "draft"} name="status"><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></label>
            <label><span>Data de publicação</span><input defaultValue={localDateTime(initial?.publishedAtInput)} name="publishedAt" type="datetime-local"/></label>
            <label><span>Autor</span><input maxLength={180} name="authorName" onChange={(event) => setAuthor(event.target.value)} required value={author}/></label>
          </div>
        </section>

        <section className={styles.modalSection}>
          <header><div><span>CONTEÚDO</span><h3>Resumo e corpo</h3><p>Escreva a linha fina e o conteúdo completo da publicação.</p></div></header>
          <div className={styles.formStack}>
            <label><span>Resumo</span><textarea name="excerpt" onChange={(event) => setExcerpt(event.target.value)} placeholder="Resumo exibido nas listagens e metadados." rows={4} value={excerpt}/></label>
            <label><span>Conteúdo</span><textarea className={styles.contentArea} name="contentMarkdown" onChange={(event) => setContent(event.target.value)} placeholder="Escreva o conteúdo completo..." required rows={13} value={content}/></label>
          </div>
        </section>

        <section className={styles.modalSection}>
          <header><div><span>MÍDIA</span><h3>Imagem de capa</h3><p>Escolha uma imagem da biblioteca ou envie um novo arquivo.</p></div><button className={styles.sectionAction} onClick={() => setCoverPickerOpen(true)} type="button"><AdminIcon name="media" size={14}/>Escolher da biblioteca</button></header>
          {coverImage ? <div className={styles.coverCurrent}><Image alt={`Capa de ${title || "conteúdo"}`} height={675} src={coverImage} unoptimized width={1200}/><div><strong>{media.find((item) => item.id === coverMediaId)?.name || "Imagem selecionada"}</strong><small>{coverImage}</small><button className={styles.sectionAction} onClick={() => { setCoverMediaId(""); setCoverImage(""); }} type="button">Remover capa</button></div></div> : null}
          <div className={styles.formGrid}><label className={styles.formSpan2}><span>Upload de nova imagem</span><input accept="image/*" name="coverMediaUpload" type="file"/><small>PNG, JPG, WEBP ou outro formato de imagem válido. Limite de 12 MB.</small></label></div>
        </section>

        <section className={styles.modalSection}>
          <header><div><span>AUTORIA E ORGANIZAÇÃO</span><h3>Home, tags e imagem do autor</h3><p>Controle a distribuição e os elementos editoriais complementares.</p></div></header>
          <div className={styles.formGrid}>
            <label><span>Imagem existente do autor</span><select defaultValue={initial?.authorMediaId || ""} name="authorMediaId"><option value="">Sem imagem</option>{media.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label><span>Ou enviar imagem do autor</span><input accept="image/*" name="authorMediaUpload" type="file"/></label>
            <label><span>Posição na Home</span><input defaultValue={initial?.homePosition || 0} min={0} name="homePosition" type="number"/></label>
            <label className={styles.checkboxField}><input defaultChecked={initial?.featuredOnHome ?? true} name="featuredOnHome" type="checkbox"/><span>Exibir na seção Notícias da Home</span></label>
          </div>
          <div className={styles.tagChoices}><span>Tags</span>{tags.length ? <div>{tags.map((tag) => <label key={tag.id}><input defaultChecked={Boolean(initial?.tagIds.includes(tag.id))} name="tagIds" type="checkbox" value={tag.id}/><span>{tag.name}</span></label>)}</div> : <small>Nenhuma tag cadastrada.</small>}</div>
        </section>

        <section className={styles.modalSection}>
          <header><div><span>LINKS</span><h3>Redes relacionadas</h3><p>Associe destinos sociais relevantes à publicação.</p></div></header>
          <div className={styles.formGrid}>
            <label><span>Instagram</span><input defaultValue={initial?.links.instagram || ""} name="link_instagram" placeholder="https://instagram.com/..." type="url"/></label>
            <label><span>Facebook</span><input defaultValue={initial?.links.facebook || ""} name="link_facebook" placeholder="https://facebook.com/..." type="url"/></label>
            <label><span>YouTube</span><input defaultValue={initial?.links.youtube || ""} name="link_youtube" placeholder="https://youtube.com/..." type="url"/></label>
            <label><span>TikTok</span><input defaultValue={initial?.links.tiktok || ""} name="link_tiktok" placeholder="https://tiktok.com/..." type="url"/></label>
          </div>
        </section>

        <section className={styles.modalSection}>
          <header><div><span>SEO</span><h3>Metadados da publicação</h3><p>Configure título, descrição e URL canônica para mecanismos de busca.</p></div></header>
          <div className={styles.formGrid}>
            <label><span>Meta title</span><input defaultValue={initial?.seoTitle || ""} maxLength={180} name="seoTitle" placeholder={title || "Título para mecanismos de busca"}/></label>
            <label><span>Canonical URL</span><input defaultValue={initial?.canonicalUrl || ""} name="canonicalUrl" placeholder="https://..." type="url"/></label>
            <label className={styles.formSpan2}><span>Meta description</span><textarea defaultValue={initial?.seoDescription || ""} maxLength={320} name="seoDescription" placeholder={excerpt || "Descrição exibida em resultados de busca."} rows={4}/></label>
          </div>
        </section>
      </div>

      <footer className={styles.modalFooter}><button className={styles.modalSecondary} onClick={onClose} type="button">Cancelar</button><SaveButton disabled={!canEdit} mode={mode}/></footer>
    </form>
    <AdminMediaPicker items={media} onClose={() => setCoverPickerOpen(false)} onSelect={chooseCover} open={coverPickerOpen} selectedId={coverMediaId} title="Escolher capa da publicação"/>
  </>;
}

function ContentModal({
  canEdit,
  categories,
  media,
  mode,
  onClose,
  onEdit,
  post,
  tags,
}: {
  canEdit: boolean;
  categories: Option[];
  media: MediaOption[];
  mode: ModalMode;
  onClose: () => void;
  onEdit: () => void;
  post?: PostRecord;
  tags: Option[];
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", keydown); };
  }, [onClose]);

  if ((mode === "edit" || mode === "view") && !post) return null;
  const title = mode === "create" ? "Criar conteúdo" : mode === "edit" ? "Editar conteúdo" : "Detalhes do conteúdo";
  const eyebrow = mode === "create" ? "NOVO CONTEÚDO" : mode === "edit" ? "EDIÇÃO DE CONTEÚDO" : "VISUALIZAÇÃO";
  const description = mode === "view" ? "Consulta consolidada da publicação. Nenhum campo pode ser alterado nesta visualização." : "Preencha todas as informações da publicação em um único fluxo contínuo.";

  return <div className={styles.modalBackdrop} onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <section aria-labelledby="content-modal-title" aria-modal="true" className={`${styles.modal} ${mode === "view" ? styles.viewModal : ""}`} role="dialog">
      <header className={`${styles.modalHeader} ${mode === "view" ? styles.viewModalHeader : ""}`}><div><span>{eyebrow}</span><h2 id="content-modal-title">{title}</h2><p>{description}</p></div><button aria-label="Fechar modal" className={styles.modalClose} onClick={onClose} type="button">×</button></header>
      {mode === "view" && post ? <><ContentView post={post}/><footer className={styles.modalFooter}>{post.isPubliclyVisible ? <a className={styles.modalSecondary} href={`/noticias/${post.slug}`} rel="noreferrer" target="_blank"><AdminIcon name="eye" size={14}/>Abrir no site</a> : null}<button className={styles.modalSecondary} onClick={onClose} type="button">Fechar</button>{canEdit ? <button className={styles.modalPrimary} onClick={onEdit} type="button"><AdminIcon name="edit" size={14}/>Editar conteúdo</button> : null}</footer></> : <ContentEditorForm canEdit={canEdit} categories={categories} initial={mode === "edit" ? post : undefined} media={media} mode={mode as "create" | "edit"} onClose={onClose} tags={tags}/>} 
    </section>
  </div>;
}

export default function PostManager({
  canDelete = false,
  canEdit = true,
  categories = [],
  deleted,
  developmentMode = false,
  initialId,
  initialMode,
  media = [],
  posts,
  preview = false,
  saved,
  tags = [],
}: {
  canDelete?: boolean;
  canEdit?: boolean;
  categories?: Option[];
  deleted?: boolean;
  developmentMode?: boolean;
  initialId?: string;
  initialMode?: ModalMode;
  media?: MediaOption[];
  posts: PostRecord[];
  preview?: boolean;
  saved?: boolean;
  tags?: Option[];
}) {
  const [modal, setModal] = useState<ModalState>(() => initialMode ? { mode: initialMode, postId: initialId } : null);
  const [actionMenu, setActionMenu] = useState<ActionMenuState>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(posts.length / pageSize));
  const safePage = clampPage(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const visiblePosts = useMemo(() => posts.slice(startIndex, startIndex + pageSize), [pageSize, posts, startIndex]);
  const selectedPost = modal?.postId ? posts.find((post) => post.id === modal.postId) : undefined;
  const actionPost = actionMenu ? posts.find((post) => post.id === actionMenu.postId) : undefined;
  const firstShown = posts.length ? startIndex + 1 : 0;
  const lastShown = Math.min(startIndex + visiblePosts.length, posts.length);
  const changePageSize = (value: number) => { setActionMenu(null); setPageSize(value); setPage(1); };

  useEffect(() => {
    const openModal = () => { setActionMenu(null); setModal({ mode: "create" }); };
    window.addEventListener("admin:new-content", openModal);
    return () => window.removeEventListener("admin:new-content", openModal);
  }, []);

  useEffect(() => {
    if (!actionMenu) return;
    const close = () => setActionMenu(null);
    const pointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest("[data-content-action-menu], [data-content-action-trigger]")) return;
      close();
    };
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("pointerdown", pointerDown);
    document.addEventListener("keydown", keydown);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("pointerdown", pointerDown);
      document.removeEventListener("keydown", keydown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [actionMenu]);

  return <div className={styles.manager} data-testid="news-manager">
    {deleted ? <div className={styles.successNotice}>Conteúdo excluído com sucesso.</div> : null}
    {saved ? <div className={styles.successNotice}>Conteúdo salvo com sucesso.</div> : null}

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
            <td className={styles.actions}><button aria-controls={actionMenu?.postId === post.id ? "content-row-action-menu" : undefined} aria-expanded={actionMenu?.postId === post.id} aria-haspopup="menu" aria-label={`Ações de ${post.title}`} className={styles.actionTrigger} data-content-action-trigger onClick={(event) => { setActionMenu((current) => current?.postId === post.id ? null : { postId: post.id, ...getActionMenuPosition(event.currentTarget) }); }} type="button"><AdminIcon name="more" size={17}/></button></td>
          </tr>)}</tbody>
        </table></div>
        <footer className={styles.pagination}><div className={styles.paginationSummary}><strong>{posts.length}</strong><span>registros</span><i aria-hidden="true" /><span>{firstShown}–{lastShown} exibidos</span></div><div className={styles.paginationNav} aria-label="Paginação"><button aria-label="Primeira página" disabled={safePage === 1} onClick={() => { setActionMenu(null); setPage(1); }} type="button">«</button><button aria-label="Página anterior" disabled={safePage === 1} onClick={() => { setActionMenu(null); setPage((current) => clampPage(current - 1, totalPages)); }} type="button">‹</button><span>Página <strong>{safePage}</strong> de <strong>{totalPages}</strong></span><button aria-label="Próxima página" disabled={safePage === totalPages} onClick={() => { setActionMenu(null); setPage((current) => clampPage(current + 1, totalPages)); }} type="button">›</button><button aria-label="Última página" disabled={safePage === totalPages} onClick={() => { setActionMenu(null); setPage(totalPages); }} type="button">»</button></div><label className={styles.pageSize}><span>Por página</span><select aria-label="Registros por página" onChange={(event) => changePageSize(Number(event.target.value))} value={pageSize}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label></footer>
      </div> : <div className={styles.empty}><span className={styles.emptyIcon}><AdminIcon name="document" size={20} /></span><strong>Nenhum conteúdo cadastrado.</strong><span>As publicações editoriais aparecerão aqui assim que forem criadas.</span><button className="adminPrimaryCompact" onClick={() => setModal({ mode: "create" })} type="button">Criar primeiro conteúdo</button></div>}
    </section>

    {actionMenu && actionPost && typeof document !== "undefined" ? createPortal(<div aria-label={`Ações de ${actionPost.title}`} className={styles.actionMenu} data-content-action-menu id="content-row-action-menu" role="menu" style={{ position: "fixed", top: actionMenu.top, left: actionMenu.left, right: "auto", zIndex: 900 }}>
      <button onClick={() => { setActionMenu(null); setModal({ mode: "view", postId: actionPost.id }); }} role="menuitem" type="button"><AdminIcon name="eye" size={14}/>Ver</button>
      {canEdit && !preview ? <button onClick={() => { setActionMenu(null); setModal({ mode: "edit", postId: actionPost.id }); }} role="menuitem" type="button"><AdminIcon name="edit" size={14}/>Editar</button> : <button aria-disabled="true" className={styles.disabledAction} disabled role="menuitem" type="button"><AdminIcon name="edit" size={14}/>Editar</button>}
      {canDelete && !preview ? <form action={deletePostAction} onSubmit={(event) => { const confirmed = window.confirm(`Excluir definitivamente “${actionPost.title}”?`); if (!confirmed) { event.preventDefault(); return; } setActionMenu(null); }}><input name="id" type="hidden" value={actionPost.id}/><button className={styles.deleteAction} role="menuitem" type="submit"><AdminIcon name="trash" size={14}/>Excluir</button></form> : <button aria-disabled="true" className={`${styles.deleteAction} ${styles.disabledAction}`} disabled role="menuitem" type="button"><AdminIcon name="trash" size={14}/>Excluir</button>}
    </div>, document.body) : null}

    {modal ? <ContentModal canEdit={canEdit && !preview} categories={categories} key={`${modal.mode}-${modal.postId || "new"}`} media={media} mode={modal.mode} onClose={() => setModal(null)} onEdit={() => selectedPost && setModal({ mode: "edit", postId: selectedPost.id })} post={selectedPost} tags={tags}/> : null}
  </div>;
}