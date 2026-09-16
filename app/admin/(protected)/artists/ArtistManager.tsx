"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdminIcon } from "../../components/AdminIcon";
import styles from "./ArtistManager.module.css";

export type ArtistSummary = {
  id: string;
  name: string;
  slug: string;
  status: "published" | "draft" | "inactive" | "archived";
  cardImage: string;
  genres: string[];
  roles?: string[];
  releaseCount?: number;
  views?: number;
  audience?: number;
  homePosition?: number;
  isPubliclyVisible: boolean;
  updatedAt: string;
};

type Filters = { genre?: string; q?: string; status?: string };
type SortMode = "updated-desc" | "updated-asc" | "name-asc" | "name-desc";

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

function paginationItems(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const values = new Set([1, total, current - 1, current, current + 1].filter((value) => value >= 1 && value <= total));
  const sorted = [...values].sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];
  sorted.forEach((value, index) => {
    const previous = sorted[index - 1];
    if (previous && value - previous > 1) result.push("ellipsis");
    result.push(value);
  });
  return result;
}

export default function ArtistManager({ artists, canEdit = true, deleted, initialFilters = {}, preview = false }: { artists: ArtistSummary[]; canEdit?: boolean; deleted?: boolean; initialFilters?: Filters; preview?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialFilters.q || "");
  const [status, setStatus] = useState(initialFilters.status || "all");
  const [genre, setGenre] = useState(initialFilters.genre || "all");
  const [sort, setSort] = useState<SortMode>("updated-desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const genres = useMemo(() => Array.from(new Set(artists.flatMap((artist) => artist.genres))).sort((a, b) => a.localeCompare(b, "pt-BR")), [artists]);

  useEffect(() => {
    if (preview) return;
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (status !== "all") params.set("status", status);
    if (genre !== "all") params.set("genre", genre);
    const timer = window.setTimeout(() => router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false }), 180);
    return () => window.clearTimeout(timer);
  }, [genre, pathname, preview, query, router, status]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pt-BR");
    const next = artists.filter((artist) => {
      const searchable = [artist.name, artist.slug, ...(artist.roles || []), ...artist.genres].join(" ").toLocaleLowerCase("pt-BR");
      return (!needle || searchable.includes(needle)) && (status === "all" || artist.status === status) && (genre === "all" || artist.genres.includes(genre));
    });
    return [...next].sort((a, b) => {
      if (sort === "name-asc") return a.name.localeCompare(b.name, "pt-BR");
      if (sort === "name-desc") return b.name.localeCompare(a.name, "pt-BR");
      if (sort === "updated-asc") return dateValue(a.updatedAt) - dateValue(b.updatedAt);
      return dateValue(b.updatedAt) - dateValue(a.updatedAt);
    });
  }, [artists, genre, query, sort, status]);

  useEffect(() => { setPage(1); }, [genre, pageSize, query, sort, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  const startIndex = filtered.length ? (page - 1) * pageSize : 0;
  const pageRows = filtered.slice(startIndex, startIndex + pageSize);
  const endIndex = filtered.length ? startIndex + pageRows.length : 0;
  const hasFilters = Boolean(query.trim() || status !== "all" || genre !== "all");
  const allCurrentSelected = pageRows.length > 0 && pageRows.every((artist) => selected.has(artist.id));

  const clearFilters = () => {
    setQuery("");
    setStatus("all");
    setGenre("all");
    setSort("updated-desc");
  };

  const toggleArtist = (id: string) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const toggleCurrentPage = () => setSelected((current) => {
    const next = new Set(current);
    if (allCurrentSelected) pageRows.forEach((artist) => next.delete(artist.id));
    else pageRows.forEach((artist) => next.add(artist.id));
    return next;
  });

  return <div className={`adminDashboard ${styles.manager}`} data-testid="artist-manager">
    {deleted ? <div className="adminNotice">Artista excluído com sucesso.</div> : null}
    {preview ? <div className="adminNotice">Os dados deste preview são isolados e não alteram a persistência do ambiente real.</div> : null}

    <header className="adminDashboardHeading">
      <div><h1>Artistas</h1><p>Gerencie os artistas do seu selo, edite informações, discografia e conteúdos relacionados.</p></div>
      {canEdit && !preview ? <Link className="adminPrimaryCompact" href="/admin/artists/new"><AdminIcon name="plus" size={15} />Novo artista</Link> : null}
    </header>

    <section className={styles.tableSurface} aria-label="Artistas cadastrados">
      <div className={styles.toolbar} role="search">
        <label className={styles.searchField}>
          <span className="srOnly">Buscar artistas</span>
          <AdminIcon name="search" size={16} />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar artistas..." />
        </label>
        <label className={styles.filterField}><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos</option><option value="published">Ativos</option><option value="draft">Rascunhos</option><option value="inactive">Inativos</option><option value="archived">Arquivados</option></select></label>
        <label className={styles.filterField}><span>Gênero</span><select value={genre} onChange={(event) => setGenre(event.target.value)}><option value="all">Todos</option>{genres.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className={styles.filterField}><span>Ordenar por</span><select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="updated-desc">Mais recentes</option><option value="updated-asc">Mais antigos</option><option value="name-asc">Nome A–Z</option><option value="name-desc">Nome Z–A</option></select></label>
      </div>

      {filtered.length ? <>
        <div className={styles.scrollArea}>
          <table className={styles.artistTable} aria-label="Artistas cadastrados">
            <thead><tr>
              <th className={styles.checkboxColumn}><input aria-label="Selecionar artistas desta página" checked={allCurrentSelected} onChange={toggleCurrentPage} type="checkbox" /></th>
              <th>Artista</th><th>Gênero</th><th>Lançamentos</th><th>Visualizações</th><th>Status</th><th>Última atualização</th><th className={styles.actions}>Ações</th>
            </tr></thead>
            <tbody>{pageRows.map((artist) => {
              const roleLine = artist.roles?.length ? artist.roles.slice(0, 2).join(" · ") : `/artistas/${artist.slug}`;
              return <tr data-testid="artist-row" key={artist.id}>
                <td className={styles.checkboxColumn}><input aria-label={`Selecionar ${artist.name}`} checked={selected.has(artist.id)} onChange={() => toggleArtist(artist.id)} type="checkbox" /></td>
                <td><div className={styles.identity}>{artist.cardImage ? <Image alt="" height={42} src={artist.cardImage} unoptimized width={42} /> : <span className={styles.avatarFallback} aria-hidden="true"><AdminIcon name="artists" size={17} /></span>}<span><strong>{artist.name}</strong><small>{roleLine}</small></span></div></td>
                <td><div className={styles.taxonomy}><span>{artist.genres[0] || "Não informado"}</span>{artist.genres.length > 1 ? <small>+{artist.genres.length - 1}</small> : null}</div></td>
                <td><span className={styles.numericValue}>{numberLabel(artist.releaseCount)}</span></td>
                <td><span className={styles.numericValue}>{numberLabel(artist.views)}</span></td>
                <td><StatusBadge status={artist.status} /></td>
                <td><time dateTime={dateValue(artist.updatedAt) ? artist.updatedAt : undefined}>{dateLabel(artist.updatedAt)}</time></td>
                <td className={styles.actions}><details><summary aria-label={`Ações de ${artist.name}`}><AdminIcon name="more" size={18}/></summary><div className={styles.actionMenu}>{canEdit && !preview ? <Link href={`/admin/artists/${artist.id}`}><AdminIcon name="edit" size={14}/>Editar</Link> : null}{artist.isPubliclyVisible && !preview ? <Link href={`/artistas/${artist.slug}`} target="_blank"><AdminIcon name="eye" size={14}/>Visualizar</Link> : null}<Link href={preview ? "/cms-preview/artists" : `/admin/artists/${artist.id}/view`}><AdminIcon name="document" size={14}/>Consultar</Link></div></details></td>
              </tr>;
            })}</tbody>
          </table>
        </div>

        <footer className={styles.pagination} aria-label="Paginação dos artistas">
          <div className={styles.paginationSummary}><strong>{pageRows.length} registro{pageRows.length === 1 ? "" : "s"}</strong><span>{filtered.length ? `${startIndex + 1}–${endIndex} de ${filtered.length}` : "0 de 0"}</span></div>
          <div className={styles.paginationControls}>
            <button aria-label="Primeira página" disabled={page === 1} onClick={() => setPage(1)} type="button">«</button>
            <button aria-label="Página anterior" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button">‹</button>
            {paginationItems(page, pageCount).map((item, index) => item === "ellipsis" ? <span className={styles.ellipsis} key={`ellipsis-${index}`}>…</span> : <button aria-current={page === item ? "page" : undefined} className={page === item ? styles.activePage : ""} key={item} onClick={() => setPage(item)} type="button">{item}</button>)}
            <button aria-label="Próxima página" disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} type="button">›</button>
            <button aria-label="Última página" disabled={page === pageCount} onClick={() => setPage(pageCount)} type="button">»</button>
          </div>
          <label className={styles.pageSize}><span>Por página</span><select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label>
        </footer>
      </> : <div className={styles.empty}><span className={styles.emptyIcon}><AdminIcon name="artists" size={20} /></span><strong>{artists.length ? "Nenhum artista encontrado" : "Nenhum artista cadastrado"}</strong><span>{artists.length ? "Ajuste os filtros para voltar a exibir o catálogo." : "Cadastre o primeiro artista para começar a montar o casting da Lander Records."}</span>{hasFilters ? <button className="adminButton" onClick={clearFilters} type="button">Limpar filtros</button> : canEdit && !preview ? <Link className="adminPrimaryCompact" href="/admin/artists/new"><AdminIcon name="plus" size={14} />Cadastrar primeiro artista</Link> : null}</div>}
    </section>
  </div>;
}