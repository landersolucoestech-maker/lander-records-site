"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveArtistAction, type ArtistActionState } from "../../artist-actions";
import styles from "./ArtistForm.module.css";

type Option = { id: string; name: string };
type MediaOption = { id: string; name: string; url: string };

type InitialArtist = {
  id?: string;
  name?: string;
  slug?: string;
  status?: "published" | "draft" | "inactive";
  shortBio?: string;
  biography?: string;
  cardMediaId?: string;
  heroMediaId?: string;
  ogMediaId?: string;
  cardImage?: string;
  heroImage?: string;
  categoryIds?: string[];
  roleIds?: string[];
  genreIds?: string[];
  destinationIds?: string[];
  metrics?: Record<string, number>;
  links?: Record<string, string>;
  pageLink?: string;
  hireTitle?: string;
  hireText?: string;
  hireButtonLabel?: string;
  youtubeVideo?: string;
  spotifyEmbed?: string;
  homePosition?: number;
  listPosition?: number;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
};

function SaveButton() {
  const { pending } = useFormStatus();
  return <button className="adminButton primary" type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar artista"}</button>;
}

function metricValue(value: number | undefined) {
  return typeof value === "number" && value > 0 ? value.toLocaleString("pt-BR") : "Aguardando sincronização";
}

export default function ArtistForm({ initial = {}, media, categories, roles, genres, destinations }: {
  initial?: InitialArtist;
  media: MediaOption[];
  categories: Option[];
  roles: Option[];
  genres: Option[];
  destinations: Array<Option & { description: string }>;
}) {
  const [state, action] = useActionState<ArtistActionState, FormData>(saveArtistAction, { ok: false });
  const selected = (values: string[] | undefined, id: string) => Boolean(values?.includes(id));

  return (
    <form action={action} className={styles.form} encType="multipart/form-data">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      {state.error ? <div className={styles.error} role="alert">{state.error}</div> : null}

      <section className={styles.section}>
        <div className={styles.sectionHeader}><div><h2>Identidade</h2><p>Informações principais usadas no CMS e na página pública.</p></div></div>
        <div className={styles.grid}>
          <label className={styles.field}>Nome do artista<input name="name" required maxLength={180} defaultValue={initial.name || ""} /></label>
          <label className={styles.field}>Slug<input name="slug" maxLength={200} defaultValue={initial.slug || ""} placeholder="gerado pelo nome se vazio" /><span className={styles.hint}>Define a rota pública /artistas/slug.</span></label>
          <label className={styles.field}>Status<select name="status" defaultValue={initial.status || "draft"}><option value="published">Publicado</option><option value="draft">Rascunho</option><option value="inactive">Inativo</option></select></label>
          <label className={`${styles.field} ${styles.full}`}>Resumo curto<textarea name="shortBio" defaultValue={initial.shortBio || ""} /></label>
          <label className={`${styles.field} ${styles.full}`}>Biografia<textarea name="biography" defaultValue={initial.biography || ""} /></label>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}><div><h2>Imagem principal</h2><p>Thumbnail/foto utilizada em cards, listagens e outras áreas do site.</p></div><Link className="adminButton" href="/admin/media">Abrir biblioteca de mídia</Link></div>
        <div className={styles.mediaPicker}>
          <div className={styles.mediaPreview}>{initial.cardImage ? <Image src={initial.cardImage} alt="" width={800} height={800} unoptimized /> : <div className={styles.mediaPlaceholder}>Sem imagem<br />principal</div>}<label className={styles.field} style={{ flex: 1 }}>Selecionar existente<select name="cardMediaId" defaultValue={initial.cardMediaId || ""}><option value="">Sem imagem</option>{media.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
          <label className={styles.field}>Ou enviar nova imagem<input name="cardMediaUpload" type="file" accept="image/*" /><span className={styles.hint}>Se enviado, o novo arquivo substitui a seleção acima.</span></label>
        </div>
      </section>

      <section className={styles.section}><div className={styles.sectionHeader}><div><h2>Funções</h2><p>Taxonomia extensível. Novas funções poderão ser adicionadas sem alterar o formulário.</p></div></div><div className={styles.choiceGrid}>{roles.map((role) => <label className={styles.choice} key={role.id}><input type="checkbox" name="roleIds" value={role.id} defaultChecked={selected(initial.roleIds, role.id)} /> {role.name}</label>)}</div></section>
      <section className={styles.section}><div className={styles.sectionHeader}><div><h2>Gênero musical</h2><p>Gêneros são dados administráveis, não valores fixos no componente.</p></div></div><div className={styles.choiceGrid}>{genres.map((genre) => <label className={styles.choice} key={genre.id}><input type="checkbox" name="genreIds" value={genre.id} defaultChecked={selected(initial.genreIds, genre.id)} /> {genre.name}</label>)}</div></section>
      <section className={styles.section}><div className={styles.sectionHeader}><div><h2>Categorias</h2><p>Classificação usada nos filtros e na navegação pública de artistas.</p></div></div><div className={styles.choiceGrid}>{categories.map((category) => <label className={styles.choice} key={category.id}><input type="checkbox" name="categoryIds" value={category.id} defaultChecked={selected(initial.categoryIds, category.id)} /> {category.name}</label>)}</div></section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}><div><h2>Métricas das plataformas</h2><p>Valores somente leitura, sincronizados pelo Soundcharts a partir dos links oficiais cadastrados abaixo. Não existe edição manual.</p></div></div>
        <div className={styles.metricGrid}>
          <label className={styles.field}>Instagram — seguidores<input readOnly aria-readonly="true" value={metricValue(initial.metrics?.instagram)} /></label>
          <label className={styles.field}>YouTube — inscritos<input readOnly aria-readonly="true" value={metricValue(initial.metrics?.youtube)} /></label>
          <label className={styles.field}>TikTok — seguidores<input readOnly aria-readonly="true" value={metricValue(initial.metrics?.tiktok)} /></label>
          <label className={styles.field}>SoundCloud — seguidores<input readOnly aria-readonly="true" value={metricValue(initial.metrics?.soundcloud)} /></label>
          <label className={styles.field}>Spotify — ouvintes mensais<input readOnly aria-readonly="true" value={metricValue(initial.metrics?.spotify)} /></label>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}><div><h2>Redes sociais / plataformas</h2><p>URLs oficiais utilizadas tanto nos links públicos quanto no matching determinístico com o Soundcharts.</p></div></div>
        <div className={styles.platformGrid}>
          <label className={styles.field}>Facebook<input name="link_facebook" type="url" defaultValue={initial.links?.facebook || ""} placeholder="https://facebook.com/..." /></label>
          <label className={styles.field}>Instagram<input name="link_instagram" type="url" defaultValue={initial.links?.instagram || ""} placeholder="https://instagram.com/..." /></label>
          <label className={styles.field}>Spotify<input name="link_spotify" type="url" defaultValue={initial.links?.spotify || ""} placeholder="https://open.spotify.com/artist/..." /></label>
          <label className={styles.field}>YouTube<input name="link_youtube" type="url" defaultValue={initial.links?.youtube || ""} placeholder="https://youtube.com/..." /></label>
          <label className={styles.field}>TikTok<input name="link_tiktok" type="url" defaultValue={initial.links?.tiktok || ""} placeholder="https://tiktok.com/@..." /></label>
          <label className={styles.field}>SoundCloud<input name="link_soundcloud" type="url" defaultValue={initial.links?.soundcloud || ""} placeholder="https://soundcloud.com/..." /></label>
        </div>
      </section>

      <section className={styles.section}><div className={styles.sectionHeader}><div><h2>Página pública do artista</h2><p>URL pública e chamada comercial de contratação.</p></div></div><div className={styles.grid}><label className={`${styles.field} ${styles.full}`}>Page Link<input name="pageLink" defaultValue={initial.pageLink || ""} placeholder="/artistas/nome-do-artista" /></label><label className={styles.field}>Texto “Contrate”<input name="hireTitle" defaultValue={initial.hireTitle || "Contrate"} /></label><label className={styles.field}>Botão contratar<input name="hireButtonLabel" defaultValue={initial.hireButtonLabel || "Quero contratar"} /></label><label className={`${styles.field} ${styles.full}`}>Texto de contratação<textarea name="hireText" defaultValue={initial.hireText || ""} /></label></div></section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}><div><h2>Mídia da página do artista</h2><p>Banner horizontal do Hero, vídeo principal e player do Spotify.</p></div><Link className="adminButton" href="/admin/media">Abrir biblioteca de mídia</Link></div>
        <div className={styles.mediaPicker}><div className={styles.mediaPreview}>{initial.heroImage ? <Image src={initial.heroImage} alt="" width={1200} height={675} unoptimized /> : <div className={styles.mediaPlaceholder}>Sem banner<br />Hero</div>}<label className={styles.field} style={{ flex: 1 }}>Imagem Banner<select name="heroMediaId" defaultValue={initial.heroMediaId || ""}><option value="">Sem banner</option>{media.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><label className={styles.field}>Ou enviar novo banner<input name="heroMediaUpload" type="file" accept="image/*" /><span className={styles.hint}>Imagem horizontal usada no Hero da página individual.</span></label></div>
        <div className={styles.grid}><label className={styles.field}>Vídeo YouTube<input name="youtubeVideo" type="url" defaultValue={initial.youtubeVideo || ""} placeholder="https://youtube.com/watch?v=..." /></label><label className={styles.field}>Embed Spotify<input name="spotifyEmbed" defaultValue={initial.spotifyEmbed || ""} placeholder="URL do embed Spotify" /></label><label className={styles.field}>Imagem social / OG<select name="ogMediaId" defaultValue={initial.ogMediaId || ""}><option value="">Usar banner/imagem principal</option>{media.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
      </section>

      <section className={styles.section}><div className={styles.sectionHeader}><div><h2>Destinos de publicação</h2><p>Controle independente de onde o artista aparece. Novos destinos podem ser adicionados depois.</p></div></div><div className={styles.choiceGrid}>{destinations.map((destination) => <label className={styles.choice} key={destination.id}><input type="checkbox" name="destinationIds" value={destination.id} defaultChecked={selected(initial.destinationIds, destination.id)} /><span>{destination.name}<span className={styles.hint} style={{ display: "block", marginTop: 3 }}>{destination.description}</span></span></label>)}</div><div className={styles.grid}><label className={styles.field}>Ordem na Home<input name="homePosition" type="number" defaultValue={initial.homePosition || 0} /></label><label className={styles.field}>Ordem em /artistas<input name="listPosition" type="number" defaultValue={initial.listPosition || 0} /></label></div></section>

      <section className={styles.section}><div className={styles.sectionHeader}><div><h2>SEO</h2><p>Metadados da página individual do artista.</p></div></div><div className={styles.grid}><label className={styles.field}>Título SEO<input name="seoTitle" maxLength={180} defaultValue={initial.seoTitle || ""} /></label><label className={styles.field}>Canonical<input name="canonicalUrl" type="url" defaultValue={initial.canonicalUrl || ""} /></label><label className={`${styles.field} ${styles.full}`}>Meta description<textarea name="seoDescription" defaultValue={initial.seoDescription || ""} /></label></div></section>

      <div className={styles.footer}><Link className="adminButton" href="/admin/artists">Cancelar</Link><SaveButton /></div>
    </form>
  );
}
