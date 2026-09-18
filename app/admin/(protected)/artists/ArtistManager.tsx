"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdminIcon } from "../../components/AdminIcon";
import { AdminPagination } from "../../components/AdminPagination";
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
  updatedAt: string;
};

type Filters = { genre?: string; q?: string; role?: string; status?: string };
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

export default function ArtistManager({ artists, canEdit = true, deleted, initialFilters = {}, preview = false }: { artists: ArtistSummary[]; canEdit?: boolean; deleted?: boolean; initialFilters?: Filters; preview?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialFilters.q || "");
  const [status, setStatus] = useState(initialFilters.status || "all");
  const [genre, setGenre] = useState(initialFilters.genre || "all");
  const [role, setRole] = useState(initialFilters.role || "all");
  const [sort, setSort] = useState<SortMode>("updated-desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  useEffect(() => { setPage(1); }, [genre, pageSize, query, role, sort, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  const startIndex = filtered.length ? (page - 1) * pageSize : 0;
  const pageRows = filtered.slice(startIndex, startIndex + pageSize);
  const endIndex = filtered.length ? startIndex + pageRows.length : 0;
  const hasFilters = Boolean(query.trim() || status !== "all" || genre !== "all" || role !== "all" || sort !== "updated-desc");

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
                <td className={styles.actions}><details><summary aria-label={`Ações de ${artist.name}`}><AdminIcon name="more" size={18}/></summary><div className={styles.actionMenu}>{canEdit && !preview ? <Link href={`/admin/artists/${artist.id}`}><AdminIcon name="edit" size={14}/>Editar</Link> : null}{artist.isPubliclyVisible && !preview ? <Link href={`/artistas/${artist.slug}`} target="_blank"><AdminIcon name="eye" size={14}/>Visualizar</Link> : null}<Link href={preview ? "/cms-preview/artists" : `/admin/artists/${artist.id}/view`}><AdminIcon name="document" size={14}/>Consultar</Link></div></details></td>
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
      </> : <div className={styles.empty}><span className={styles.emptyIcon}><AdminIcon name="artists" size={20} /></span><strong>{artists.length ? "Nenhum artista encontrado" : "Nenhum artista cadastrado"}</strong><span>{artists.length ? "Ajuste os filtros para voltar a exibir o catálogo." : "Cadastre o primeiro artista para começar a montar o casting da Lander Records."}</span>{hasFilters ? <button className="adminButton" onClick={clearFilters} type="button">Limpar filtros</button> : canEdit && !preview ? <Link className="adminPrimaryCompact" href="/admin/artists/new"><AdminIcon name="plus" size={14} />Cadastrar primeiro artista</Link> : null}</div>}
    </section>
  </div>;
}