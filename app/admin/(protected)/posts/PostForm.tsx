"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { savePostAction, type PostActionState } from "../../post-actions";
import { AdminIcon } from "../../components/AdminIcon";
import { AdminMediaPicker, type AdminMediaPickerItem } from "../../components/AdminMediaPicker";
import styles from "./PostForm.module.css";

type Option = { id: string; name: string };
type MediaOption = AdminMediaPickerItem;

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
  return <button className={styles.primaryButton} type="submit" disabled={pending}><AdminIcon name="check" size={15}/>{pending ? "Salvando..." : "Salvar alterações"}</button>;
}

export default function PostForm({ initial = {}, media, categories, tags }: { initial?: InitialPost; media: MediaOption[]; categories: Option[]; tags: Option[] }) {
  const [state, action] = useActionState<PostActionState, FormData>(savePostAction, { ok: false });
  const [title, setTitle] = useState(initial.title || "");
  const [slug, setSlug] = useState(initial.slug || "");
  const [excerpt, setExcerpt] = useState(initial.excerpt || "");
  const [content, setContent] = useState(initial.contentMarkdown || "");
  const [author, setAuthor] = useState(initial.authorName || "Lander Records");
  const [coverMediaId, setCoverMediaId] = useState(initial.coverMediaId || "");
  const [coverImage, setCoverImage] = useState(initial.coverImage || media.find((item) => item.id === initial.coverMediaId)?.url || "");
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const selected = (values: string[] | undefined, id: string) => Boolean(values?.includes(id));
  const previewParagraphs = content.split(/\n\s*\n/).map((value) => value.trim()).filter(Boolean).slice(0, 6);

  const chooseCover = (item: MediaOption) => {
    setCoverMediaId(item.id);
    setCoverImage(item.url);
    setCoverPickerOpen(false);
  };

  return <>
    <form action={action} className={styles.form} encType="multipart/form-data">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <input type="hidden" name="coverMediaId" value={coverMediaId}/>
      {state.error ? <div className={styles.error} role="alert">{state.error}</div> : null}

      <div className={styles.editorTop}><Link className={styles.outlineButton} href="/admin/posts"><span aria-hidden="true">←</span>Conteúdos</Link><div className={styles.editorActions}><Link className={styles.outlineButton} href="/admin/posts">Cancelar</Link><SaveButton/></div></div>

      <div className={styles.editorLayout}>
        <div className={styles.editorMain}>
          <section className={styles.card}>
            <header><div><h2>Publicação</h2><p>Identidade editorial, estado e URL do conteúdo.</p></div></header>
            <div className={styles.grid}>
              <label className={styles.span2}><span>Título</span><input name="title" required maxLength={240} value={title} onChange={(event) => setTitle(event.target.value)}/></label>
              <label><span>Status</span><select name="status" defaultValue={initial.status || "draft"}><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></label>
              <label><span>Categoria</span><select name="categoryId" required defaultValue={initial.categoryId || ""}><option value="">Selecione</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label><span>Data</span><input name="publishedAt" type="datetime-local" defaultValue={localDateTime(initial.publishedAt)}/></label>
              <label><span>Slug</span><input name="slug" maxLength={260} value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="gerado pelo título se vazio"/></label>
              <label className={styles.span2}><span>Link da publicação</span><input name="publicationLink" defaultValue={initial.publicationLink || ""} placeholder="/noticias/slug-da-publicacao"/><small>Identifica a URL pública correspondente à notícia.</small></label>
              <label className={styles.span2}><span>Resumo</span><textarea name="excerpt" rows={4} value={excerpt} onChange={(event) => setExcerpt(event.target.value)} placeholder="Resumo/linha fina exibida em listagens e metadados."/></label>
            </div>
          </section>

          <section className={styles.card}>
            <header><div><h2>Texto</h2><p>Conteúdo completo da publicação. A persistência em Markdown continua sendo a fonte de verdade.</p></div></header>
            <div className={styles.grid}><label className={styles.span2}><span>Corpo do conteúdo</span><textarea className={styles.contentArea} name="contentMarkdown" required value={content} onChange={(event) => setContent(event.target.value)} placeholder="Escreva o conteúdo aqui..."/></label></div>
          </section>

          <section className={styles.card}>
            <header><div><h2>Autoria e organização</h2><p>Autor, destaque e taxonomias da publicação.</p></div></header>
            <div className={styles.grid}>
              <label><span>Autor</span><input name="authorName" required value={author} onChange={(event) => setAuthor(event.target.value)}/></label>
              <label><span>Ordem na Home</span><input name="homePosition" type="number" defaultValue={initial.homePosition || 0}/></label>
              <label className={`${styles.checkbox} ${styles.span2}`}><input type="checkbox" name="featuredOnHome" defaultChecked={initial.featuredOnHome ?? true}/><span>Exibir na seção de Notícias da Home</span></label>
            </div>
            {tags.length ? <div className={styles.choices}>{tags.map((tag) => <label key={tag.id}><input type="checkbox" name="tagIds" value={tag.id} defaultChecked={selected(initial.tagIds, tag.id)}/><span>{tag.name}</span></label>)}</div> : null}
          </section>

          <section className={styles.card}>
            <header><div><h2>Capa</h2><p>Use uma imagem da biblioteca ou envie um novo arquivo.</p></div><button className={styles.outlineButton} onClick={() => setCoverPickerOpen(true)} type="button"><AdminIcon name="media" size={15}/>Escolher da biblioteca</button></header>
            <div className={styles.grid}>
              {coverImage ? <div className={`${styles.coverCurrent} ${styles.span2}`}><Image alt="" height={675} src={coverImage} unoptimized width={1200}/><div><span>CAPA SELECIONADA</span><strong>{media.find((item) => item.id === coverMediaId)?.name || "Imagem atual"}</strong><small>{coverImage}</small><button className={styles.outlineButton} onClick={() => { setCoverMediaId(""); setCoverImage(""); }} type="button">Remover capa</button></div></div> : null}
              <label className={styles.span2}><span>Ou enviar nova imagem</span><input name="coverMediaUpload" type="file" accept="image/*"/><small>Se enviado, o novo arquivo substitui a seleção da biblioteca.</small></label>
            </div>
          </section>

          <section className={styles.card}>
            <header><div><h2>Autor</h2><p>Imagem editorial opcional do autor.</p></div></header>
            <div className={styles.grid}>
              <label><span>Imagem existente</span><select name="authorMediaId" defaultValue={initial.authorMediaId || ""}><option value="">Sem imagem</option>{media.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label><span>Ou enviar nova imagem</span><input name="authorMediaUpload" type="file" accept="image/*"/></label>
            </div>
          </section>

          <section className={styles.card}>
            <header><div><h2>Links da publicação</h2><p>Links sociais relacionados à notícia.</p></div></header>
            <div className={styles.grid}><label><span>Facebook</span><input name="link_facebook" type="url" defaultValue={initial.links?.facebook || ""}/></label><label><span>Instagram</span><input name="link_instagram" type="url" defaultValue={initial.links?.instagram || ""}/></label><label><span>YouTube</span><input name="link_youtube" type="url" defaultValue={initial.links?.youtube || ""}/></label><label><span>TikTok</span><input name="link_tiktok" type="url" defaultValue={initial.links?.tiktok || ""}/></label></div>
          </section>

          <section className={styles.card}>
            <header><div><h2>SEO</h2><p>Metadados da página individual.</p></div></header>
            <div className={styles.grid}><label><span>Meta title</span><input name="seoTitle" maxLength={180} defaultValue={initial.seoTitle || ""}/></label><label><span>Canonical</span><input name="canonicalUrl" type="url" defaultValue={initial.canonicalUrl || ""}/></label><label className={styles.span2}><span>Meta description</span><textarea rows={3} name="seoDescription" defaultValue={initial.seoDescription || ""}/></label></div>
          </section>
        </div>

        <aside className={styles.previewPanel} aria-label="Preview do conteúdo"><div className={styles.previewSticky}><header><span>PREVIEW DO CONTEÚDO</span><h2>{title || "Conteúdo sem título"}</h2><p>/noticias/{slug || "slug"}</p></header>{coverImage ? <div className={styles.previewCover}><Image alt="" height={675} src={coverImage} unoptimized width={1200}/></div> : null}<article className={styles.previewCopy}><p className={styles.previewSummary}>{excerpt || "O resumo aparecerá aqui."}</p>{previewParagraphs.length ? previewParagraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 16)}`}>{paragraph}</p>) : <p>O conteúdo da publicação aparecerá aqui.</p>}<footer>{author}</footer></article></div></aside>
      </div>
    </form>
    <AdminMediaPicker items={media} onClose={() => setCoverPickerOpen(false)} onSelect={chooseCover} open={coverPickerOpen} selectedId={coverMediaId} title="Escolher capa da publicação"/>
  </>;
}
