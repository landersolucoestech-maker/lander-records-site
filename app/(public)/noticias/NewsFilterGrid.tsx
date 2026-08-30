"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Category = { id: string; name: string; slug: string };
type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string | null;
  coverImage: string;
  category: Category | null;
};

export function NewsFilterGrid({ posts, categories, showFilters = true, showList = true }: { posts: Post[]; categories: Category[]; showFilters?: boolean; showList?: boolean }) {
  const [active, setActive] = useState("all");
  const filtered = useMemo(
    () => active === "all" ? posts : posts.filter((post) => post.category?.slug === active),
    [active, posts],
  );

  return (
    <>
      {showFilters ? <div className="filterRow" role="group" aria-label="Filtrar notícias por categoria">
        <button type="button" className={active === "all" ? "active" : ""} aria-pressed={active === "all"} onClick={() => setActive("all")}>Todos</button>
        {categories.map((category) => (
          <button key={category.id} type="button" className={active === category.slug ? "active" : ""} aria-pressed={active === category.slug} onClick={() => setActive(category.slug)}>
            {category.name}
          </button>
        ))}
      </div> : null}

      {showList ? (filtered.length > 0 ? (
        <div className="newsGrid">
          {filtered.map((post, index) => (
            <Link className={`newsCard ${index === 0 ? "newsCardFeatured" : ""}`} href={`/noticias/${post.slug}`} key={post.id}>
              <div className="newsImage" style={post.coverImage ? { backgroundImage: `url(${post.coverImage})` } : undefined}>
                {post.category ? <span>{post.category.name}</span> : null}
              </div>
              <div className="newsCardBody">
                <p className="newsMeta">{post.category?.name || "Notícia"} · {post.publishedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(post.publishedAt)) : ""}</p>
                <h2>{post.title}</h2>
                <p>{post.excerpt}</p>
                <strong>Ler matéria →</strong>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="filterEmptyState">
          <strong>Nenhuma publicação nesta categoria ainda.</strong>
          <p>Novos conteúdos publicados aparecem aqui automaticamente.</p>
        </div>
      )) : null}
    </>
  );
}
