import Link from "next/link";
import { notFound } from "next/navigation";
import { loadArtistEditor, loadArtistOptions } from "../../editor-data";
import styles from "../../ArtistView.module.css";

export const dynamic = "force-dynamic";

const metricLabels: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  soundcloud: "SoundCloud",
  spotify: "Spotify",
};

export default async function ArtistViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [artist, options] = await Promise.all([loadArtistEditor(id), loadArtistOptions()]);
  if (!artist) notFound();

  const roles = options.roles.filter((item) => artist.roleIds?.includes(item.id)).map((item) => item.name);
  const genres = options.genres.filter((item) => artist.genreIds?.includes(item.id)).map((item) => item.name);
  const categories = options.categories.filter((item) => artist.categoryIds?.includes(item.id)).map((item) => item.name);
  const destinations = options.destinations.filter((item) => artist.destinationIds?.includes(item.id));
  const statusLabel = artist.status === "published" ? "Publicado" : artist.status === "inactive" ? "Inativo" : "Rascunho";
  const statusClass = artist.status === "published" ? "adminBadge live" : artist.status === "inactive" ? "adminBadge archived" : "adminBadge draft";

  return (
    <div className="adminPage">
      <header className="adminPageHeader">
        <div><p className="adminEyebrow">CONSULTA DO ARTISTA</p><h1>{artist.name}</h1><p>Visão consolidada das informações principais, métricas, plataformas, conteúdo público e publicação.</p></div>
        <div className="adminActions"><Link className="adminButton primary" href={`/admin/artists/${id}`}>Editar artista</Link><Link className="adminButton" href="/admin/artists">Voltar</Link></div>
      </header>

      <section className={styles.hero}>
        {artist.cardImage ? <img className={styles.portrait} src={artist.cardImage} alt={`Imagem principal de ${artist.name}`} /> : <div className={styles.portrait}>{artist.name.slice(0, 2).toUpperCase()}</div>}
        <div>
          <span className={statusClass}>{statusLabel}</span>
          <h1>{artist.name}</h1>
          <p>{artist.shortBio || "Sem resumo curto cadastrado."}</p>
          <div className={styles.chips}>{[...roles, ...genres, ...categories].map((item) => <span className={styles.chip} key={item}>{item}</span>)}</div>
        </div>
      </section>

      <div className={styles.grid}>
        <section className={styles.card}><h2>Informações principais</h2><div className={styles.row}><span>Slug</span><strong>{artist.slug}</strong></div><div className={styles.row}><span>Page Link</span><strong>{artist.pageLink || `/artistas/${artist.slug}`}</strong></div><div className={styles.row}><span>Funções</span><strong>{roles.join(" · ") || "Não informado"}</strong></div><div className={styles.row}><span>Gêneros</span><strong>{genres.join(" · ") || "Não informado"}</strong></div><div className={styles.row}><span>Categorias</span><strong>{categories.join(" · ") || "Não informado"}</strong></div></section>
        <section className={styles.card}><h2>Configurações de publicação</h2><div className={styles.publication}>{destinations.length ? destinations.map((destination) => <div className={styles.publicationItem} key={destination.id}><span>{destination.name}</span><strong>Ativo</strong></div>) : <p className={styles.empty}>Nenhum destino de publicação selecionado.</p>}</div></section>
      </div>

      <section className={styles.card}><h2>Métricas das plataformas</h2><div className={styles.metricGrid}>{Object.keys(metricLabels).map((platform) => <div className={styles.metric} key={platform}><span>{metricLabels[platform]}</span><strong>{(artist.metrics?.[platform] || 0).toLocaleString("pt-BR")}</strong></div>)}</div></section>

      <div className={styles.grid}>
        <section className={styles.card}><h2>Redes sociais e plataformas</h2>{Object.entries(artist.links || {}).length ? Object.entries(artist.links || {}).map(([platform, url]) => <div className={styles.row} key={platform}><span>{platform}</span><a href={url} target="_blank" rel="noreferrer">Abrir ↗</a></div>) : <p className={styles.empty}>Nenhum link cadastrado.</p>}</section>
        <section className={styles.card}><h2>Conteúdo comercial</h2><div className={styles.row}><span>Título</span><strong>{artist.hireTitle || "Contrate"}</strong></div><div className={styles.row}><span>Botão</span><strong>{artist.hireButtonLabel || "Quero contratar"}</strong></div><div className={styles.row}><span>Texto</span><strong>{artist.hireText || "Não informado"}</strong></div></section>
      </div>

      <section className={styles.card}><h2>Biografia</h2><div className={styles.bio}>{artist.biography || "Biografia não cadastrada."}</div></section>

      <div className={styles.grid}>
        <section className={styles.card}><h2>Imagem principal</h2>{artist.cardImage ? <img className={styles.banner} src={artist.cardImage} alt={`Imagem principal de ${artist.name}`} /> : <p className={styles.empty}>Imagem principal não cadastrada.</p>}</section>
        <section className={styles.card}><h2>Imagem Banner / Hero</h2>{artist.heroImage ? <img className={styles.banner} src={artist.heroImage} alt={`Banner de ${artist.name}`} /> : <p className={styles.empty}>Imagem Banner não cadastrada.</p>}</section>
      </div>

      <div className={styles.grid}>
        <section className={styles.card}><h2>Vídeo YouTube</h2>{artist.youtubeVideo ? <a href={artist.youtubeVideo} target="_blank" rel="noreferrer">Abrir vídeo ↗</a> : <p className={styles.empty}>Vídeo não cadastrado.</p>}</section>
        <section className={styles.card}><h2>Spotify Embed</h2>{artist.spotifyEmbed ? <a href={artist.spotifyEmbed} target="_blank" rel="noreferrer">Abrir Spotify ↗</a> : <p className={styles.empty}>Embed não cadastrado.</p>}</section>
      </div>
    </div>
  );
}
