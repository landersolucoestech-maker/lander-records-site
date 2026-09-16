"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveArtistAction, type ArtistActionState } from "../../artist-actions";
import { AdminIcon } from "../../components/AdminIcon";
import { AdminMediaPicker, type AdminMediaPickerItem } from "../../components/AdminMediaPicker";
import styles from "./ArtistForm.module.css";

type Option = { id: string; name: string };
type MediaOption = AdminMediaPickerItem;

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
  return <button className={styles.primaryButton} type="submit" disabled={pending}><AdminIcon name="check" size={15}/>{pending ? "Salvando..." : "Salvar alterações"}</button>;
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
  const [name, setName] = useState(initial.name || "");
  const [slug, setSlug] = useState(initial.slug || "");
  const [status, setStatus] = useState(initial.status || "draft");
  const [shortBio, setShortBio] = useState(initial.shortBio || "");
  const [biography, setBiography] = useState(initial.biography || "");
  const [hireTitle, setHireTitle] = useState(initial.hireTitle || "Contrate");
  const [hireText, setHireText] = useState(initial.hireText || "");
  const [hireButtonLabel, setHireButtonLabel] = useState(initial.hireButtonLabel || "Quero contratar");
  const [cardMediaId, setCardMediaId] = useState(initial.cardMediaId || "");
  const [cardImage, setCardImage] = useState(initial.cardImage || media.find((item) => item.id === initial.cardMediaId)?.url || "");
  const [heroMediaId, setHeroMediaId] = useState(initial.heroMediaId || "");
  const [heroImage, setHeroImage] = useState(initial.heroImage || media.find((item) => item.id === initial.heroMediaId)?.url || "");
  const [mediaTarget, setMediaTarget] = useState<"card" | "hero" | null>(null);
  const selected = (values: string[] | undefined, id: string) => Boolean(values?.includes(id));
  const previewImage = heroImage || cardImage;
  const previewSlug = slug.trim() || name.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "artista";

  const chooseMedia = (item: MediaOption) => {
    if (mediaTarget === "card") { setCardMediaId(item.id); setCardImage(item.url); }
    if (mediaTarget === "hero") { setHeroMediaId(item.id); setHeroImage(item.url); }
    setMediaTarget(null);
  };

  return <>
    <form action={action} className={styles.form} encType="multipart/form-data">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <input type="hidden" name="cardMediaId" value={cardMediaId}/>
      <input type="hidden" name="heroMediaId" value={heroMediaId}/>
      {state.error ? <div className={styles.error} role="alert">{state.error}</div> : null}

      <div className={styles.editorTop}>
        <Link className={styles.outlineButton} href="/admin/artists"><span aria-hidden="true">←</span> Artistas</Link>
        <div className={styles.editorActions}><Link className={styles.outlineButton} href="/admin/artists">Cancelar</Link><SaveButton/></div>
      </div>

      <div className={styles.editorLayout}>
        <div className={styles.editorMain}>
          <section className={styles.card}>
            <header><div><span className={styles.kicker}>ARTISTA</span><h2>Identidade</h2><p>Informações principais usadas no CMS e na página pública.</p></div></header>
            <div className={styles.grid}>
              <label><span>Nome do artista</span><input name="name" required maxLength={180} value={name} onChange={(event) => setName(event.target.value)} /></label>
              <label><span>Slug</span><input name="slug" maxLength={200} value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="gerado pelo nome se vazio"/><small>Define a rota pública /artistas/slug.</small></label>
              <label><span>Status</span><select name="status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="published">Publicado</option><option value="draft">Rascunho</option><option value="inactive">Inativo</option></select></label>
              <label className={styles.span2}><span>Resumo curto</span><textarea name="shortBio" rows={4} value={shortBio} onChange={(event) => setShortBio(event.target.value)} /></label>
              <label className={styles.span2}><span>Biografia</span><textarea className={styles.longText} name="biography" value={biography} onChange={(event) => setBiography(event.target.value)} /></label>
            </div>
          </section>

          <section className={styles.card}>
            <header><div><h2>Imagem principal</h2><p>Thumbnail usada em cards, listagens e outras áreas do site.</p></div><button className={styles.outlineButton} onClick={() => setMediaTarget("card")} type="button"><AdminIcon name="media" size={15}/>Escolher da biblioteca</button></header>
            <div className={styles.grid}>
              {cardImage ? <div className={`${styles.mediaCurrent} ${styles.span2}`}><Image alt="" height={800} src={cardImage} unoptimized width={800}/><div><span>IMAGEM PRINCIPAL</span><strong>{media.find((item) => item.id === cardMediaId)?.name || "Imagem atual"}</strong><small>{cardImage}</small><button className={styles.outlineButton} onClick={() => { setCardMediaId(""); setCardImage(""); }} type="button">Remover imagem</button></div></div> : <button className={`${styles.emptyMedia} ${styles.span2}`} onClick={() => setMediaTarget("card")} type="button"><AdminIcon name="image" size={24}/><strong>Selecionar imagem principal</strong><span>Abrir biblioteca de mídia</span></button>}
              <label className={styles.span2}><span>Ou enviar nova imagem</span><input name="cardMediaUpload" type="file" accept="image/*"/><small>Se enviado, o arquivo substitui a seleção da biblioteca.</small></label>
            </div>
          </section>

          <section className={styles.card}>
            <header><div><h2>Classificação</h2><p>Funções, gêneros e categorias permanecem vinculados às taxonomias reais do projeto.</p></div></header>
            <div className={styles.choiceSections}>
              <div><strong>Funções</strong><div className={styles.choices}>{roles.map((role) => <label key={role.id}><input type="checkbox" name="roleIds" value={role.id} defaultChecked={selected(initial.roleIds, role.id)}/><span>{role.name}</span></label>)}</div></div>
              <div><strong>Gêneros musicais</strong><div className={styles.choices}>{genres.map((genre) => <label key={genre.id}><input type="checkbox" name="genreIds" value={genre.id} defaultChecked={selected(initial.genreIds, genre.id)}/><span>{genre.name}</span></label>)}</div></div>
              <div><strong>Categorias</strong><div className={styles.choices}>{categories.map((category) => <label key={category.id}><input type="checkbox" name="categoryIds" value={category.id} defaultChecked={selected(initial.categoryIds, category.id)}/><span>{category.name}</span></label>)}</div></div>
            </div>
          </section>

          <section className={styles.card}>
            <header><div><h2>Métricas das plataformas</h2><p>Somente leitura. A sincronização real continua sendo feita pelo Soundcharts.</p></div><span className={styles.statusPill}><i/>AUTOMÁTICO</span></header>
            <div className={styles.metricGrid}>
              <label><span>Instagram · seguidores</span><input readOnly aria-readonly="true" value={metricValue(initial.metrics?.instagram)} /></label>
              <label><span>YouTube · inscritos</span><input readOnly aria-readonly="true" value={metricValue(initial.metrics?.youtube)} /></label>
              <label><span>TikTok · seguidores</span><input readOnly aria-readonly="true" value={metricValue(initial.metrics?.tiktok)} /></label>
              <label><span>SoundCloud · seguidores</span><input readOnly aria-readonly="true" value={metricValue(initial.metrics?.soundcloud)} /></label>
              <label><span>Spotify · ouvintes mensais</span><input readOnly aria-readonly="true" value={metricValue(initial.metrics?.spotify)} /></label>
            </div>
          </section>

          <section className={styles.card}>
            <header><div><h2>Redes sociais e plataformas</h2><p>URLs oficiais usadas nos links públicos e no matching determinístico com o Soundcharts.</p></div></header>
            <div className={styles.grid}>
              <label><span>Facebook</span><input name="link_facebook" type="url" defaultValue={initial.links?.facebook || ""} placeholder="https://facebook.com/..." /></label>
              <label><span>Instagram</span><input name="link_instagram" type="url" defaultValue={initial.links?.instagram || ""} placeholder="https://instagram.com/..." /></label>
              <label><span>Spotify</span><input name="link_spotify" type="url" defaultValue={initial.links?.spotify || ""} placeholder="https://open.spotify.com/artist/..." /></label>
              <label><span>YouTube</span><input name="link_youtube" type="url" defaultValue={initial.links?.youtube || ""} placeholder="https://youtube.com/..." /></label>
              <label><span>TikTok</span><input name="link_tiktok" type="url" defaultValue={initial.links?.tiktok || ""} placeholder="https://tiktok.com/@..." /></label>
              <label><span>SoundCloud</span><input name="link_soundcloud" type="url" defaultValue={initial.links?.soundcloud || ""} placeholder="https://soundcloud.com/..." /></label>
            </div>
          </section>

          <section className={styles.card}>
            <header><div><h2>Página pública do artista</h2><p>URL pública e chamada comercial de contratação.</p></div></header>
            <div className={styles.grid}>
              <label className={styles.span2}><span>Page Link</span><input name="pageLink" defaultValue={initial.pageLink || ""} placeholder="/artistas/nome-do-artista" /></label>
              <label><span>Texto “Contrate”</span><input name="hireTitle" value={hireTitle} onChange={(event) => setHireTitle(event.target.value)} /></label>
              <label><span>Botão contratar</span><input name="hireButtonLabel" value={hireButtonLabel} onChange={(event) => setHireButtonLabel(event.target.value)} /></label>
              <label className={styles.span2}><span>Texto de contratação</span><textarea name="hireText" rows={4} value={hireText} onChange={(event) => setHireText(event.target.value)} /></label>
            </div>
          </section>

          <section className={styles.card}>
            <header><div><h2>Mídia da página do artista</h2><p>Banner do Hero, vídeo principal, Spotify e imagem social.</p></div><button className={styles.outlineButton} onClick={() => setMediaTarget("hero")} type="button"><AdminIcon name="media" size={15}/>Escolher banner</button></header>
            <div className={styles.grid}>
              {heroImage ? <div className={`${styles.heroCurrent} ${styles.span2}`}><Image alt="" height={675} src={heroImage} unoptimized width={1200}/><div><span>BANNER DO HERO</span><strong>{media.find((item) => item.id === heroMediaId)?.name || "Banner atual"}</strong><small>{heroImage}</small><button className={styles.outlineButton} onClick={() => { setHeroMediaId(""); setHeroImage(""); }} type="button">Remover banner</button></div></div> : <button className={`${styles.emptyMedia} ${styles.span2}`} onClick={() => setMediaTarget("hero")} type="button"><AdminIcon name="image" size={24}/><strong>Selecionar banner do Hero</strong><span>Abrir biblioteca de mídia</span></button>}
              <label className={styles.span2}><span>Ou enviar novo banner</span><input name="heroMediaUpload" type="file" accept="image/*"/><small>Imagem horizontal usada no Hero da página individual.</small></label>
              <label><span>Vídeo YouTube</span><input name="youtubeVideo" type="url" defaultValue={initial.youtubeVideo || ""} placeholder="https://youtube.com/watch?v=..." /></label>
              <label><span>Embed Spotify</span><input name="spotifyEmbed" defaultValue={initial.spotifyEmbed || ""} placeholder="URL do embed Spotify" /></label>
              <label><span>Imagem social / OG</span><select name="ogMediaId" defaultValue={initial.ogMediaId || ""}><option value="">Usar banner/imagem principal</option>{media.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            </div>
          </section>

          <section className={styles.card}>
            <header><div><h2>Destinos de publicação</h2><p>Controle real de onde o artista aparece no projeto atual.</p></div></header>
            <div className={styles.choiceSections}><div><div className={styles.choices}>{destinations.map((destination) => <label key={destination.id}><input type="checkbox" name="destinationIds" value={destination.id} defaultChecked={selected(initial.destinationIds, destination.id)}/><span><strong>{destination.name}</strong><small>{destination.description}</small></span></label>)}</div></div></div>
            <div className={styles.grid}><label><span>Ordem na Home</span><input name="homePosition" type="number" defaultValue={initial.homePosition || 0} /></label><label><span>Ordem em /artistas</span><input name="listPosition" type="number" defaultValue={initial.listPosition || 0} /></label></div>
          </section>

          <section className={styles.card}>
            <header><div><h2>SEO</h2><p>Metadados da página individual do artista.</p></div></header>
            <div className={styles.grid}><label><span>Título SEO</span><input name="seoTitle" maxLength={180} defaultValue={initial.seoTitle || ""} /></label><label><span>Canonical</span><input name="canonicalUrl" type="url" defaultValue={initial.canonicalUrl || ""} /></label><label className={styles.span2}><span>Meta description</span><textarea rows={3} name="seoDescription" defaultValue={initial.seoDescription || ""} /></label></div>
          </section>
        </div>

        <aside className={styles.previewPanel} aria-label="Preview do artista">
          <div className={styles.previewSticky}>
            <header><span>PREVIEW DO ARTISTA</span><h2>{name || "Artista sem nome"}</h2><p>/artistas/{previewSlug}</p></header>
            <div className={styles.previewHero}>{previewImage ? <Image alt="" fill sizes="480px" src={previewImage} unoptimized /> : <div className={styles.previewPlaceholder}><AdminIcon name="artists" size={32}/></div>}<div className={styles.previewOverlay}/><div className={styles.previewHeroCopy}><span>LANDER RECORDS</span><h3>{name || "Nome do artista"}</h3><p>{shortBio || "O resumo curto do artista aparecerá aqui."}</p></div></div>
            <div className={styles.previewBody}><span className={`${styles.previewStatus} ${styles[status]}`}>{status === "published" ? "Publicado" : status === "inactive" ? "Inativo" : "Rascunho"}</span><h4>Sobre</h4><p>{biography || "A biografia completa aparecerá nesta área do preview."}</p><div className={styles.previewCta}><strong>{hireTitle || "Contrate"}</strong><p>{hireText || "Texto comercial de contratação."}</p><span>{hireButtonLabel || "Quero contratar"}</span></div></div>
          </div>
        </aside>
      </div>
    </form>

    <AdminMediaPicker items={media} onClose={() => setMediaTarget(null)} onSelect={chooseMedia} open={mediaTarget !== null} selectedId={mediaTarget === "card" ? cardMediaId : heroMediaId} title={mediaTarget === "hero" ? "Selecionar banner do artista" : "Selecionar imagem principal do artista"}/>
  </>;
}
