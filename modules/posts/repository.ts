import { and, asc, desc, eq, inArray, isNull, lte, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { mediaAssets, postCategories, posts, postTags, tags } from "@/lib/db/schema";
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
  const rows = await db.select({ post: posts, categoryId: postCategories.id, categoryName: postCategories.name, categorySlug: postCategories.slug, coverUrl: mediaAssets.url })
    .from(posts).leftJoin(postCategories, eq(posts.categoryId, postCategories.id)).leftJoin(mediaAssets, eq(posts.coverMediaId, mediaAssets.id)).where(where)
    .orderBy(featuredOnly ? asc(posts.homePosition) : desc(posts.publishedAt), desc(posts.createdAt));
  const postIds = rows.map(({ post }) => post.id);
  const ogMediaIds = [...new Set(rows.map(({ post }) => post.ogMediaId).filter((id): id is string => Boolean(id)))];
  const [tagRows, ogMediaRows] = await Promise.all([
    postIds.length ? db.select({ postId: postTags.postId, id: tags.id, name: tags.name, slug: tags.slug }).from(postTags).innerJoin(tags, eq(postTags.tagId, tags.id)).where(inArray(postTags.postId, postIds)) : Promise.resolve([]),
    ogMediaIds.length ? db.select().from(mediaAssets).where(and(eq(mediaAssets.status, "active"), inArray(mediaAssets.id, ogMediaIds))) : Promise.resolve([]),
  ]);
  const mediaMap = new Map(ogMediaRows.map((media) => [media.id, media.url]));
  return rows.map(({ post, categoryId, categoryName, categorySlug, coverUrl }) => ({
    ...post,
    category: categoryId && categoryName && categorySlug ? { id: categoryId, name: categoryName, slug: categorySlug } : null,
    tags: tagRows.filter((tag) => tag.postId === post.id).map(({ id, name, slug }) => ({ id, name, slug })),
    coverImage: coverUrl ?? "",
    ogImage: post.ogMediaId ? mediaMap.get(post.ogMediaId) ?? "" : "",
  }));
}

export async function getPublishedPostBySlug(slug: string): Promise<PublicPost | null> {
  if (mockDataEnabled()) return mockPosts.find((post) => post.slug === slug) ?? null;
  const db = getDb();
  const [rows, mediaRows, tagRows] = await Promise.all([
    db.select({ post: posts, categoryId: postCategories.id, categoryName: postCategories.name, categorySlug: postCategories.slug, coverUrl: mediaAssets.url })
      .from(posts).leftJoin(postCategories, eq(posts.categoryId, postCategories.id)).leftJoin(mediaAssets, eq(posts.coverMediaId, mediaAssets.id)).where(and(eq(posts.slug, slug), publishablePostWhere())).limit(1),
    db.select().from(mediaAssets).where(eq(mediaAssets.status, "active")),
    db.select({ postId: postTags.postId, id: tags.id, name: tags.name, slug: tags.slug }).from(postTags).innerJoin(tags, eq(postTags.tagId, tags.id)),
  ]);
  const row = rows[0];
  if (!row) return null;
  const mediaMap = new Map(mediaRows.map((media) => [media.id, media.url]));
  return {
    ...row.post,
    category: row.categoryId && row.categoryName && row.categorySlug ? { id: row.categoryId, name: row.categoryName, slug: row.categorySlug } : null,
    tags: tagRows.filter((tag) => tag.postId === row.post.id).map(({ id, name, slug }) => ({ id, name, slug })),
    coverImage: row.coverUrl ?? "",
    ogImage: row.post.ogMediaId ? mediaMap.get(row.post.ogMediaId) ?? "" : "",
  };
}
