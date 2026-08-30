import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { mediaAssets, postCategories, posts } from "../../../../lib/db/schema";
import PostManager, { type PostSummary } from "./PostManager";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const rows = await getDb().select({ post: posts, categoryName: postCategories.name, coverImage: mediaAssets.url })
    .from(posts)
    .leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
    .leftJoin(mediaAssets, eq(posts.coverMediaId, mediaAssets.id))
    .orderBy(desc(posts.updatedAt), desc(posts.createdAt));

  const summary: PostSummary[] = rows.map(({ post, categoryName, coverImage }) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    category: categoryName || "Sem categoria",
    authorName: post.authorName,
    publishedAt: post.publishedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(post.publishedAt) : "",
    coverImage: coverImage || "",
    featuredOnHome: post.featuredOnHome,
    updatedAt: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(post.updatedAt),
  }));
  const { deleted } = await searchParams;

  return (
    <div className="adminPage">
      <header className="adminPageHeader">
        <div><p className="adminEyebrow">EDITORIAL</p><h1>Notícias</h1><p>Gestão de publicações no mesmo padrão operacional do módulo Artistas.</p></div>
        <Link className="adminButton primary" href="/admin/posts/new">Nova notícia</Link>
      </header>
      <PostManager posts={summary} deleted={deleted === "1"} />
    </div>
  );
}
