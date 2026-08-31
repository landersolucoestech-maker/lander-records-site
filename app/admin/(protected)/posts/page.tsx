import { and, asc, count, desc, eq, ilike, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm";
import { requireAdmin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { mediaAssets, postCategories, posts, postTags, tags } from "../../../../lib/db/schema";
import PostManager, { type PostSummary } from "./PostManager";

export const dynamic = "force-dynamic";
type PostFilters = { category?: string; deleted?: string; q?: string; status?: string; tag?: string };

const publicPost = sql<boolean>`${posts.status} = 'published' AND ${posts.archivedAt} IS NULL AND (${posts.publishedAt} IS NULL OR ${posts.publishedAt} <= now()) AND (${posts.scheduledAt} IS NULL OR ${posts.scheduledAt} <= now())`;

export default async function AdminPostsPage({ searchParams }: { searchParams: Promise<PostFilters> }) {
  const session = await requireAdmin();
  const db = getDb();
  const filters = await searchParams;
  const conditions: SQL[] = [];
  const query = filters.q?.trim();
  if (query) {
    const pattern = `%${query}%`;
    conditions.push(or(
      ilike(posts.title, pattern), ilike(posts.slug, pattern), ilike(posts.excerpt, pattern),
      ilike(posts.authorName, pattern), ilike(postCategories.name, pattern),
      sql`EXISTS (SELECT 1 FROM ${postTags} INNER JOIN ${tags} ON ${postTags.tagId} = ${tags.id} WHERE ${postTags.postId} = ${posts.id} AND ${tags.name} ILIKE ${pattern})`,
    )!);
  }
  if (filters.status === "published") conditions.push(publicPost);
  if (filters.status === "draft") conditions.push(and(eq(posts.status, "draft"), isNull(posts.archivedAt))!);
  if (filters.status === "archived") conditions.push(or(eq(posts.status, "archived"), isNotNull(posts.archivedAt))!);
  if (filters.category && filters.category !== "all") conditions.push(eq(postCategories.name, filters.category));
  if (filters.tag && filters.tag !== "all") conditions.push(sql`EXISTS (SELECT 1 FROM ${postTags} INNER JOIN ${tags} ON ${postTags.tagId} = ${tags.id} WHERE ${postTags.postId} = ${posts.id} AND ${tags.name} = ${filters.tag})`);

  const [rows, tagRows, categoryRows, [metrics]] = await Promise.all([
    db.select({
      id: posts.id, title: posts.title, slug: posts.slug, excerpt: posts.excerpt, status: posts.status,
      authorName: posts.authorName, publishedAt: posts.publishedAt, archivedAt: posts.archivedAt,
      featuredOnHome: posts.featuredOnHome, updatedAt: posts.updatedAt, categoryName: postCategories.name,
      coverImage: mediaAssets.url, isPubliclyVisible: publicPost,
    }).from(posts).leftJoin(postCategories, eq(posts.categoryId, postCategories.id)).leftJoin(mediaAssets, eq(posts.coverMediaId, mediaAssets.id)).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(posts.updatedAt), desc(posts.createdAt)),
    db.select({ postId: postTags.postId, name: tags.name }).from(postTags).innerJoin(tags, eq(postTags.tagId, tags.id)).orderBy(asc(tags.name)),
    db.select({ name: postCategories.name }).from(postCategories).orderBy(asc(postCategories.name)),
    db.select({
      total: count(),
      published: sql<number>`count(*) FILTER (WHERE ${publicPost})`,
      drafts: sql<number>`count(*) FILTER (WHERE ${posts.status} = 'draft' AND ${posts.archivedAt} IS NULL)`,
      archived: sql<number>`count(*) FILTER (WHERE ${posts.status} = 'archived' OR ${posts.archivedAt} IS NOT NULL)`,
    }).from(posts),
  ]);
  const summary: PostSummary[] = rows.map((post) => ({
    id: post.id, title: post.title, slug: post.slug, excerpt: post.excerpt,
    status: post.archivedAt || post.status === "archived" ? "archived" : post.isPubliclyVisible ? "published" : post.status === "draft" ? "draft" : "unpublished",
    category: post.categoryName || "Sem categoria", authorName: post.authorName || "Não informado",
    publishedAt: post.publishedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(post.publishedAt) : "",
    coverImage: post.coverImage || "", featuredOnHome: post.isPubliclyVisible && post.featuredOnHome,
    tags: tagRows.filter((row) => row.postId === post.id).map((row) => row.name), isPubliclyVisible: post.isPubliclyVisible,
    updatedAt: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(post.updatedAt),
  }));
  return <PostManager availableCategories={categoryRows.map(({ name }) => name)} availableTags={Array.from(new Set(tagRows.map(({ name }) => name)))} canEdit={session.user.role !== "viewer"} deleted={filters.deleted === "1"} initialFilters={{ category: filters.category, q: filters.q, status: filters.status, tag: filters.tag }} metrics={metrics} posts={summary} />;
}
