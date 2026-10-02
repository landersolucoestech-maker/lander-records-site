import { and, asc, desc, eq, isNull, lte, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { mediaAssets, postCategories, posts } from "@/lib/db/schema";
import type { PublicPost } from "./types";
import { mockDataEnabled, mockPostCategories, mockPosts } from "@/lib/mocks";
export { getSlugRedirect } from "@/modules/settings/repository";
function publishablePostWhere() {
  const now = new Date();
  return and(eq(posts.status, "published"), or(isNull(posts.publishedAt), lte(posts.publishedAt, now)), or(isNull(posts.scheduledAt), lte(posts.scheduledAt, now)), isNull(posts.archivedAt));
}

export async function getPostCategoriesForPublic() {
  if (mockDataEnabled()) return mockPostCategories;
  return getDb().select().from(postCategories).where(and(eq(postCategories.active, true), eq(postCategories.showAsFilter, true))).orderBy(asc(postCategories.position), asc(postCategories.name));
}

export async function getPublishedPosts(featuredOnly = false): Promise<PublicPost[]> {
  if (mockDataEnabled()) return featuredOnly ? mockPosts.slice(0, 3) : mockPosts;
  const db = getDb();
  const where = featuredOnly ? and(publishablePostWhere(), eq(posts.featuredOnHome, true)) : publishablePostWhere();
  const [rows, mediaRows] = await Promise.all([
    db.select({ post: posts, categoryId: postCategories.id, categoryName: postCategories.name, categorySlug: postCategories.slug, coverUrl: mediaAssets.url })
      .from(posts).leftJoin(postCategories, eq(posts.categoryId, postCategories.id)).leftJoin(mediaAssets, eq(posts.coverMediaId, mediaAssets.id)).where(where)
      .orderBy(featuredOnly ? asc(posts.homePosition) : desc(posts.publishedAt), desc(posts.createdAt)),
    db.select().from(mediaAssets).where(eq(mediaAssets.status, "active")),
  ]);
  const mediaMap = new Map(mediaRows.map((media) => [media.id, media.url]));
  return rows.map(({ post, categoryId, categoryName, categorySlug, coverUrl }) => ({
    ...post,
    category: categoryId && categoryName && categorySlug ? { id: categoryId, name: categoryName, slug: categorySlug } : null,
    coverImage: coverUrl ?? "",
    ogImage: post.ogMediaId ? mediaMap.get(post.ogMediaId) ?? "" : "",
  }));
}

export async function getPublishedPostBySlug(slug: string): Promise<PublicPost | null> {
  if (mockDataEnabled()) return mockPosts.find((post) => post.slug === slug) ?? null;
  const db = getDb();
  const [rows, mediaRows] = await Promise.all([
    db.select({ post: posts, categoryId: postCategories.id, categoryName: postCategories.name, categorySlug: postCategories.slug, coverUrl: mediaAssets.url })
      .from(posts).leftJoin(postCategories, eq(posts.categoryId, postCategories.id)).leftJoin(mediaAssets, eq(posts.coverMediaId, mediaAssets.id)).where(and(eq(posts.slug, slug), publishablePostWhere())).limit(1),
    db.select().from(mediaAssets).where(eq(mediaAssets.status, "active")),
  ]);
  const row = rows[0];
  if (!row) return null;
  const mediaMap = new Map(mediaRows.map((media) => [media.id, media.url]));
  return {
    ...row.post,
    category: row.categoryId && row.categoryName && row.categorySlug ? { id: row.categoryId, name: row.categoryName, slug: row.categorySlug } : null,
    coverImage: row.coverUrl ?? "",
    ogImage: row.post.ogMediaId ? mediaMap.get(row.post.ogMediaId) ?? "" : "",
  };
}
