"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { savePostAction, type PostActionState } from "../../post-actions";
import styles from "../artists/ArtistForm.module.css";

type Option = { id: string; name: string };
type MediaOption = { id: string; name: string; url: string };

type InitialPost = {
  id?: string;
  title?: string;
  slug?: string;
  status?: "draft" | "published" | "archived";
  categoryId?: string;
  publishedAt?: string;
  authorName?: string;
  excerpt?: string;
  contentMarkdown?: string;
  coverMediaId?: string;
  coverImage?: string;
  authorMediaId?: string;
  authorImage?: string;
  publicationLink?: string;
  links?: Record<string, string>;
  featuredOnHome?: boolean;
  homePosition?: number;
  tagIds?: string[];
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
};

function localDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 16);
}

function SaveButton() {
  const { pending } = useFormStatus();
  return <button className="adminButton primary" type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar notícia"}</button>;
}

export default function PostForm({
  initial = {},
  media,
  categories,
  tags,
}: {
  initial?: InitialPost;
  media: MediaOption[];
  categories: Option[];
  tags: Option[];
}) {
  const [state, action] = useActionState<PostActionState, FormData>(savePostAction, { ok: false });
  const selected = (values: string[] | undefined, id: string) => Boolean(values?.includes(id));

  return (
    <form action={action} className={styles.form} encType="multipart/form-data">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      {state.error ? <div className={styles.error} role="alert">{state.error}</div> : null}

      <section className={styles.section}>
        <div className={styles.sectionHeader}><div><h2>Publicação</h2><p>Identificação e estado editorial da notícia.</p></div></div>
        <div className={styles.grid}>
          <label className={`${styles.field} ${styles.full}`}>Título<input name="title" required maxLength={240} defaultValue={initial.title || ""} /></label>
          <label className={styles.field}>Status<select name="status" defaultValue={initial.status || "draft"}><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></label>
          <label className={styles.field}>Categoria<select name="categoryId" required defaultValue={initial.categoryId || ""}><option value="">Selecione</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className={styles.field}>Data<input name="publishedAt" type="datetime-local" defaultValue={localDateTime(initial.publishedAt)} /></label>
          <label className={styles.field}>Slug<input name="slug" maxLength={260} defaultValue={initial.slug || ""} placeholder="gerado pelo título se vazio" /></label>
          <label className={`${styles.field} ${styles.full}`}>Link da publicação<input name="publicationLink" defaultValue={initial.publicationLink || ""} placeholder="/noticias/slug-da-publicacao" /><span className={styles.hint}>Identifica a URL pública correspondente à notícia.</span></label>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}><div><h2>Imagem principal</h2><p>Esta única imagem alimenta automaticamente a seção de Notícias da Home, a página geral de Notícias e o banner da notícia individual.</p></div><Link className="adminButton" href="/admin/media">Abrir biblioteca de mídia</Link></div>
        <div className={styles.mediaPicker}>
          <div className={styles.mediaPreview}>{initial.coverImage ? <img src={initial.coverImage} alt="" /> : <div className={styles.mediaPlaceholder}>Sem imagem<br />principal</div>}<label className={styles.field} style={{ flex: 1 }}>Selecionar existente<select name="coverMediaId" defaultValue={initial.coverMediaId || ""}><option value="">Sem imagem</option>{media.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
          <label className={styles.field}>Ou enviar nova imagem<input name="coverMediaUpload" type="file" accept="image/*" /><span className={styles.hint}>Se enviado, o novo arquivo substitui a seleção acima.</span></label>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}><div><h2>Autor</h2><p>Identificação editorial exibida na publicação.</p></div></div>
        <div className={styles.grid}>
          <label className={styles.field}>Autor<input name="authorName" required defaultValue={initial.authorName || "Lander Records"} /></label>
          <div className={styles.mediaPreview}>{initial.authorImage ? <img src={initial.authorImage} alt="" /> : <div className={styles.mediaPlaceholder}>Sem imagem<br />do autor</div>}<label className={styles.field} style={{ flex: 1 }}>Imagem do autor<select name="authorMediaId" defaultValue={initial.authorMediaId || ""}><option value="">Sem imagem</option>{media.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
          <label className={`${styles.field} ${styles.full}`}>Ou enviar nova imagem do autor<input name="authorMediaUpload" type="file" accept="image/*" /></label>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}><div><h2>Texto e conteúdo</h2><p>Texto curto para cards/listagens e conteúdo completo da matéria.</p></div></div>
        <div className={styles.grid}>
          <label className={`${styles.field} ${styles.full}`}>Texto<textarea name="excerpt" defaultValue={initial.excerpt || ""} placeholder="Resumo/linha fina exibida em listagens e metadados." /></label>
          <label className={`${styles.field} ${styles.full}`}>Conteúdo<textarea name="contentMarkdown" required defaultValue={initial.contentMarkdown || ""} style={{ minHeight: 380 }} placeholder="Conteúdo completo da notícia em Markdown." /></label>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}><div><h2>Links da publicação</h2><p>Links sociais relacionados à notícia.</p></div></div>
        <div className={styles.platformGrid}>
          <label className={styles.field}>Facebook<input name="link_facebook" type="url" defaultValue={initial.links?.facebook || ""} placeholder="https://facebook.com/..." /></label>
          <label className={styles.field}>Instagram<input name="link_instagram" type="url" defaultValue={initial.links?.instagram || ""} placeholder="https://instagram.com/..." /></label>
          <label className={styles.field}>YouTube<input name="link_youtube" type="url" defaultValue={initial.links?.youtube || ""} placeholder="https://youtube.com/..." /></label>
          <label className={styles.field}>TikTok<input name="link_tiktok" type="url" defaultValue={initial.links?.tiktok || ""} placeholder="https://tiktok.com/..." /></label>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}><div><h2>Organização</h2><p>Configurações editoriais já existentes, preservadas sem criar outro fluxo paralelo.</p></div></div>
        <div className={styles.grid}>
          <label className={styles.choice}><input type="checkbox" name="featuredOnHome" defaultChecked={initial.featuredOnHome ?? true} /> Exibir na seção de Notícias da Home</label>
          <label className={styles.field}>Ordem na Home<input name="homePosition" type="number" defaultValue={initial.homePosition || 0} /></label>
        </div>
        {tags.length ? <div className={styles.choiceGrid}>{tags.map((tag) => <label className={styles.choice} key={tag.id}><input type="checkbox" name="tagIds" value={tag.id} defaultChecked={selected(initial.tagIds, tag.id)} /> {tag.name}</label>)}</div> : null}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}><div><h2>SEO</h2><p>Metadados da página individual. A imagem social usa automaticamente a Imagem principal.</p></div></div>
        <div className={styles.grid}>
          <label className={styles.field}>Título SEO<input name="seoTitle" maxLength={180} defaultValue={initial.seoTitle || ""} /></label>
          <label className={styles.field}>Canonical<input name="canonicalUrl" type="url" defaultValue={initial.canonicalUrl || ""} /></label>
          <label className={`${styles.field} ${styles.full}`}>Meta description<textarea name="seoDescription" defaultValue={initial.seoDescription || ""} /></label>
        </div>
      </section>

      <div className={styles.footer}><Link className="adminButton" href="/admin/posts">Cancelar</Link><SaveButton /></div>
    </form>
  );
}
