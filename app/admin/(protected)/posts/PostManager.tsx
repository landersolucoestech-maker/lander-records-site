"use client";

import Image from "next/image";
import { useActionState, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal, useFormStatus } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { trustedExternalUrl } from "@/lib/media-embed";
import { deletePostAction, savePostAction, type PostActionState } from "../../post-actions";
import { AdminIcon } from "../../components/AdminIcon";
import { AdminPagination } from "../../components/AdminPagination";
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
  links: Record<string, string>;
  featuredOnHome: boolean;
  homePosition: number;
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
type ActionMenuState = { postId: string } | null;
type ActionMenuPosition = { top: number; left: number } | null;
type SortMode = "updated-desc" | "updated-asc" | "title-asc" | "title-desc";

const focusableSelector = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]';
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

function postDateValue(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (match) return Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

function localPostText(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function localPostNumber(formData: FormData, name: string) {
  const value = Number.parseInt(localPostText(formData, name), 10);
  return Number.isFinite(value) ? value : 0;
}

function localPostImage(formData: FormData, uploadField: string, mediaId: string, media: MediaOption[], fallback = "") {
  const upload = formData.get(uploadField);
  if (upload instanceof File && upload.size > 0) return URL.createObjectURL(upload);
  return media.find((item) => item.id === mediaId)?.url || fallback;
}

function postDisplayDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(value);
}

function positionFloatingMenu(anchor: DOMRect, menu: DOMRect) {
  const gap = 6;
  const viewportPadding = 10;
  const maxLeft = Math.max(viewportPadding, window.innerWidth - menu.width - viewportPadding);
  const left = Math.min(Math.max(viewportPadding, anchor.right - menu.width), maxLeft);
  const hasRoomBelow = anchor.bottom + gap + menu.height <= window.innerHeight - viewportPadding;
  const top = hasRoomBelow ? anchor.bottom + gap : Math.max(viewportPadding, anchor.top - menu.height - gap);
  return { top, left };
}

function SaveButton({ mode, disabled }: { mode: "create" | "edit"; disabled: boolean }) {
  const { pending } = useFormStatus();
  return <button className={styles.modalPrimary} disabled={disabled || pending} type="submit"><AdminIcon name="check" size={14}/>{pending ? "Salvando..." : mode === "create" ? "Criar conteúdo" : "Salvar alterações"}</button>;
}

function ViewInfo({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className={styles.viewInfo}><span>{label}</span><strong>{children || "—"}</strong></div>;
}

function ContentView({ post }: { post: PostRecord }) {
  const socialLinks = Object.entries(post.links || {})
    .map(([platform, url]) => [platform, trustedExternalUrl(url)] as const)
    .filter((entry): entry is readonly [string, string] => Boolean(entry[1]));

  return <div className={styles.viewPreview}>
    <main className={styles.viewArticlePreview}>
      <div className={styles.viewArticleCover}>
        {post.coverImage ? <Image alt={`Capa de ${post.title}`} fill sizes="(max-width: 760px) 100vw, 760px" src={post.coverImage} unoptimized /> : <div className={styles.viewArticleCoverEmpty}><AdminIcon name="media" size={30}/><span>Sem imagem de capa</span></div>}
        <span className={styles.viewArticleCategory}>{post.category || "Notícia"}</span>
      </div>
      <article className={styles.viewArticleSheet}>
        <div className={styles.viewArticleStatus}><StatusBadge status={post.status}/><span>Somente leitura</span></div>
        <h1>{post.title}</h1>
        <p className={styles.viewArticleExcerpt}>{post.excerpt || "Esta publicação ainda não possui um resumo editorial."}</p>
        <div className={styles.viewArticleByline}>
          <span className={styles.viewAuthor}>{post.authorImage ? <Image alt="" height={30} src={post.authorImage} unoptimized width={30}/> : <i aria-hidden="true"><AdminIcon name="document" size={14}/></i>}<strong>{post.authorName || "Não informado"}</strong></span>
          <span>{post.publishedAt || "Data não definida"}</span>
        </div>
        <div className={styles.viewMarkdown}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.contentMarkdown || "Nenhum conteúdo foi cadastrado para esta publicação."}</ReactMarkdown>
        </div>
      </article>
    </main>

    <aside className={styles.viewInspector} aria-label="Detalhes da publicação">
      <section className={styles.viewInspectorSection}>
        <header><span>PUBLICAÇÃO</span><h3>Detalhes</h3></header>
        <div className={styles.viewInfoList}>
          <ViewInfo label="Status">{statusLabel[post.status]}</ViewInfo>
          <ViewInfo label="Categoria">{post.category || "Sem categoria"}</ViewInfo>
          <ViewInfo label="Slug">/{post.slug}</ViewInfo>
          <ViewInfo label="Visível no site">{post.isPubliclyVisible ? "Sim" : "Não"}</ViewInfo>
          <ViewInfo label="Exibir na Home">{post.featuredOnHome ? "Sim" : "Não"}</ViewInfo>
          <ViewInfo label="Posição na Home">{post.homePosition || "—"}</ViewInfo>
          <ViewInfo label="Atualização">{post.updatedAt || "—"}</ViewInfo>
        </div>
      </section>

      <section className={styles.viewInspectorSection}>
        <header><span>LINKS</span><h3>Redes relacionadas</h3></header>
        {socialLinks.length ? <div className={styles.viewLinkList}>{socialLinks.map(([platform, url]) => <a className={styles.viewLinkItem} href={url} key={platform} rel="noopener noreferrer" target="_blank"><span>{platform}</span><strong>Abrir ↗</strong></a>)}</div> : <p className={styles.viewEmptyCopy}>Nenhum link relacionado cadastrado.</p>}
      </section>

      <section className={styles.viewInspectorSection}>
        <header><span>SEO</span><h3>Metadados</h3></header>
        <div className={styles.viewInfoList}>
          <ViewInfo label="Meta title">{post.seoTitle || "Não definido"}</ViewInfo>
          <ViewInfo label="Canonical">{post.canonicalUrl || "Não definido"}</ViewInfo>
        </div>
        <div className={styles.viewSeoText}><span>Meta description</span><p>{post.seoDescription || "Não definida"}</p></div>
      </section>
    </aside>
  </div>;
}

function useDialogLifecycle(open: boolean, onClose: () => void, dialogRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () => Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter((node) => node.getClientRects().length);
    window.setTimeout(() => (focusables()[0] || dialog).focus(), 0);
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const nodes = focusables();
      const first = nodes[0];
      const last = nodes.at(-1);
      if (!first || !last) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [dialogRef, onClose, open]);
}

function ContentViewDialog({ canEdit, onClose, onEdit, post }: { canEdit: boolean; onClose: () => void; onEdit: () => void; post: PostRecord }) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => { setMounted(true); }, []);
  useDialogLifecycle(mounted, onClose, dialogRef);
  if (!mounted) return null;

  return createPortal(<div className={styles.viewBackdrop} onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }} role="presentation">
    <section aria-labelledby="content-view-title" aria-modal="true" className={styles.viewDialog} ref={dialogRef} role="dialog" tabIndex={-1}>
      <header className={styles.viewDialogHeader}>
        <div><span>VISUALIZAÇÃO</span><h2 id="content-view-title">Prévia da publicação</h2><p>Confira o conteúdo como leitura, separado dos controles de criação e edição.</p></div>
        <button aria-label="Fechar visualização" className={styles.modalClose} onClick={onClose} type="button">×</button>
      </header>
      <ContentView post={post}/>
      <footer className={styles.viewDialogFooter}>
        <div>{post.isPubliclyVisible ? <a className={styles.modalSecondary} href={`/noticias/${post.slug}`} rel="noopener noreferrer" target="_blank"><AdminIcon name="eye" size={14}/>Abrir no site</a> : <span className={styles.viewPrivateHint}>Conteúdo ainda não está público.</span>}</div>
        <div><button className={styles.modalSecondary} onClick={onClose} type="button">Fechar</button>{canEdit ? <button className={styles.modalPrimary} onClick={onEdit} type="button"><AdminIcon name="edit" size={14}/>Editar conteúdo</button> : null}</div>
      </footer>
    </section>
  </div>, document.body);
}

function ContentEditorForm({ canEdit, categories, initial, media, mode, onClose, onLocalSubmit }: { canEdit: boolean; categories: Option[]; initial?: PostRecord; media: MediaOption[]; mode: "create" | "edit"; onClose: () => void; onLocalSubmit?: (formData: FormData) => void | Promise<void> }) {
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
  const chooseCover = (item: MediaOption) => { setCoverMediaId(item.id); setCoverImage(item.url); setCoverPickerOpen(false); };
  const changeTitle = (value: string) => { setTitle(value); if (!slugTouched) setSlug(slugifyClient(value)); };

  return <>
    <form action={onLocalSubmit ?? action} className={styles.modalForm} encType="multipart/form-data">
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
          <header><div><span>AUTORIA E ORGANIZAÇÃO</span><h3>Home e imagem do autor</h3><p>Controle a distribuição e os elementos editoriais complementares.</p></div></header>
          <div className={styles.formGrid}>
            <label><span>Imagem existente do autor</span><select defaultValue={initial?.authorMediaId || ""} name="authorMediaId"><option value="">Sem imagem</option>{media.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label><span>Ou enviar imagem do autor</span><input accept="image/*" name="authorMediaUpload" type="file"/></label>
            <label><span>Posição na Home</span><input defaultValue={initial?.homePosition || 0} min={0} name="homePosition" type="number"/></label>
            <label className={styles.checkboxField}><input defaultChecked={initial?.featuredOnHome ?? true} name="featuredOnHome" type="checkbox"/><span>Exibir na seção Notícias da Home</span></label>
          </div>
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
            <label><span>URL canônica</span><input defaultValue={initial?.canonicalUrl || ""} name="canonicalUrl" placeholder="https://..." type="url"/></label>
            <label className={styles.formSpan2}><span>Meta description</span><textarea defaultValue={initial?.seoDescription || ""} maxLength={320} name="seoDescription" placeholder={excerpt || "Descrição exibida em resultados de busca."} rows={4}/></label>
          </div>
        </section>
      </div>

      <footer className={styles.modalFooter}><button className={styles.modalSecondary} onClick={onClose} type="button">Cancelar</button><SaveButton disabled={!canEdit} mode={mode}/></footer>
    </form>
    <AdminMediaPicker items={media} onClose={() => setCoverPickerOpen(false)} onSelect={chooseCover} open={coverPickerOpen} selectedId={coverMediaId} title="Escolher capa da publicação"/>
  </>;
}

function ContentEditorModal({ canEdit, categories, media, mode, onClose, onLocalSubmit, post }: { canEdit: boolean; categories: Option[]; media: MediaOption[]; mode: "create" | "edit"; onClose: () => void; onLocalSubmit?: (formData: FormData) => void | Promise<void>; post?: PostRecord }) {
  const dialogRef = useRef<HTMLElement>(null);
  useDialogLifecycle(true, onClose, dialogRef);
  if (mode === "edit" && !post) return null;
  const title = mode === "create" ? "Criar conteúdo" : "Editar conteúdo";
  const eyebrow = mode === "create" ? "NOVO CONTEÚDO" : "EDIÇÃO DE CONTEÚDO";

  return <div className={styles.modalBackdrop} onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }} role="presentation">
    <section aria-labelledby="content-modal-title" aria-modal="true" className={styles.modal} ref={dialogRef} role="dialog" tabIndex={-1}>
      <header className={styles.modalHeader}><div><span>{eyebrow}</span><h2 id="content-modal-title">{title}</h2><p>Preencha as informações editoriais da publicação em um único fluxo.</p></div><button aria-label="Fechar modal" className={styles.modalClose} onClick={onClose} type="button">×</button></header>
      <ContentEditorForm canEdit={canEdit} categories={categories} initial={mode === "edit" ? post : undefined} media={media} mode={mode} onClose={onClose} onLocalSubmit={onLocalSubmit}/>
    </section>
  </div>;
}

export default function PostManager({ canDelete = false, canEdit = true, categories = [], deleted, developmentMode = false, initialId, initialMode, media = [], posts: initialPosts, preview = false, saved }: { canDelete?: boolean; canEdit?: boolean; categories?: Option[]; deleted?: boolean; developmentMode?: boolean; initialId?: string; initialMode?: ModalMode; media?: MediaOption[]; posts: PostRecord[]; preview?: boolean; saved?: boolean }) {
  const [localPosts, setLocalPosts] = useState(initialPosts);
  const [localNotice, setLocalNotice] = useState("");
  const posts = developmentMode ? localPosts : initialPosts;
  const canMutate = canEdit || developmentMode;
  const [modal, setModal] = useState<ModalState>(() => initialMode ? { mode: initialMode, postId: initialId } : null);
  const [actionMenu, setActionMenu] = useState<ActionMenuState>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<ActionMenuPosition>(null);
  const actionTriggerRef = useRef<HTMLButtonElement | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [authorFilter, setAuthorFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("updated-desc");

  const authors = useMemo(() => Array.from(new Set(posts.map((post) => post.authorName).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR")), [posts]);
  const postCategories = useMemo(() => Array.from(new Set(posts.map((post) => post.category).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR")), [posts]);
  const metrics = useMemo(() => ({
    total: posts.length,
    published: posts.filter((post) => post.status === "published").length,
    draft: posts.filter((post) => post.status === "draft").length,
    archived: posts.filter((post) => post.status === "archived").length,
  }), [posts]);

  const filteredPosts = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pt-BR");
    const filtered = posts.filter((post) => {
      const searchable = [post.title, post.slug, post.authorName, post.category, post.excerpt].join(" ").toLocaleLowerCase("pt-BR");
      return (!needle || searchable.includes(needle))
        && (statusFilter === "all" || post.status === statusFilter)
        && (categoryFilter === "all" || post.category === categoryFilter)
        && (authorFilter === "all" || post.authorName === authorFilter);
    });
    return [...filtered].sort((a, b) => {
      if (sortMode === "title-asc") return a.title.localeCompare(b.title, "pt-BR");
      if (sortMode === "title-desc") return b.title.localeCompare(a.title, "pt-BR");
      if (sortMode === "updated-asc") return postDateValue(a.updatedAt) - postDateValue(b.updatedAt);
      return postDateValue(b.updatedAt) - postDateValue(a.updatedAt);
    });
  }, [authorFilter, categoryFilter, posts, query, sortMode, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const safePage = clampPage(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const visiblePosts = useMemo(() => filteredPosts.slice(startIndex, startIndex + pageSize), [filteredPosts, pageSize, startIndex]);
  const selectedPost = modal?.postId ? posts.find((post) => post.id === modal.postId) : undefined;
  const actionPost = actionMenu ? posts.find((post) => post.id === actionMenu.postId) : undefined;
  const firstShown = filteredPosts.length ? startIndex + 1 : 0;
  const lastShown = Math.min(startIndex + visiblePosts.length, filteredPosts.length);
  const hasQuery = Boolean(query.trim() || statusFilter !== "all" || categoryFilter !== "all" || authorFilter !== "all" || sortMode !== "updated-desc");
  const closeActionMenu = () => { setActionMenu(null); setActionMenuPosition(null); };
  const changePageSize = (value: number) => { closeActionMenu(); setPageSize(value); setPage(1); };
  const clearQuery = () => {
    closeActionMenu();
    setQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setAuthorFilter("all");
    setSortMode("updated-desc");
    setPage(1);
  };

  const saveLocalPost = async (formData: FormData) => {
    const existingId = localPostText(formData, "id");
    const id = existingId || `preview-post-${crypto.randomUUID()}`;
    const existing = localPosts.find((post) => post.id === id);
    const title = localPostText(formData, "title") || "Conteúdo sem título";
    const slug = slugifyClient(localPostText(formData, "slug") || title) || `conteudo-${id.slice(-8)}`;
    const categoryId = localPostText(formData, "categoryId");
    const editorStatusValue = localPostText(formData, "status");
    const editorStatus: "draft" | "published" | "archived" = editorStatusValue === "published" || editorStatusValue === "archived" ? editorStatusValue : "draft";
    const publishedRaw = localPostText(formData, "publishedAt");
    const publishedDate = publishedRaw ? new Date(publishedRaw) : editorStatus === "published" ? new Date() : null;
    const publishedAtInput = publishedDate && Number.isFinite(publishedDate.getTime()) ? publishedDate.toISOString() : "";
    const coverMediaId = localPostText(formData, "coverMediaId");
    const authorMediaId = localPostText(formData, "authorMediaId");
    const coverImage = localPostImage(formData, "coverMediaUpload", coverMediaId, media, coverMediaId ? existing?.coverImage || "" : "");
    const authorImage = localPostImage(formData, "authorMediaUpload", authorMediaId, media, authorMediaId ? existing?.authorImage || "" : "");
    const links = Object.fromEntries(["instagram", "facebook", "youtube", "tiktok"].map((platform) => [platform, localPostText(formData, `link_${platform}`)]).filter(([, url]) => Boolean(url)));
    const next: PostRecord = {
      id,
      title,
      slug,
      excerpt: localPostText(formData, "excerpt"),
      contentMarkdown: localPostText(formData, "contentMarkdown"),
      status: editorStatus,
      editorStatus,
      category: categories.find((item) => item.id === categoryId)?.name || existing?.category || "Sem categoria",
      categoryId,
      authorName: localPostText(formData, "authorName") || "Lander Records",
      publishedAt: publishedDate && Number.isFinite(publishedDate.getTime()) ? postDisplayDate(publishedDate) : "",
      publishedAtInput,
      coverImage,
      coverMediaId,
      authorMediaId,
      authorImage,
      links,
      featuredOnHome: formData.has("featuredOnHome"),
      homePosition: localPostNumber(formData, "homePosition"),
      isPubliclyVisible: editorStatus === "published",
      seoTitle: localPostText(formData, "seoTitle"),
      seoDescription: localPostText(formData, "seoDescription"),
      canonicalUrl: localPostText(formData, "canonicalUrl"),
      updatedAt: postDisplayDate(new Date()),
    };
    setLocalPosts((current) => existingId ? current.map((post) => post.id === id ? next : post) : [next, ...current]);
    setLocalNotice(existingId ? `Conteúdo “${title}” atualizado nesta prévia.` : `Conteúdo “${title}” criado nesta prévia.`);
    setModal(null);
  };

  const deleteLocalPost = (post: PostRecord) => {
    if (!window.confirm(`Excluir “${post.title}” desta prévia?`)) return;
    setLocalPosts((current) => current.filter((item) => item.id !== post.id));
    closeActionMenu();
    setModal(null);
    setLocalNotice(`Conteúdo “${post.title}” excluído desta prévia.`);
  };

  useEffect(() => { setPage(1); closeActionMenu(); }, [authorFilter, categoryFilter, query, sortMode, statusFilter]);

  useEffect(() => {
    if (!canMutate || preview) return;
    const openModal = () => { closeActionMenu(); setModal({ mode: "create" }); };
    window.addEventListener("admin:new-content", openModal);
    return () => window.removeEventListener("admin:new-content", openModal);
  }, [canMutate, preview]);

  useLayoutEffect(() => {
    if (!actionMenu) return;
    const trigger = actionTriggerRef.current;
    const menu = actionMenuRef.current;
    if (!trigger || !menu) return;
    setActionMenuPosition(positionFloatingMenu(trigger.getBoundingClientRect(), menu.getBoundingClientRect()));
  }, [actionMenu]);

  useEffect(() => {
    if (!actionMenu) return;
    const close = () => closeActionMenu();
    const pointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest("[data-content-action-menu], [data-content-action-trigger]")) return;
      close();
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      close();
      window.setTimeout(() => actionTriggerRef.current?.focus(), 0);
    };
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

  const toggleActionMenu = (postId: string, trigger: HTMLButtonElement) => {
    if (actionMenu?.postId === postId) { closeActionMenu(); return; }
    actionTriggerRef.current = trigger;
    setActionMenuPosition(null);
    setActionMenu({ postId });
  };
  const closeViewModal = () => { setModal(null); window.setTimeout(() => actionTriggerRef.current?.focus(), 0); };

  return <div className={styles.manager} data-testid="posts-manager">
    {deleted ? <div className={styles.successNotice}>Conteúdo excluído com sucesso.</div> : null}
    {saved ? <div className={styles.successNotice}>Conteúdo salvo com sucesso.</div> : null}
    {localNotice ? <div className={styles.successNotice}>{localNotice}</div> : null}

    <section className="adminMetricGrid" aria-label="Resumo dos conteúdos">
      <article className="adminMetricCard is-red"><span className="adminMetricIcon"><AdminIcon name="posts" size={24}/></span><div className="adminMetricCopy"><span>Conteúdos</span><strong>{metrics.total.toLocaleString("pt-BR")}</strong><small>total cadastrado</small></div></article>
      <article className="adminMetricCard is-green"><span className="adminMetricIcon"><AdminIcon name="check" size={24}/></span><div className="adminMetricCopy"><span>Publicados</span><strong>{metrics.published.toLocaleString("pt-BR")}</strong><small>visíveis no site</small></div></article>
      <article className="adminMetricCard is-orange"><span className="adminMetricIcon"><AdminIcon name="edit" size={24}/></span><div className="adminMetricCopy"><span>Rascunhos</span><strong>{metrics.draft.toLocaleString("pt-BR")}</strong><small>aguardando publicação</small></div></article>
      <article className="adminMetricCard is-blue"><span className="adminMetricIcon"><AdminIcon name="document" size={24}/></span><div className="adminMetricCopy"><span>Arquivados</span><strong>{metrics.archived.toLocaleString("pt-BR")}</strong><small>fora de circulação</small></div></article>
    </section>

    {developmentMode && !preview ? <section className={styles.notice} role="status"><span aria-hidden="true" className={styles.noticeIcon}>i</span><div><strong>Modo de desenvolvimento liberado</strong><p>Você pode navegar pelos conteúdos usando o banco descartável do preview. Alterações persistentes continuam protegidas pelas regras administrativas do projeto.</p></div></section> : null}

    <section className={styles.queryPanel} aria-label="Busca e filtros de conteúdos">
      <label className={styles.queryField}>
        <span className="srOnly">Buscar conteúdos</span>
        <AdminIcon name="search" size={16}/>
        <input aria-label="Buscar conteúdos" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título, slug ou autor..." type="search" value={query}/>
      </label>
      <div className={styles.queryControls}>
        <label><span className="srOnly">Status</span><select aria-label="Filtrar por status" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}><option value="all">Todos os status</option><option value="published">Publicados</option><option value="draft">Rascunhos</option><option value="unpublished">Não publicados</option><option value="archived">Arquivados</option></select></label>
        <label><span className="srOnly">Categoria</span><select aria-label="Filtrar por categoria" onChange={(event) => setCategoryFilter(event.target.value)} value={categoryFilter}><option value="all">Todas as categorias</option>{postCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
        <label><span className="srOnly">Autor</span><select aria-label="Filtrar por autor" onChange={(event) => setAuthorFilter(event.target.value)} value={authorFilter}><option value="all">Todos os autores</option>{authors.map((author) => <option key={author} value={author}>{author}</option>)}</select></label>
        <label><span className="srOnly">Ordenar por</span><select aria-label="Ordenar conteúdos" onChange={(event) => setSortMode(event.target.value as SortMode)} value={sortMode}><option value="updated-desc">Mais recentes</option><option value="updated-asc">Mais antigos</option><option value="title-asc">Título A–Z</option><option value="title-desc">Título Z–A</option></select></label>
        {hasQuery ? <button className={styles.queryReset} onClick={clearQuery} type="button"><AdminIcon name="x" size={13}/>Limpar</button> : null}
      </div>
    </section>

    <section className={styles.catalog} aria-label="Conteúdos cadastrados">
      {posts.length && filteredPosts.length ? <div className={`tableview-surface cms-tableview-surface ${styles.tableSurface}`} aria-label="Lista de conteúdos">
        <div className={styles.scrollArea}><table className={styles.contentTable}>
          <thead><tr><th>Conteúdo</th><th>Página</th><th>Slug</th><th>Status</th><th>Autor</th><th>Atualização</th><th className={styles.actions}>Ações</th></tr></thead>
          <tbody>{visiblePosts.map((post) => <tr data-testid="content-row" key={post.id}>
            <td><div className={styles.identity}><span className={styles.documentIcon} aria-hidden="true"><AdminIcon name="document" size={15} /></span><span><strong>{post.title}</strong><small>{post.excerpt || "Sem resumo"}</small></span></div></td>
            <td><span className={styles.pageLabel}>Notícias</span></td>
            <td><span className={styles.slug}>/{post.slug}</span></td>
            <td><StatusBadge status={post.status} /></td>
            <td><span className={styles.author}>{post.authorName || "—"}</span></td>
            <td><time className={styles.date}>{post.updatedAt}</time></td>
            <td className={styles.actions}><button aria-controls={actionMenu?.postId === post.id ? "content-row-action-menu" : undefined} aria-expanded={actionMenu?.postId === post.id} aria-haspopup="menu" aria-label={`Ações de ${post.title}`} className={styles.actionTrigger} data-content-action-trigger onClick={(event) => toggleActionMenu(post.id, event.currentTarget)} type="button"><AdminIcon name="more" size={17}/></button></td>
          </tr>)}</tbody>
        </table></div>
        <AdminPagination
          currentPage={safePage}
          endItem={lastShown}
          itemLabel={visiblePosts.length === 1 ? "registro" : "registros"}
          onPageChange={(nextPage) => { closeActionMenu(); setPage(nextPage); }}
          onPageSizeChange={changePageSize}
          pageSize={pageSize}
          startItem={firstShown}
          totalItems={filteredPosts.length}
          totalPages={totalPages}
        />
      </div> : posts.length ? <div className={styles.empty}><span className={styles.emptyIcon}><AdminIcon name="search" size={20} /></span><strong>Nenhum conteúdo encontrado.</strong><span>Ajuste a busca ou os filtros para voltar a exibir as publicações.</span><button className="adminButton" onClick={clearQuery} type="button">Limpar filtros</button></div> : <div className={styles.empty}><span className={styles.emptyIcon}><AdminIcon name="document" size={20} /></span><strong>Nenhum conteúdo cadastrado.</strong><span>As publicações editoriais aparecerão aqui assim que forem criadas.</span><button className="adminPrimaryCompact" onClick={() => setModal({ mode: "create" })} type="button">Criar primeiro conteúdo</button></div>}
    </section>

    {actionMenu && actionPost && typeof document !== "undefined" ? createPortal(<div aria-label={`Ações de ${actionPost.title}`} className={styles.actionMenu} data-content-action-menu id="content-row-action-menu" ref={actionMenuRef} role="menu" style={{ position: "fixed", top: actionMenuPosition?.top ?? 0, left: actionMenuPosition?.left ?? 0, visibility: actionMenuPosition ? "visible" : "hidden", zIndex: 900 }}>
      <button onClick={() => { closeActionMenu(); setModal({ mode: "view", postId: actionPost.id }); }} role="menuitem" type="button"><AdminIcon name="eye" size={14}/>Ver</button>
      {canMutate && !preview ? <button onClick={() => { closeActionMenu(); setModal({ mode: "edit", postId: actionPost.id }); }} role="menuitem" type="button"><AdminIcon name="edit" size={14}/>Editar</button> : <button aria-disabled="true" className={styles.disabledAction} disabled role="menuitem" type="button"><AdminIcon name="edit" size={14}/>Editar</button>}
      {developmentMode && !preview ? <button className={styles.deleteAction} onClick={() => deleteLocalPost(actionPost)} role="menuitem" type="button"><AdminIcon name="trash" size={14}/>Excluir</button> : canDelete && !preview ? <form action={deletePostAction} onSubmit={(event) => { const confirmed = window.confirm(`Excluir definitivamente “${actionPost.title}”?`); if (!confirmed) { event.preventDefault(); return; } closeActionMenu(); }}><input name="id" type="hidden" value={actionPost.id}/><button className={styles.deleteAction} role="menuitem" type="submit"><AdminIcon name="trash" size={14}/>Excluir</button></form> : <button aria-disabled="true" className={`${styles.deleteAction} ${styles.disabledAction}`} disabled role="menuitem" type="button"><AdminIcon name="trash" size={14}/>Excluir</button>}
    </div>, document.body) : null}

    {modal?.mode === "view" && selectedPost ? <ContentViewDialog canEdit={canMutate && !preview} key={`view-${selectedPost.id}`} onClose={closeViewModal} onEdit={() => setModal({ mode: "edit", postId: selectedPost.id })} post={selectedPost}/> : modal ? <ContentEditorModal canEdit={canMutate && !preview} categories={categories} key={`${modal.mode}-${modal.postId || "new"}`} media={media} mode={modal.mode as "create" | "edit"} onClose={() => setModal(null)} onLocalSubmit={developmentMode ? saveLocalPost : undefined} post={selectedPost}/> : null}
  </div>;
}
