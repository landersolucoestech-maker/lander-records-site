"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { deleteArtistAction } from "../../artist-actions";
import { AdminIcon } from "../../components/AdminIcon";
import { AdminPagination } from "../../components/AdminPagination";
import ArtistForm, { type ArtistEditorInitial, type ArtistFormOptions } from "./ArtistForm";
import styles from "./ArtistManager.module.css";

export type ArtistSummary = {
  id: string;
  name: string;
  slug: string;
  status: "published" | "draft" | "inactive" | "archived";
  cardImage: string;
  genres: string[];
  roles?: string[];
  views?: number;
  audience?: number;
  homePosition?: number;
  isPubliclyVisible: boolean;
  shortBio?: string;
  biography?: string;
  updatedAt: string;
};

type Filters = { genre?: string; q?: string; role?: string; status?: string };
type SortMode = "updated-desc" | "updated-asc" | "name-asc" | "name-desc";
type ArtistModalState = { mode: "create" } | { mode: "view" | "edit"; artistId: string } | null;
type ActionMenuState = { artistId: string } | null;
type ActionMenuPosition = { top: number; left: number } | null;

const focusableSelector = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]';
const emptyEditorOptions: ArtistFormOptions = { media: [], categories: [], roles: [], genres: [], destinations: [] };

function StatusBadge({ status }: { status: ArtistSummary["status"] }) {
  const label = status === "published" ? "Ativo" : status === "draft" ? "Rascunho" : status === "inactive" ? "Inativo" : "Arquivado";
  const className = status === "published" ? styles.statusPublished : status === "draft" ? styles.statusDraft : status === "inactive" ? styles.statusInactive : styles.statusArchived;
  return <span className={`${styles.statusBadge} ${className}`}><i aria-hidden="true" />{label}</span>;
}

function dateValue(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateLabel(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value || "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(parsed));
}

function numberLabel(value: number | undefined) {
  if (value == null || value < 0) return "—";
  return new Intl.NumberFormat("pt-BR").format(value);
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

function ArtistViewDialog({ artist, canEdit, onClose, onEdit }: { artist: ArtistSummary; canEdit: boolean; onClose: () => void; onEdit: () => void }) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => { setMounted(true); }, []);
  useDialogLifecycle(mounted, onClose, dialogRef);
  if (!mounted) return null;

  return createPortal(<div className={styles.modalBackdrop} onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }} role="presentation">
    <section aria-labelledby="artist-view-title" aria-modal="true" className={styles.viewDialog} ref={dialogRef} role="dialog" tabIndex={-1}>
      <header className={styles.modalHeader}><div><span>VISUALIZAÇÃO</span><h2 id="artist-view-title">Perfil do artista</h2><p>Consulta consolidada do perfil sem sair do catálogo.</p></div><button aria-label="Fechar visualização" className={styles.modalClose} onClick={onClose} type="button">×</button></header>
      <div className={styles.viewBody}>
        <section className={styles.viewHero}>
          {artist.cardImage ? <Image alt="" height={112} src={artist.cardImage} unoptimized width={112}/> : <span className={styles.viewAvatar}><AdminIcon name="artists" size={28}/></span>}
          <div><StatusBadge status={artist.status}/><h3>{artist.name}</h3><p>{artist.shortBio || "Sem resumo curto cadastrado."}</p><div className={styles.viewChips}>{[...(artist.roles || []), ...artist.genres].map((item) => <span key={item}>{item}</span>)}</div></div>
        </section>
        <section className={styles.viewGrid}>
          <article><span>Slug</span><strong>/{artist.slug}</strong></article>
          <article><span>Status</span><strong>{artist.status === "published" ? "Ativo" : artist.status === "draft" ? "Rascunho" : artist.status === "inactive" ? "Inativo" : "Arquivado"}</strong></article>
          <article><span>Visualizações</span><strong>{numberLabel(artist.views)}</strong></article>
          <article><span>Atualização</span><strong>{dateLabel(artist.updatedAt)}</strong></article>
        </section>
        <section className={styles.viewBio}><span>BIOGRAFIA</span><p>{artist.biography || "Biografia não cadastrada."}</p></section>
      </div>
      <footer className={styles.modalFooter}><div>{artist.isPubliclyVisible ? <a className={styles.modalSecondary} href={`/artistas/${artist.slug}`} rel="noopener noreferrer" target="_blank"><AdminIcon name="eye" size={14}/>Abrir no site</a> : <span className={styles.privateHint}>Perfil ainda não está público.</span>}</div><div><button className={styles.modalSecondary} onClick={onClose} type="button">Fechar</button>{canEdit ? <button className={styles.modalPrimary} onClick={onEdit} type="button"><AdminIcon name="edit" size={14}/>Editar</button> : null}</div></footer>
    </section>
  </div>, document.body);
}

function ArtistEditorDialog({ initial, mode, onClose, options }: { initial: ArtistEditorInitial; mode: "create" | "edit"; onClose: () => void; options: ArtistFormOptions }) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => { setMounted(true); }, []);
  useDialogLifecycle(mounted, onClose, dialogRef);
  if (!mounted) return null;

  return createPortal(<div className={styles.modalBackdrop} onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }} role="presentation">
    <section aria-labelledby="artist-editor-title" aria-modal="true" className={styles.editDialog} ref={dialogRef} role="dialog" tabIndex={-1}>
      <header className={styles.modalHeader}><div><span>{mode === "create" ? "CRIAÇÃO" : "EDIÇÃO"}</span><h2 id="artist-editor-title">{mode === "create" ? "Novo artista" : "Editar artista"}</h2><p>{mode === "create" ? "Cadastre identidade, mídias, plataformas e publicação sem sair do catálogo." : "Atualize as informações usando o mesmo formulário canônico do módulo."}</p></div><button aria-label={mode === "create" ? "Fechar criação" : "Fechar edição"} className={styles.modalClose} onClick={onClose} type="button">×</button></header>
      <div className={styles.editBody}><ArtistForm embedded initial={initial} onCancel={onClose} {...options}/></div>
    </section>
  </div>, document.body);
}

export default function ArtistManager({ artists, canDelete = false, canEdit = true, deleted, editorById = {}, editorOptions = emptyEditorOptions, initialFilters = {}, preview = false, saved }: { artists: ArtistSummary[]; canDelete?: boolean; canEdit?: boolean; deleted?: boolean; editorById?: Record<string, ArtistEditorInitial>; editorOptions?: ArtistFormOptions; initialFilters?: Filters; preview?: boolean; saved?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialFilters.q || "");
  const [status, setStatus] = useState(initialFilters.status || "all");
  const [genre, setGenre] = useState(initialFilters.genre || "all");
  const [role, setRole] = useState(initialFilters.role || "all");
  const [sort, setSort] = useState<SortMode>("updated-desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modal, setModal] = useState<ArtistModalState>(null);
  const [actionMenu, setActionMenu] = useState<ActionMenuState>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<ActionMenuPosition>(null);
  const actionTriggerRef = useRef<HTMLButtonElement | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const genres = useMemo(() => Array.from(new Set(artists.flatMap((artist) => artist.genres))).sort((a, b) => a.localeCompare(b, "pt-BR")), [artists]);
  const roles = useMemo(() => Array.from(new Set(artists.flatMap((artist) => artist.roles || []))).sort((a, b) => a.localeCompare(b, "pt-BR")), [artists]);
  const metrics = useMemo(() => ({
    total: artists.length,
    published: artists.filter((artist) => artist.status === "published").length,
    draft: artists.filter((artist) => artist.status === "draft").length,
    views: artists.reduce((total, artist) => total + Math.max(0, artist.views || 0), 0),
  }), [artists]);

  useEffect(() => {
    if (preview) return;
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (status !== "all") params.set("status", status);
    if (genre !== "all") params.set("genre", genre);
    if (role !== "all") params.set("role", role);
    const timer = window.setTimeout(() => router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false }), 180);
    return () => window.clearTimeout(timer);
  }, [genre, pathname, preview, query, role, router, status]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pt-BR");
    const next = artists.filter((artist) => {
      const searchable = [artist.name, artist.slug, ...(artist.roles || []), ...artist.genres].join(" ").toLocaleLowerCase("pt-BR");
      return (!needle || searchable.includes(needle))
        && (status === "all" || artist.status === status)
        && (genre === "all" || artist.genres.includes(genre))
        && (role === "all" || (artist.roles || []).includes(role));
    });
    return [...next].sort((a, b) => {
      if (sort === "name-asc") return a.name.localeCompare(b.name, "pt-BR");
      if (sort === "name-desc") return b.name.localeCompare(a.name, "pt-BR");
      if (sort === "updated-asc") return dateValue(a.updatedAt) - dateValue(b.updatedAt);
      return dateValue(b.updatedAt) - dateValue(a.updatedAt);
    });
  }, [artists, genre, query, role, sort, status]);

  useEffect(() => { setPage(1); closeActionMenu(); }, [genre, pageSize, query, role, sort, status]);

  useEffect(() => {
    if (!canEdit || preview) return;
    const openCreate = () => { closeActionMenu(); setModal({ mode: "create" }); };
    window.addEventListener("admin:new-artist", openCreate);
    return () => window.removeEventListener("admin:new-artist", openCreate);
  }, [canEdit, preview]);

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
      if (target?.closest("[data-artist-action-menu], [data-artist-action-trigger]")) return;
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

  const toggleActionMenu = (artistId: string, trigger: HTMLButtonElement) => {
    if (actionMenu?.artistId === artistId) { closeActionMenu(); return; }
    actionTriggerRef.current = trigger;
    setActionMenuPosition(null);
    setActionMenu({ artistId });
  };

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  const startIndex = filtered.length ? (page - 1) * pageSize : 0;
  const pageRows = filtered.slice(startIndex, startIndex + pageSize);
  const endIndex = filtered.length ? startIndex + pageRows.length : 0;
  const selectedArtist = modal && modal.mode !== "create" ? artists.find((artist) => artist.id === modal.artistId) : undefined;
  const actionArtist = actionMenu ? artists.find((artist) => artist.id === actionMenu.artistId) : undefined;
  const selectedEditor = modal?.mode === "edit" ? editorById[modal.artistId] : undefined;
  const hasFilters = Boolean(query.trim() || status !== "all" || genre !== "all" || role !== "all" || sort !== "updated-desc");
  const closeActionMenu = () => { setActionMenu(null); setActionMenuPosition(null); };

  const clearFilters = () => {
    setQuery("");
    setStatus("all");
    setGenre("all");
    setRole("all");
    setSort("updated-desc");
    setPage(1);
  };

  return <div className={`adminDashboard ${styles.manager}`} data-testid="artist-manager">
    {deleted ? <div className="adminNotice">Artista excluído com sucesso.</div> : null}
    {saved ? <div className="adminNotice">Artista salvo com sucesso.</div> : null}

    <section className="adminMetricGrid" aria-label="Resumo dos artistas">
      <article className="adminMetricCard is-red"><span className="adminMetricIcon"><AdminIcon name="artists" size={24}/></span><div className="adminMetricCopy"><span>Artistas</span><strong>{metrics.total.toLocaleString("pt-BR")}</strong><small>total cadastrado</small></div></article>
      <article className="adminMetricCard is-green"><span className="adminMetricIcon"><AdminIcon name="check" size={24}/></span><div className="adminMetricCopy"><span>Ativos</span><strong>{metrics.published.toLocaleString("pt-BR")}</strong><small>publicados no site</small></div></article>
      <article className="adminMetricCard is-orange"><span className="adminMetricIcon"><AdminIcon name="edit" size={24}/></span><div className="adminMetricCopy"><span>Rascunhos</span><strong>{metrics.draft.toLocaleString("pt-BR")}</strong><small>aguardando publicação</small></div></article>
      <article className="adminMetricCard is-blue"><span className="adminMetricIcon"><AdminIcon name="eye" size={24}/></span><div className="adminMetricCopy"><span>Visualizações</span><strong>{metrics.views.toLocaleString("pt-BR")}</strong><small>métricas integradas</small></div></article>
    </section>

    {preview ? <div className="adminNotice">Os dados desta prévia são isolados e não alteram a persistência do ambiente real.</div> : null}

    <section className={styles.queryPanel} aria-label="Busca e filtros de artistas">
      <label className={styles.searchField}>
        <span className="srOnly">Buscar artistas</span>
        <AdminIcon name="search" size={16} />
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, slug, função ou gênero..." />
      </label>
      <div className={styles.queryControls}>
        <label><span className="srOnly">Status</span><select aria-label="Filtrar por status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos os status</option><option value="published">Ativos</option><option value="draft">Rascunhos</option><option value="inactive">Inativos</option><option value="archived">Arquivados</option></select></label>
        <label><span className="srOnly">Gênero</span><select aria-label="Filtrar por gênero" value={genre} onChange={(event) => setGenre(event.target.value)}><option value="all">Todos os gêneros</option>{genres.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="srOnly">Função</span><select aria-label="Filtrar por função" value={role} onChange={(event) => setRole(event.target.value)}><option value="all">Todas as funções</option>{roles.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="srOnly">Ordenar por</span><select aria-label="Ordenar artistas" value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="updated-desc">Mais recentes</option><option value="updated-asc">Mais antigos</option><option value="name-asc">Nome A–Z</option><option value="name-desc">Nome Z–A</option></select></label>
        {hasFilters ? <button className={styles.queryReset} onClick={clearFilters} type="button"><AdminIcon name="x" size={13}/>Limpar</button> : null}
      </div>
    </section>

    <section className={styles.tableSurface} aria-label="Artistas cadastrados">
      {filtered.length ? <>
        <div className={styles.scrollArea}>
          <table className={styles.artistTable} aria-label="Artistas cadastrados">
            <thead><tr><th>Artista</th><th>Gênero</th><th>Visualizações</th><th>Status</th><th>Última atualização</th><th className={styles.actions}>Ações</th></tr></thead>
            <tbody>{pageRows.map((artist) => {
              const roleLine = artist.roles?.length ? artist.roles.slice(0, 2).join(" · ") : `/artistas/${artist.slug}`;
              return <tr data-testid="artist-row" key={artist.id}>
                <td><div className={styles.identity}>{artist.cardImage ? <Image alt="" height={42} src={artist.cardImage} unoptimized width={42} /> : <span className={styles.avatarFallback} aria-hidden="true"><AdminIcon name="artists" size={17} /></span>}<span><strong>{artist.name}</strong><small>{roleLine}</small></span></div></td>
                <td><div className={styles.taxonomy}><span>{artist.genres[0] || "Não informado"}</span>{artist.genres.length > 1 ? <small>+{artist.genres.length - 1}</small> : null}</div></td>
                <td><span className={styles.numericValue}>{numberLabel(artist.views)}</span></td>
                <td><StatusBadge status={artist.status} /></td>
                <td><time dateTime={dateValue(artist.updatedAt) ? artist.updatedAt : undefined}>{dateLabel(artist.updatedAt)}</time></td>
                <td className={styles.actions}><button aria-controls={actionMenu?.artistId === artist.id ? "artist-row-action-menu" : undefined} aria-expanded={actionMenu?.artistId === artist.id} aria-haspopup="menu" aria-label={`Ações de ${artist.name}`} className={styles.actionTrigger} data-artist-action-trigger onClick={(event) => toggleActionMenu(artist.id, event.currentTarget)} type="button"><AdminIcon name="more" size={18}/></button></td>
              </tr>;
            })}</tbody>
          </table>
        </div>

        <AdminPagination
          currentPage={page}
          endItem={endIndex}
          itemLabel={pageRows.length === 1 ? "registro" : "registros"}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSize={pageSize}
          startItem={filtered.length ? startIndex + 1 : 0}
          totalItems={filtered.length}
          totalPages={pageCount}
        />
      </> : <div className={styles.empty}><span className={styles.emptyIcon}><AdminIcon name="artists" size={20} /></span><strong>{artists.length ? "Nenhum artista encontrado" : "Nenhum artista cadastrado"}</strong><span>{artists.length ? "Ajuste os filtros para voltar a exibir o catálogo." : "Cadastre o primeiro artista para começar a montar o casting da Lander Records."}</span>{hasFilters ? <button className="adminButton" onClick={clearFilters} type="button">Limpar filtros</button> : canEdit && !preview ? <button className="adminPrimaryCompact" onClick={() => setModal({ mode: "create" })} type="button"><AdminIcon name="plus" size={14} />Cadastrar primeiro artista</button> : null}</div>}
    </section>

    {actionMenu && actionArtist && typeof document !== "undefined" ? createPortal(<div aria-label={`Ações de ${actionArtist.name}`} className={styles.actionMenu} data-artist-action-menu id="artist-row-action-menu" ref={actionMenuRef} role="menu" style={{ position: "fixed", top: actionMenuPosition?.top ?? 0, left: actionMenuPosition?.left ?? 0, visibility: actionMenuPosition ? "visible" : "hidden", zIndex: 900 }}>
      <button onClick={() => { closeActionMenu(); setModal({ mode: "view", artistId: actionArtist.id }); }} role="menuitem" type="button"><AdminIcon name="eye" size={14}/>Visualizar</button>
      {canEdit && !preview && editorById[actionArtist.id] ? <button onClick={() => { closeActionMenu(); setModal({ mode: "edit", artistId: actionArtist.id }); }} role="menuitem" type="button"><AdminIcon name="edit" size={14}/>Editar</button> : <button aria-disabled="true" className={styles.disabledAction} disabled role="menuitem" type="button"><AdminIcon name="edit" size={14}/>Editar</button>}
      {canDelete && !preview ? <form action={deleteArtistAction} onSubmit={(event) => { const confirmed = window.confirm(`Excluir definitivamente “${actionArtist.name}”?`); if (!confirmed) { event.preventDefault(); return; } closeActionMenu(); }}><input name="id" type="hidden" value={actionArtist.id}/><button className={styles.deleteAction} role="menuitem" type="submit"><AdminIcon name="trash" size={14}/>Excluir</button></form> : <button aria-disabled="true" className={`${styles.deleteAction} ${styles.disabledAction}`} disabled role="menuitem" type="button"><AdminIcon name="trash" size={14}/>Excluir</button>}
    </div>, document.body) : null}

    {modal?.mode === "view" && selectedArtist ? <ArtistViewDialog artist={selectedArtist} canEdit={canEdit && !preview && Boolean(editorById[selectedArtist.id])} key={`view-${selectedArtist.id}`} onClose={() => setModal(null)} onEdit={() => setModal({ mode: "edit", artistId: selectedArtist.id })}/> : null}
    {modal?.mode === "create" ? <ArtistEditorDialog initial={{}} key="create-artist" mode="create" onClose={() => setModal(null)} options={editorOptions}/> : null}
    {modal?.mode === "edit" && selectedEditor ? <ArtistEditorDialog initial={selectedEditor} key={`edit-${modal.artistId}`} mode="edit" onClose={() => setModal(null)} options={editorOptions}/> : null}
  </div>;
}