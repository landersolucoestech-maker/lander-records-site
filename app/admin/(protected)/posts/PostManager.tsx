"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { deletePostAction } from "../../post-actions";
import styles from "../artists/ArtistManager.module.css";

export type PostSummary = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
  category: string;
  authorName: string;
  publishedAt: string;
  coverImage: string;
  featuredOnHome: boolean;
  updatedAt: string;
};

function DeleteButton() {
  const { pending } = useFormStatus();
  return <button className={styles.dangerButton} type="submit" disabled={pending}>{pending ? "Excluindo..." : "Excluir notícia"}</button>;
}

function StatusBadge({ status }: { status: PostSummary["status"] }) {
  const label = status === "published" ? "Publicado" : status === "archived" ? "Arquivado" : "Rascunho";
  const className = status === "published" ? "adminBadge live" : status === "archived" ? "adminBadge archived" : "adminBadge draft";
  return <span className={className}>{label}</span>;
}

export default function PostManager({ posts, deleted }: { posts: PostSummary[]; deleted?: boolean }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PostSummary | null>(null);

  const categories = useMemo(() => Array.from(new Set(posts.map((post) => post.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [posts]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pt-BR");
    return posts.filter((post) => {
      const matchesQuery = !needle || [post.title, post.slug, post.category, post.authorName].join(" ").toLocaleLowerCase("pt-BR").includes(needle);
      const matchesStatus = status === "all" || post.status === status;
      const matchesCategory = category === "all" || post.category === category;
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [posts, query, status, category]);

  function actions(post: PostSummary) {
    return (
      <div className={styles.menuWrap}>
        <button className={styles.more} type="button" aria-label={`Ações de ${post.title}`} aria-expanded={menuId === post.id} onClick={() => setMenuId(menuId === post.id ? null : post.id)}>•••</button>
        {menuId === post.id ? (
          <div className={styles.menu}>
            <Link href={`/admin/posts/${post.id}/view`} onClick={() => setMenuId(null)}>Ver</Link>
            <Link href={`/admin/posts/${post.id}`} onClick={() => setMenuId(null)}>Editar</Link>
            <button className={styles.danger} type="button" onClick={() => { setMenuId(null); setDeleteTarget(post); }}>Excluir</button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      {deleted ? <div className={styles.success}>Notícia excluída com sucesso.</div> : null}
      <section className="adminPanel adminStack">
        <div className={styles.toolbar}>
          <input className={styles.search} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título, slug, categoria ou autor..." aria-label="Buscar notícias" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrar por status"><option value="all">Todos os status</option><option value="published">Publicado</option><option value="draft">Rascunho</option><option value="archived">Arquivado</option></select>
          <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filtrar por categoria"><option value="all">Todas as categorias</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <span className={styles.count}>{filtered.length} de {posts.length} notícias</span>
        </div>
      </section>

      {!filtered.length ? <div className={styles.empty}><strong>Nenhuma notícia encontrada.</strong>Ajuste os filtros ou crie uma nova publicação.</div> : (
        <div className={styles.list}>{filtered.map((post) => (
          <article className={styles.listCard} key={post.id}>
            {post.coverImage ? <Image className={styles.avatar} src={post.coverImage} alt="" width={96} height={96} unoptimized /> : <div className={styles.avatar}>NT</div>}
            <div>
              <div className={styles.statusLine}><strong>{post.title}</strong><StatusBadge status={post.status} /></div>
              <div className={styles.meta}>/noticias/{post.slug} · atualizado {post.updatedAt}</div>
              <div className={styles.chips}>{post.category ? <span className={styles.chip}>{post.category}</span> : null}<span className={styles.chip}>{post.authorName}</span></div>
            </div>
            <div className={styles.meta}><strong>Data</strong><br />{post.publishedAt || "Não definida"}</div>
            <div className={styles.chips}>{post.featuredOnHome ? <span className={`${styles.chip} ${styles.destination}`}>Home / Notícias</span> : <span className={styles.chip}>Fora da Home</span>}</div>
            {actions(post)}
          </article>
        ))}</div>
      )}

      {deleteTarget ? (
        <div className={styles.confirmBackdrop} role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setDeleteTarget(null); }}>
          <div className={styles.confirm} role="dialog" aria-modal="true" aria-labelledby="delete-post-title">
            <h2 id="delete-post-title">Excluir notícia</h2>
            <p>Tem certeza que deseja excluir <strong>{deleteTarget.title}</strong>? O conteúdo, links e metadados associados serão removidos.</p>
            <form action={deletePostAction}><input type="hidden" name="id" value={deleteTarget.id} /><div className={styles.confirmActions}><button className="adminButton" type="button" onClick={() => setDeleteTarget(null)}>Cancelar</button><DeleteButton /></div></form>
          </div>
        </div>
      ) : null}
    </>
  );
}
