import { and, asc, desc, eq, inArray, isNull, lte, or } from "drizzle-orm";
import { getDb } from "./db";
import {
  artistCategories,
  artistCategoryRelations,
  artistEmbeds,
  artistLinks,
  artists,
  contactTopics,
  mediaAssets,
  navigationItems,
  pageSectionItems,
  pageSections,
  pages,
  postCategories,
  posts,
  releases,
  siteSettings,
  slugRedirects,
  socialLinks,
} from "./db/schema";

export type PublicArtist = {
  id: string;
  name: string;
  slug: string;
  eyebrow: string;
  shortBio: string;
  biography: string;
  cardImage: string;
  heroImage: string;
  ogImage: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  categories: Array<{ id: string; name: string; slug: string; isPrimary: boolean }>;
  links: Array<{ id: string; kind: string; platform: string; label: string; url: string }>;
  embeds: Array<{ id: string; type: string; title: string; url: string; featured: boolean }>;
};

export type PublicPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentMarkdown: string;
  authorName: string;
  status: string;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  category: { id: string; name: string; slug: string } | null;
  coverImage: string;
  ogImage: string;
  updatedAt: Date;
};

export async function getSiteChrome() {
  const db = getDb();
  const [settingsRows, nav, socials, mediaRows] = await Promise.all([
    db.select().from(siteSettings).limit(1),
    db.select().from(navigationItems).where(eq(navigationItems.enabled, true)).orderBy(asc(navigationItems.menuKey), asc(navigationItems.position)),
    db.select().from(socialLinks).where(eq(socialLinks.active, true)).orderBy(asc(socialLinks.position)),
    db.select().from(mediaAssets).where(eq(mediaAssets.status, "active")),
  ]);
  const resolvedSettings = settingsRows[0] ?? {
    id: "site", brandName: "Lander Records", tagline: "", contactEmail: "", contactPhone: "", location: "", address: "", hours: "",
    defaultSeoTitle: "Lander Records", defaultSeoDescription: "", logoMediaId: null, socialImageMediaId: null, updatedAt: new Date(),
  };
  const mediaMap = new Map(mediaRows.map((media) => [media.id, media.url]));
  return {
    settings: resolvedSettings,
    logoUrl: resolvedSettings.logoMediaId ? mediaMap.get(resolvedSettings.logoMediaId) ?? "" : "",
    socialImageUrl: resolvedSettings.socialImageMediaId ? mediaMap.get(resolvedSettings.socialImageMediaId) ?? "" : "",
    navigation: nav,
    socials,
  };
}

export async function getArtistCategoriesForPublic() {
  return getDb().select().from(artistCategories).where(and(eq(artistCategories.active, true), eq(artistCategories.showAsFilter, true))).orderBy(asc(artistCategories.position), asc(artistCategories.name));
}

async function hydrateArtists(baseArtists: Array<typeof artists.$inferSelect>): Promise<PublicArtist[]> {
  if (!baseArtists.length) return [];
  const db = getDb();
  const ids = new Set(baseArtists.map((artist) => artist.id));
  const [relationRows, linkRows, embedRows, mediaRows] = await Promise.all([
    db.select({ artistId: artistCategoryRelations.artistId, categoryId: artistCategories.id, name: artistCategories.name, slug: artistCategories.slug, isPrimary: artistCategoryRelations.isPrimary, position: artistCategoryRelations.position })
      .from(artistCategoryRelations).innerJoin(artistCategories, eq(artistCategoryRelations.categoryId, artistCategories.id)).where(eq(artistCategories.active, true)).orderBy(asc(artistCategoryRelations.position)),
    db.select().from(artistLinks).where(eq(artistLinks.active, true)).orderBy(asc(artistLinks.position)),
    db.select().from(artistEmbeds).where(eq(artistEmbeds.active, true)).orderBy(asc(artistEmbeds.position)),
    db.select().from(mediaAssets).where(eq(mediaAssets.status, "active")),
  ]);
  const mediaMap = new Map(mediaRows.map((media) => [media.id, media.url]));
  return baseArtists.map((artist) => ({
    id: artist.id, name: artist.name, slug: artist.slug, eyebrow: artist.eyebrow, shortBio: artist.shortBio, biography: artist.biography,
    cardImage: artist.cardMediaId ? mediaMap.get(artist.cardMediaId) ?? "" : "",
    heroImage: artist.heroMediaId ? mediaMap.get(artist.heroMediaId) ?? "" : "",
    ogImage: artist.ogMediaId ? mediaMap.get(artist.ogMediaId) ?? "" : "",
    seoTitle: artist.seoTitle, seoDescription: artist.seoDescription, canonicalUrl: artist.canonicalUrl,
    categories: relationRows.filter((row) => row.artistId === artist.id && ids.has(row.artistId)).map((row) => ({ id: row.categoryId, name: row.name, slug: row.slug, isPrimary: row.isPrimary })),
    links: linkRows.filter((row) => row.artistId === artist.id).map((row) => ({ id: row.id, kind: row.kind, platform: row.platform, label: row.label, url: row.url })),
    embeds: embedRows.filter((row) => row.artistId === artist.id).map((row) => ({ id: row.id, type: row.type, title: row.title, url: row.url, featured: row.featured })),
  }));
}

export async function getPublishedArtists(featuredOnly = false) {
  const conditions = [eq(artists.isPublished, true), isNull(artists.archivedAt)];
  if (featuredOnly) conditions.push(eq(artists.featureOnHome, true));
  const rows = await getDb().select().from(artists).where(and(...conditions)).orderBy(featuredOnly ? asc(artists.homePosition) : asc(artists.listPosition), asc(artists.name));
  return hydrateArtists(rows);
}

export async function getPublishedArtistBySlug(slug: string) {
  const rows = await getDb().select().from(artists).where(and(eq(artists.slug, slug), eq(artists.isPublished, true), isNull(artists.archivedAt))).limit(1);
  const hydrated = await hydrateArtists(rows);
  return hydrated[0] ?? null;
}

function publishablePostWhere() {
  const now = new Date();
  return and(eq(posts.status, "published"), or(isNull(posts.publishedAt), lte(posts.publishedAt, now)), or(isNull(posts.scheduledAt), lte(posts.scheduledAt, now)), isNull(posts.archivedAt));
}

export async function getPostCategoriesForPublic() {
  return getDb().select().from(postCategories).where(and(eq(postCategories.active, true), eq(postCategories.showAsFilter, true))).orderBy(asc(postCategories.position), asc(postCategories.name));
}

export async function getPublishedPosts(featuredOnly = false): Promise<PublicPost[]> {
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

export async function getFeaturedReleases() {
  return getDb().select({ release: releases, coverUrl: mediaAssets.url }).from(releases).leftJoin(mediaAssets, eq(releases.coverMediaId, mediaAssets.id)).where(and(eq(releases.active, true), eq(releases.featuredOnHome, true))).orderBy(asc(releases.position), desc(releases.releaseDate));
}

export async function getPageContent(pageKey: string) {
  const db = getDb();
  const pageRows = await db.select().from(pages).where(and(eq(pages.key, pageKey), eq(pages.enabled, true))).limit(1);
  const page = pageRows[0];
  if (!page) return null;
  const ogRows = page.ogMediaId ? await db.select({ url: mediaAssets.url }).from(mediaAssets).where(and(eq(mediaAssets.id, page.ogMediaId), eq(mediaAssets.status, "active"))).limit(1) : [];
  const sections = await db.select().from(pageSections).where(and(eq(pageSections.pageId, page.id), eq(pageSections.enabled, true))).orderBy(asc(pageSections.position));
  const sectionIds = sections.map((section) => section.id);
  const allItems = sectionIds.length ? await db.select().from(pageSectionItems).where(and(eq(pageSectionItems.enabled, true), inArray(pageSectionItems.sectionId, sectionIds))).orderBy(asc(pageSectionItems.position)) : [];
  return { page, ogImageUrl: ogRows[0]?.url ?? "", sections: sections.map((section) => ({ ...section, items: allItems.filter((item) => item.sectionId === section.id) })) };
}

export async function getContactTopics() {
  return getDb().select().from(contactTopics).where(eq(contactTopics.active, true)).orderBy(asc(contactTopics.position), asc(contactTopics.name));
}

export async function getSlugRedirect(entityType: "artist" | "post", oldSlug: string) {
  const rows = await getDb().select({ newSlug: slugRedirects.newSlug }).from(slugRedirects).where(and(eq(slugRedirects.entityType, entityType), eq(slugRedirects.oldSlug, oldSlug))).limit(1);
  return rows[0]?.newSlug ?? null;
}
