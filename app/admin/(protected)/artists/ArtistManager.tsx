"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteArtistAction } from "../../artist-actions";
import styles from "./ArtistManager.module.css";

export type ArtistSummary = {
  id: string;
  name: string;
  slug: string;
  status: "published" | "draft" | "inactive" | "archived";
  cardImage: string;
  roles: string[];
  genres: string[];
  categories: string[];
  destinations: string[];
  metrics: Record<string, number>;
  updatedAt: string;
};

function DeleteButton() {
  const { pending } = useFormStatus();
  return <button className={styles.dangerButton} type="submit" disabled={pending}>{pending ? "Excluindo..." : "Excluir artista"}</button>;
}

function StatusBadge({ status }: { status: ArtistSummary["status"] }) {
  const label = status === "published" ? "Publicado" : status === "draft" ? "Rascunho" : status === "inactive" ? "Inativo" : "Arquivado";
  const className = status === "published" ? "adminBadge live" : status === "draft" ? "adminBadge draft" : "adminBadge archived";
  return <span className={className}>{label}</span>;
}

export default function ArtistManager({ artists, deleted }: { artists: ArtistSummary[]; deleted?: boolean }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [view, setView] = useState<"table" | "list">("table");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ArtistSummary | null>(null);

  const categories = useMemo(() => Array.from(new Set(artists.flatMap((artist) => artist.categories))).sort((a, b) => a.localeCompare(b)), [artists]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pt-BR");
    return artists.filter((artist) => {
      const matchesQuery = !needle || [artist.name, artist.slug, ...artist.roles, ...artist.genres, ...artist.categories].join(" ").toLocaleLowerCase("pt-BR").includes(needle);
      const matchesStatus = status === "all" || artist.status === status;
      const matchesCategory = category === "all" || artist.categories.includes(category);
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [artists, query, status, category]);

  function actions(artist: ArtistSummary) {
    return (
      <div className={styles.menuWrap}>
        <button className={styles.more} type="button" aria-label={`Ações de ${artist.name}`} aria-expanded={menuId === artist.id} onClick={() => setMenuId(menuId === artist.id ? null : artist.id)}>•••</button>
        {menuId === artist.id ? (
          <div className={styles.menu}>
            <Link href={`/admin/artists/${artist.id}/view`} onClick={() => setMenuId(null)}>Visualizar</Link>
            <Link href={`/admin/artists/${artist.id}`} onClick={() => setMenuId(null)}>Editar</Link>
            <button className={styles.danger} type="button" onClick={() => { setMenuId(null); setDeleteTarget(artist); }}>Excluir</button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      {deleted ? <div className={styles.success}>Artista excluído com sucesso.</div> : null}
      <section className="adminPanel adminStack">
        <div className={styles.toolbar}>
          <input className={styles.search} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, slug, função, gênero ou categoria..." aria-label="Buscar artistas" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrar por status">
            <option value="all">Todos os status</option>
            <option value="published">Publicado</option>
            <option value="draft">Rascunho</option>
            <option value="inactive">Inativo</option>
            <option value="archived">Arquivado</option>
          </select>
          <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filtrar por categoria">
            <option value="all">Todas as categorias</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <div className={styles.viewToggle} aria-label="Modo de visualização">
            <button type="button" className={view === "table" ? styles.active : ""} onClick={() => setView("table")}>Table View</button>
            <button type="button" className={view === "list" ? styles.active : ""} onClick={() => setView("list")}>List View</button>
          </div>
          <span className={styles.count}>{filtered.length} de {artists.length} artistas</span>
        </div>
      </section>

      {!filtered.length ? (
        <div className={styles.empty}><strong>Nenhum artista encontrado.</strong>Ajuste os filtros ou cadastre um novo artista.</div>
      ) : view === "table" ? (
        <section className={`adminPanel ${styles.tableWrap}`}>
          <table className="adminTable">
            <thead><tr><th>Artista</th><th>Funções</th><th>Gêneros</th><th>Publicação</th><th>Status</th><th>Atualizado</th><th aria-label="Ações" /></tr></thead>
            <tbody>{filtered.map((artist) => (
              <tr key={artist.id}>
                <td><div className={styles.artistCell}>{artist.cardImage ? <img className={styles.avatar} src={artist.cardImage} alt="" /> : <div className={styles.avatar}>{artist.name.slice(0, 2).toUpperCase()}</div>}<div><strong>{artist.name}</strong><small>/artistas/{artist.slug}</small></div></div></td>
                <td><div className={styles.chips}>{artist.roles.length ? artist.roles.map((role) => <span className={styles.chip} key={role}>{role}</span>) : <span className={styles.chip}>Sem função</span>}</div></td>
                <td><div className={styles.chips}>{artist.genres.length ? artist.genres.map((genre) => <span className={styles.chip} key={genre}>{genre}</span>) : <span className={styles.chip}>Sem gênero</span>}</div></td>
                <td><div className={styles.chips}>{artist.destinations.length ? artist.destinations.map((destination) => <span className={`${styles.chip} ${styles.destination}`} key={destination}>{destination}</span>) : <span className={styles.chip}>Nenhum destino</span>}</div></td>
                <td><StatusBadge status={artist.status} /></td>
                <td>{artist.updatedAt}</td>
                <td>{actions(artist)}</td>
              </tr>
            ))}</tbody>
          </table>
        </section>
      ) : (
        <div className={styles.list}>{filtered.map((artist) => (
          <article className={styles.listCard} key={artist.id}>
            {artist.cardImage ? <img className={styles.avatar} src={artist.cardImage} alt="" /> : <div className={styles.avatar}>{artist.name.slice(0, 2).toUpperCase()}</div>}
            <div><div className={styles.statusLine}><strong>{artist.name}</strong><StatusBadge status={artist.status} /></div><div className={styles.meta}>/artistas/{artist.slug} · atualizado {artist.updatedAt}</div><div className={styles.chips}>{[...artist.roles, ...artist.genres].map((item) => <span className={styles.chip} key={item}>{item}</span>)}</div></div>
            <div className={styles.meta}><strong>Métricas</strong><br />Instagram {artist.metrics.instagram?.toLocaleString("pt-BR") || 0}<br />Spotify {artist.metrics.spotify?.toLocaleString("pt-BR") || 0}</div>
            <div className={styles.chips}>{artist.destinations.length ? artist.destinations.map((destination) => <span className={`${styles.chip} ${styles.destination}`} key={destination}>{destination}</span>) : <span className={styles.chip}>Sem destinos</span>}</div>
            {actions(artist)}
          </article>
        ))}</div>
      )}

      {deleteTarget ? (
        <div className={styles.confirmBackdrop} role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setDeleteTarget(null); }}>
          <div className={styles.confirm} role="dialog" aria-modal="true" aria-labelledby="delete-artist-title">
            <h2 id="delete-artist-title">Excluir artista</h2>
            <p>Tem certeza que deseja excluir <strong>{deleteTarget.name}</strong>? O registro, suas relações, métricas e configurações de publicação serão removidos.</p>
            <form action={deleteArtistAction}>
              <input type="hidden" name="id" value={deleteTarget.id} />
              <div className={styles.confirmActions}><button className="adminButton" type="button" onClick={() => setDeleteTarget(null)}>Cancelar</button><DeleteButton /></div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
