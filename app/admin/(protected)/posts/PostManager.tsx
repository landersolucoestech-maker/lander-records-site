"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdminIcon } from "../../components/AdminIcon";
import styles from "./NewsManager.module.css";

export type PostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: "draft" | "published" | "archived" | "unpublished";
  category: string;
  authorName: string;
  publishedAt: string;
  coverImage: string;
  featuredOnHome: boolean;
  tags: string[];
  isPubliclyVisible: boolean;
  updatedAt: string;
};

type Filters = { category?: string; q?: string; status?: string; tag?: string };

function StatusBadge({ status }: { status: PostSummary["status"] }) {
  const label = status === "published" ? "Publicado" : status === "archived" ? "Arquivado" : status === "unpublished" ? "Não publicado" : "Rascunho";
  return <span className={status === "published" ? "adminBadge live" : status === "archived" ? "adminBadge archived" : "adminBadge draft"}><i aria-hidden="true" />{label}</span>;
}

export default function PostManager({ availableCategories, availableTags, canEdit = true, deleted, initialFilters = {}, posts, preview = false }: { availableCategories?: string[]; availableTags?: string[]; canEdit?: boolean; deleted?: boolean; initialFilters?: Filters; metrics?: { archived: number; drafts: number; published: number; total: number }; posts: PostSummary[]; preview?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialFilters.q || "");
  const [status, setStatus] = useState(initialFilters.status || "all");
  const [category, setCategory] = useState(initialFilters.category || "all");
  const [tag, setTag] = useState(initialFilters.tag || "all");
  const categories = useMemo(() => availableCategories || Array.from(new Set(posts.map((post) => post.category))).sort((a, b) => a.localeCompare(b, "pt-BR")), [availableCategories, posts]);
  const tags = useMemo(() => availableTags || Array.from(new Set(posts.flatMap((post) => post.tags))).sort((a, b) => a.localeCompare(b, "pt-BR")), [availableTags, posts]);

  useEffect(() => {
    if (preview) return;
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (status !== "all") params.set("status", status);
    if (category !== "all") params.set("category", category);
    if (tag !== "all") params.set("tag", tag);
    const timer = window.setTimeout(() => router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false }), 180);
    return () => window.clearTimeout(timer);
  }, [category, pathname, preview, query, router, status, tag]);

  const filtered = useMemo(() => {
    if (!preview) return posts;
    const needle = query.trim().toLocaleLowerCase("pt-BR");
    return posts.filter((post) => (!needle || [post.title, post.slug, post.excerpt, post.authorName, post.category, ...post.tags].join(" ").toLocaleLowerCase("pt-BR").includes(needle)) && (status === "all" || post.status === status) && (category === "all" || post.category === category) && (tag === "all" || post.tags.includes(tag)));
  }, [category, posts, preview, query, status, tag]);

  const hasFilters = Boolean(query.trim() || status !== "all" || category !== "all" || tag !== "all");
  const clearFilters = () => { setQuery(""); setStatus("all"); setCategory("all"); setTag("all"); };

  return <div className={styles.manager} data-testid="news-manager">
    <nav aria-label="Visualização de conteúdo" className="adminTabs"><span className="active" aria-current="page"><AdminIcon name="posts" size={15}/>Publicações</span></nav>
    {deleted ? <div className="adminNotice">Publicação excluída com sucesso.</div> : null}
    {preview ? <div className="adminNotice">Os dados deste preview são isolados e não alteram a persistência do ambiente real.</div> : null}

    <section className={styles.catalog} aria-label="Publicações">
      <div className={`admin-toolbar ${styles.toolbar}`} role="search">
        <label className={styles.search}><span className="srOnly">Buscar publicações</span><AdminIcon name="search" size={16} /><input onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título, resumo ou autor..." type="search" value={query} /></label>
        <label><span className="srOnly">Status</span><select onChange={(event) => setStatus(event.target.value)} value={status}><option value="all">Todos os status</option><option value="published">Publicados</option><option value="draft">Rascunhos</option><option value="archived">Arquivados</option></select></label>
        <label><span className="srOnly">Categoria</span><select onChange={(event) => setCategory(event.target.value)} value={category}><option value="all">Todas as categorias</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="srOnly">Tag</span><select onChange={(event) => setTag(event.target.value)} value={tag}><option value="all">Todas as tags</option>{tags.map((item) => <option key={item}>{item}</option>)}</select></label>
        <span className={styles.count}>{filtered.length} de {posts.length} publicações</span>
        {hasFilters ? <button className={styles.clearButton} onClick={clearFilters} type="button">Limpar</button> : null}
      </div>

      {filtered.length ? <div className={`tableview-surface cms-tableview-surface ${styles.tableSurface}`} aria-label="Publicações cadastradas">
        <section className={`table-card ${styles.tableCard}`}>
          <div className={styles.scrollArea}><table>
            <thead><tr><th>Conteúdo</th><th>Categoria</th><th>Slug</th><th>Status</th><th>Autor</th><th>Atualização</th><th className={styles.actions}>Ações</th></tr></thead>
            <tbody>{filtered.map((post) => <tr data-testid="news-row" key={post.id}>
              <td><div className={`table-primary ${styles.identity}`}>{post.coverImage ? <Image alt="" height={42} src={post.coverImage} unoptimized width={42} /> : <span className={styles.coverFallback} aria-hidden="true"><AdminIcon name="posts" size={16} /></span>}<span><strong>{post.title}</strong><small>{post.excerpt || "Sem resumo"}</small></span></div></td>
              <td><span className={styles.category}>{post.category || "Sem categoria"}</span></td>
              <td><span className={styles.slug}>/{post.slug}</span></td>
              <td><StatusBadge status={post.status} /></td>
              <td><span className={styles.author}>{post.authorName || "—"}</span></td>
              <td><time className={styles.date}>{post.updatedAt}</time></td>
              <td className={styles.actions}><details><summary aria-label={`Ações de ${post.title}`}><AdminIcon name="more" size={17}/></summary><div className={styles.actionMenu}>{canEdit && !preview ? <Link href={`/admin/posts/${post.id}`}><AdminIcon name="edit" size={14}/>Editar</Link> : null}{post.isPubliclyVisible && !preview ? <Link href={`/noticias/${post.slug}`} target="_blank"><AdminIcon name="eye" size={14}/>Visualizar</Link> : null}<Link href={preview ? "/cms-preview/posts" : `/admin/posts/${post.id}/view`}><AdminIcon name="document" size={14}/>Consultar</Link></div></details></td>
            </tr>)}</tbody>
          </table></div>
          <footer className={styles.resultCount}><span>{filtered.length} registro{filtered.length === 1 ? "" : "s"}</span><span>Mostrando {filtered.length} de {posts.length}</span></footer>
        </section>
      </div> : <div className={`admin-empty ${styles.empty}`}><strong>{posts.length ? "Nenhuma publicação encontrada para os filtros selecionados." : "Nenhuma publicação cadastrada."}</strong>{hasFilters ? <button className="adminButton" onClick={clearFilters} type="button">Limpar filtros</button> : canEdit && !preview ? <Link className="adminButton primary" href="/admin/posts/new">Criar primeira publicação</Link> : null}</div>}
    </section>
  </div>;
}
