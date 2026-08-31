"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdminIcon, type IconName } from "../../components/AdminIcon";
import styles from "./ArtistManager.module.css";

export type ArtistSummary = { id: string; name: string; slug: string; status: "published" | "draft" | "inactive" | "archived"; cardImage: string; genres: string[]; homePosition?: number; isPubliclyVisible: boolean; updatedAt: string };
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
  const filtered = useMemo(() => { const needle = query.trim().toLocaleLowerCase("pt-BR"); return artists.filter((artist) => (!needle || [artist.name, artist.slug, ...artist.genres].join(" ").toLocaleLowerCase("pt-BR").includes(needle)) && (status === "all" || artist.status === status) && (genre === "all" || artist.genres.includes(genre))); }, [artists, genre, query, status]);
  const published = artists.filter((artist) => artist.status === "published").length;
  const drafts = artists.filter((artist) => artist.status === "draft").length;
  const featured = artists.filter((artist) => typeof artist.homePosition === "number").length;
  const hasFilters = Boolean(query.trim() || status !== "all" || genre !== "all");
  const clearFilters = () => { setQuery(""); setStatus("all"); setGenre("all"); };

  return <div className={styles.manager} data-testid="artist-manager">
    {preview ? <div className="adminPreviewNotice">BACKEND_ENVIRONMENT_DEFERRED · dados visuais isolados e sem persistência.</div> : null}
    <header className={styles.header}><div><p>Artistas / Visão geral</p><h1>Artistas</h1><span>Gerencie os artistas da Lander Records. Cadastre, edite perfis e defina destaques.</span></div>{canEdit && !preview ? <Link className="adminButton primary" href="/admin/artists/new"><span aria-hidden="true">＋</span>Novo artista</Link> : preview ? <button className="adminButton primary" disabled type="button">＋ Novo artista</button> : null}</header>
    {deleted ? <div className={styles.success}>Artista excluído com sucesso.</div> : null}
    <section aria-label="Resumo editorial dos artistas" className={styles.metrics}>
      {[["artists", "Total de artistas", artists.length, "Cadastrados"], ["home", "Em destaque na Home", featured, "selecionados"], ["pages", "Publicados", published, "artistas visíveis"], ["posts", "Rascunhos", drafts, "não publicados"]].map(([icon, label, value, detail]) => <article data-testid="artists-metric-card" key={String(label)}><span className={styles.metricIcon}><AdminIcon name={icon as IconName} /></span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>)}
    </section>
    <section className={styles.catalog}>
      <div className={styles.toolbar} role="search"><label className={styles.search}><span className="srOnly">Buscar artistas</span><AdminIcon name="search" size={17} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar artista por nome, gênero ou slug..." /></label><label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos</option><option value="published">Publicados</option><option value="draft">Rascunhos</option><option value="inactive">Inativos</option><option value="archived">Arquivados</option></select></label><label><span>Gênero</span><select value={genre} onChange={(event) => setGenre(event.target.value)}><option value="all">Todos</option>{genres.map((item) => <option key={item}>{item}</option>)}</select></label>{hasFilters && filtered.length ? <button className="adminButton" onClick={clearFilters} type="button">Limpar filtros</button> : null}</div>
      {filtered.length ? <div aria-label="Artistas cadastrados" role="table"><div className={styles.tableHeader} role="row">{["Artista", "Gênero", "Status", "Destaque", "Atualizado em", "Ações"].map((label) => <span key={label} role="columnheader">{label}</span>)}</div><div className={styles.rows} role="rowgroup">{filtered.map((artist) => <div className={styles.row} data-testid="artist-row" key={artist.id} role="row">
        <div aria-label={`Artista: ${artist.name}`} className={styles.identity} role="cell">{artist.cardImage ? <Image alt={`Imagem de ${artist.name}`} height={64} src={artist.cardImage} unoptimized width={64} /> : <span className={styles.avatarFallback} aria-hidden="true"><AdminIcon name="artists" /></span>}<span><strong>{artist.name}</strong><small>/artistas/{artist.slug}</small></span></div>
        <div aria-label={`Gênero: ${artist.genres.join(", ") || "Não informado"}`} className={styles.taxonomy} role="cell"><span>{artist.genres[0] || "Não informado"}</span>{artist.genres.length > 1 ? <small>+{artist.genres.length - 1}</small> : null}</div><div aria-label={`Status: ${artist.status}`} role="cell"><StatusBadge status={artist.status} /></div>
        <div aria-label={typeof artist.homePosition === "number" ? `Destaque na Home, posição ${artist.homePosition}` : "Fora da Home"} className={styles.homePlacement} role="cell">{typeof artist.homePosition === "number" ? <><b aria-hidden="true">★</b><span><strong>Posição {artist.homePosition}</strong><small>na Home</small></span></> : <span><strong>—</strong><small>fora da Home</small></span>}</div>
        <time aria-label={`Atualizado em ${artist.updatedAt}`} role="cell">{artist.updatedAt}</time><div aria-label={`Ações de ${artist.name}`} className={styles.actions} role="cell">{canEdit && !preview ? <><Link aria-label={`Editar ${artist.name}`} href={`/admin/artists/${artist.id}`}><AdminIcon name="pages" size={16} /></Link><Link aria-label={`Consultar ${artist.name} no CMS`} href={`/admin/artists/${artist.id}/view`}><AdminIcon name="artists" size={16} /></Link></> : null}{preview ? <button aria-label={`Editar ${artist.name}`} disabled type="button"><AdminIcon name="pages" size={16} /></button> : null}{artist.isPubliclyVisible && !preview ? <Link aria-label={`Visualizar perfil público de ${artist.name} (abre em nova aba)`} href={`/artistas/${artist.slug}`} target="_blank"><AdminIcon name="external" size={16} /></Link> : preview ? <button aria-label={`Perfil público de ${artist.name} não disponível no preview`} disabled type="button"><AdminIcon name="external" size={16} /></button> : null}</div>
      </div>)}</div><div className={styles.resultCount}>Mostrando {filtered.length} de {artists.length} artistas</div></div> : <div className={styles.empty} data-testid="artists-empty"><strong>{artists.length ? "Nenhum artista encontrado para os filtros selecionados." : "Nenhum artista cadastrado."}</strong>{hasFilters ? <button className="adminButton" onClick={clearFilters} type="button">Limpar filtros</button> : canEdit && !preview ? <Link className="adminButton primary" href="/admin/artists/new">Cadastrar primeiro artista</Link> : null}</div>}
    </section>
    <section className={styles.featuredCard}><div><h2>Artistas em destaque na Home</h2><p>Os destaques usam o destino editorial <code>home_artists</code>; atualmente {featured} artista{featured === 1 ? "" : "s"} ocupa{featured === 1 ? "" : "m"} posições na Home.</p></div>{canEdit && !preview ? <Link className="adminButton" href="/admin/home">Ver no gerenciador da Home</Link> : null}</section>
  </div>;
}
