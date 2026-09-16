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
  homePosition?: number;
  isPubliclyVisible: boolean;
  updatedAt: string;
};

type Filters = { genre?: string; q?: string; status?: string };

function StatusBadge({ status }: { status: ArtistSummary["status"] }) {
  const label = status === "published" ? "Publicado" : status === "draft" ? "Rascunho" : status === "inactive" ? "Inativo" : "Arquivado";
  return <span className={status === "published" ? "adminBadge live" : status === "draft" ? "adminBadge draft" : "adminBadge archived"}><i aria-hidden="true" />{label}</span>;
}

export default function ArtistManager({ artists, canEdit = true, deleted, initialFilters = {}, preview = false }: { artists: ArtistSummary[]; canEdit?: boolean; deleted?: boolean; initialFilters?: Filters; preview?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialFilters.q || "");
  const [status, setStatus] = useState(initialFilters.status || "all");
  const [genre, setGenre] = useState(initialFilters.genre || "all");
  const [sort, setSort] = useState("name-asc");
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
    const next = artists.filter((artist) => (!needle || [artist.name, artist.slug, ...artist.genres].join(" ").toLocaleLowerCase("pt-BR").includes(needle)) && (status === "all" || artist.status === status) && (genre === "all" || artist.genres.includes(genre)));
    return [...next].sort((a, b) => sort === "name-desc" ? b.name.localeCompare(a.name, "pt-BR") : a.name.localeCompare(b.name, "pt-BR"));
  }, [artists, genre, query, sort, status]);

  const hasFilters = Boolean(query.trim() || status !== "all" || genre !== "all");
  const clearFilters = () => { setQuery(""); setStatus("all"); setGenre("all"); setSort("name-asc"); };

  return <div className={styles.manager} data-testid="artist-manager">
    {deleted ? <div className="adminNotice">Artista excluído com sucesso.</div> : null}
    {preview ? <div className="adminNotice">Os dados deste preview são isolados e não alteram a persistência do ambiente real.</div> : null}

    <section className={styles.catalog} aria-label="Artistas">
      <div className={styles.toolbar} role="search">
        <label className={styles.search}><span className="srOnly">Buscar artistas</span><AdminIcon name="search" size={17} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar artista por nome, gênero ou slug..." /></label>
        <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos</option><option value="published">Publicados</option><option value="draft">Rascunhos</option><option value="inactive">Inativos</option><option value="archived">Arquivados</option></select></label>
        <label><span>Gênero</span><select value={genre} onChange={(event) => setGenre(event.target.value)}><option value="all">Todos</option>{genres.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Ordenar por</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="name-asc">Nome A–Z</option><option value="name-desc">Nome Z–A</option></select></label>
        {hasFilters ? <button className="adminButton" onClick={clearFilters} type="button">Limpar</button> : null}
      </div>

      {filtered.length ? <div className={styles.tableWrap} aria-label="Artistas cadastrados" role="table">
        <div className={styles.tableHeader} role="row"><span role="columnheader">Artista</span><span role="columnheader">Gênero</span><span role="columnheader">Status</span><span role="columnheader">Destaque</span><span role="columnheader">Atualização</span><span role="columnheader">Ações</span></div>
        <div className={styles.rows} role="rowgroup">{filtered.map((artist) => <div className={styles.row} data-testid="artist-row" key={artist.id} role="row">
          <div className={styles.identity} role="cell">{artist.cardImage ? <Image alt="" height={46} src={artist.cardImage} unoptimized width={46} /> : <span className={styles.avatarFallback} aria-hidden="true"><AdminIcon name="artists" size={19} /></span>}<span><strong>{artist.name}</strong><small>/artistas/{artist.slug}</small></span></div>
          <div className={styles.taxonomy} role="cell"><span>{artist.genres[0] || "Não informado"}</span>{artist.genres.length > 1 ? <small>+{artist.genres.length - 1}</small> : null}</div>
          <div role="cell"><StatusBadge status={artist.status} /></div>
          <div className={styles.homePlacement} role="cell">{typeof artist.homePosition === "number" ? <><b aria-hidden="true">★</b><span><strong>Posição {artist.homePosition}</strong><small>Home</small></span></> : <span><strong>—</strong><small>Sem destaque</small></span>}</div>
          <time role="cell">{artist.updatedAt}</time>
          <div aria-label={`Ações de ${artist.name}`} className={styles.actions} role="cell">{canEdit && !preview ? <Link aria-label={`Editar ${artist.name}`} href={`/admin/artists/${artist.id}`}><AdminIcon name="edit" size={16} /></Link> : <button aria-label={`Editar ${artist.name}`} disabled type="button"><AdminIcon name="edit" size={16} /></button>}{artist.isPubliclyVisible && !preview ? <Link aria-label={`Visualizar ${artist.name}`} href={`/artistas/${artist.slug}`} target="_blank"><AdminIcon name="eye" size={16} /></Link> : null}<Link aria-label={`Consultar ${artist.name}`} href={preview ? "/cms-preview/artists" : `/admin/artists/${artist.id}/view`}><AdminIcon name="more" size={17} /></Link></div>
        </div>)}</div>
        <div className={styles.resultCount}><span>{filtered.length} artista{filtered.length === 1 ? "" : "s"}</span><span>Mostrando {filtered.length} de {artists.length}</span></div>
      </div> : <div className={styles.empty}><strong>{artists.length ? "Nenhum artista encontrado para os filtros selecionados." : "Nenhum artista cadastrado."}</strong>{hasFilters ? <button className="adminButton" onClick={clearFilters} type="button">Limpar filtros</button> : canEdit && !preview ? <Link className="adminButton primary" href="/admin/artists/new">Cadastrar primeiro artista</Link> : null}</div>}
    </section>
  </div>;
}
