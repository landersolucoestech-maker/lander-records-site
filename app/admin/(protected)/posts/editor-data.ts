import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { postLinks, postProfiles } from "../../../../lib/db/news-management-schema";
import { mediaAssets, postCategories, postTags, posts, tags } from "../../../../lib/db/schema";

export async function loadPostOptions() {
  await requireAdmin("editor");
  const db = getDb();
  const [media, categories, allTags] = await Promise.all([
    db.select({ id: mediaAssets.id, name: mediaAssets.originalFilename, url: mediaAssets.url }).from(mediaAssets).where(eq(mediaAssets.status, "active")).orderBy(asc(mediaAssets.originalFilename)),
    db.select({ id: postCategories.id, name: postCategories.name }).from(postCategories).where(eq(postCategories.active, true)).orderBy(asc(postCategories.position), asc(postCategories.name)),
    db.select({ id: tags.id, name: tags.name }).from(tags).orderBy(asc(tags.name)),
  ]);
  return { media, categories, tags: allTags };
}

export async function loadPostEditor(id: string) {
  await requireAdmin("editor");
  const db = getDb();
  const [postRows, profileRows, linkRows, tagRows, mediaRows] = await Promise.all([
    db.select().from(posts).where(eq(posts.id, id)).limit(1),
    db.select().from(postProfiles).where(eq(postProfiles.postId, id)).limit(1),
    db.select().from(postLinks).where(eq(postLinks.postId, id)),
    db.select().from(postTags).where(eq(postTags.postId, id)),
    db.select({ id: mediaAssets.id, url: mediaAssets.url }).from(mediaAssets).where(eq(mediaAssets.status, "active")),
  ]);
  const post = postRows[0];
  if (!post) return null;
  const profile = profileRows[0];
  const mediaMap = new Map(mediaRows.map((media) => [media.id, media.url]));
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    categoryId: post.categoryId || "",
    publishedAt: post.publishedAt?.toISOString() || "",
    authorName: post.authorName,
    excerpt: post.excerpt,
    contentMarkdown: post.contentMarkdown,
    coverMediaId: post.coverMediaId || "",
    coverImage: post.coverMediaId ? mediaMap.get(post.coverMediaId) || "" : "",
    authorMediaId: profile?.authorMediaId || "",
    authorImage: profile?.authorMediaId ? mediaMap.get(profile.authorMediaId) || "" : "",
    publicationLink: profile?.publicationLink || `/noticias/${post.slug}`,
    links: Object.fromEntries(linkRows.map((link) => [link.platform, link.url])),
    featuredOnHome: post.featuredOnHome,
    homePosition: post.homePosition,
    tagIds: tagRows.map((row) => row.tagId),
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    canonicalUrl: post.canonicalUrl,
  };
}
