"use server";

import { put } from "@vercel/blob";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import {
  audit,
  destroyAdminSession,
  getAdminSession,
  hashPassword,
  requireAdmin,
  verifyPassword,
} from "../../lib/auth";
import { dispatchOutboxEvent } from "../../lib/contact";
import { getDb } from "../../lib/db";
import {
  adminSessions,
  adminUsers,
  artistCategories,
  artistCategoryRelations,
  artistEmbeds,
  artistLinks,
  artists,
  contactSubmissions,
  contactTopics,
  integrationOutbox,
  mediaAssets,
  navigationItems,
  pageSectionItems,
  pageSections,
  pages,
  postCategories,
  postTags,
  posts,
  releases,
  siteSettings,
  slugRedirects,
  socialLinks,
  tags,
} from "../../lib/db/schema";
import { slugify } from "../../lib/slug";

function text(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}
function nullable(formData: FormData, name: string) {
  const value = text(formData, name);
  return value || null;
}
function checked(formData: FormData, name: string) {
  return formData.get(name) === "on" || formData.get(name) === "true";
}
function integer(formData: FormData, name: string) {
  const value = Number.parseInt(text(formData, name), 10);
  return Number.isFinite(value) ? value : 0;
}
function uuidOrNull(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}
function revalidatePublic() {
  for (const path of ["/", "/artistas", "/noticias", "/sobre-nos", "/contato", "/sitemap.xml"]) revalidatePath(path);
}

export async function logoutAction() {
  const session = await getAdminSession();
  if (session) await audit(session.user.id, "auth.logout", "admin_user", session.user.id);
  await destroyAdminSession();
  redirect("/admin/login");
}

export async function changeOwnPassword(formData: FormData) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const currentPassword = text(formData, "currentPassword");
  const newPassword = text(formData, "newPassword");
  const confirmPassword = text(formData, "confirmPassword");

  const db = getDb();
  const rows = await db.select().from(adminUsers).where(eq(adminUsers.id, session.user.id)).limit(1);
  const user = rows[0];
  if (!user || newPassword !== confirmPassword || !(await verifyPassword(currentPassword, user.passwordHash))) {
    redirect("/admin/change-password?error=1");
  }

  const passwordHash = await hashPassword(newPassword);
  await db.update(adminUsers).set({
    passwordHash,
    mustChangePassword: false,
    failedLoginAttempts: 0,
    lockedUntil: null,
    updatedAt: new Date(),
  }).where(eq(adminUsers.id, user.id));
  await db.delete(adminSessions).where(and(eq(adminSessions.userId, user.id), ne(adminSessions.id, session.sessionId)));
  await audit(user.id, "auth.password_changed", "admin_user", user.id);
  redirect("/admin");
}

export async function createArtist(formData: FormData) {
  const session = await requireAdmin("editor");
  const name = text(formData, "name");
  const slug = slugify(text(formData, "slug") || name);
  if (!name || !slug) throw new Error("Nome e slug são obrigatórios.");

  const rows = await getDb().insert(artists).values({
    name,
    slug,
    eyebrow: text(formData, "eyebrow"),
    shortBio: text(formData, "shortBio"),
    biography: text(formData, "biography"),
    isPublished: false,
    createdBy: session.user.id,
    updatedBy: session.user.id,
  }).returning({ id: artists.id });
  await audit(session.user.id, "artist.created", "artist", rows[0].id, { name, slug });
  revalidatePublic();
  redirect(`/admin/artists/${rows[0].id}`);
}

export async function updateArtist(formData: FormData) {
  const session = await requireAdmin("editor");
  const id = text(formData, "id");
  const name = text(formData, "name");
  const slug = slugify(text(formData, "slug") || name);
  const db = getDb();

  const currentRows = await db.select().from(artists).where(eq(artists.id, id)).limit(1);
  const current = currentRows[0];
  if (!current) throw new Error("Artista não encontrado.");

  await db.update(artists).set({
    name,
    slug,
    eyebrow: text(formData, "eyebrow"),
    shortBio: text(formData, "shortBio"),
    biography: text(formData, "biography"),
    cardMediaId: uuidOrNull(text(formData, "cardMediaId")),
    heroMediaId: uuidOrNull(text(formData, "heroMediaId")),
    ogMediaId: uuidOrNull(text(formData, "ogMediaId")),
    featureOnHome: checked(formData, "featureOnHome"),
    homePosition: integer(formData, "homePosition"),
    listPosition: integer(formData, "listPosition"),
    seoTitle: text(formData, "seoTitle"),
    seoDescription: text(formData, "seoDescription"),
    canonicalUrl: text(formData, "canonicalUrl"),
    updatedBy: session.user.id,
    updatedAt: new Date(),
  }).where(eq(artists.id, id));

  if (current.slug !== slug) {
    await db.insert(slugRedirects).values({
      entityType: "artist",
      oldSlug: current.slug,
      newSlug: slug,
    }).onConflictDoUpdate({
      target: [slugRedirects.entityType, slugRedirects.oldSlug],
      set: { newSlug: slug },
    });
  }

  const categoryIds = formData.getAll("categoryIds").map(String).filter(uuidOrNull) as string[];
  await db.delete(artistCategoryRelations).where(eq(artistCategoryRelations.artistId, id));
  if (categoryIds.length) {
    await db.insert(artistCategoryRelations).values(categoryIds.map((categoryId, index) => ({
      artistId: id,
      categoryId,
      isPrimary: index === 0,
      position: index,
    })));
  }

  await audit(session.user.id, "artist.updated", "artist", id, { name, slug, categoryCount: categoryIds.length });
  revalidatePublic();
  revalidatePath(`/artistas/${current.slug}`);
  revalidatePath(`/artistas/${slug}`);
  redirect(`/admin/artists/${id}?saved=1`);
}

export async function setArtistPublication(formData: FormData) {
  const session = await requireAdmin("editor");
  const id = text(formData, "id");
  const publish = text(formData, "action") === "publish";
  const db = getDb();
  await db.update(artists).set({
    isPublished: publish,
    publishedAt: publish ? new Date() : null,
    updatedBy: session.user.id,
    updatedAt: new Date(),
  }).where(eq(artists.id, id));
  await audit(session.user.id, publish ? "artist.published" : "artist.unpublished", "artist", id);
  revalidatePublic();
  revalidatePath(`/admin/artists/${id}`);
}

export async function archiveArtist(formData: FormData) {
  const session = await requireAdmin("admin");
  const id = text(formData, "id");
  await getDb().update(artists).set({
    isPublished: false,
    archivedAt: new Date(),
    updatedBy: session.user.id,
    updatedAt: new Date(),
  }).where(eq(artists.id, id));
  await audit(session.user.id, "artist.archived", "artist", id);
  revalidatePublic();
  redirect("/admin/artists");
}

export async function upsertArtistCategory(formData: FormData) {
  const session = await requireAdmin("editor");
  const id = text(formData, "id");
  const name = text(formData, "name");
  const slug = slugify(text(formData, "slug") || name);
  const values = {
    name,
    slug,
    description: text(formData, "description"),
    position: integer(formData, "position"),
    active: checked(formData, "active"),
    showAsFilter: checked(formData, "showAsFilter"),
    updatedBy: session.user.id,
    updatedAt: new Date(),
  };
  const db = getDb();

  if (id) {
    await db.update(artistCategories).set(values).where(eq(artistCategories.id, id));
    await audit(session.user.id, "artist_category.updated", "artist_category", id, { name, slug });
  } else {
    const rows = await db.insert(artistCategories).values({ ...values, createdBy: session.user.id }).returning({ id: artistCategories.id });
    await audit(session.user.id, "artist_category.created", "artist_category", rows[0].id, { name, slug });
  }
  revalidatePublic();
  revalidatePath("/admin/artist-categories");
}

export async function deleteArtistCategory(formData: FormData) {
  const session = await requireAdmin("admin");
  const id = text(formData, "id");
  const db = getDb();
  const relations = await db.select({ artistId: artistCategoryRelations.artistId }).from(artistCategoryRelations).where(eq(artistCategoryRelations.categoryId, id)).limit(1);
  if (relations.length) throw new Error("Não é possível excluir uma categoria associada a artistas. Desassocie primeiro.");
  await db.delete(artistCategories).where(eq(artistCategories.id, id));
  await audit(session.user.id, "artist_category.deleted", "artist_category", id);
  revalidatePublic();
  revalidatePath("/admin/artist-categories");
}

export async function addArtistLink(formData: FormData) {
  const session = await requireAdmin("editor");
  const artistId = text(formData, "artistId");
  const rows = await getDb().insert(artistLinks).values({
    artistId,
    kind: text(formData, "kind") || "social",
    platform: text(formData, "platform"),
    label: text(formData, "label"),
    url: text(formData, "url"),
    position: integer(formData, "position"),
    active: true,
  }).returning({ id: artistLinks.id });
  await audit(session.user.id, "artist_link.created", "artist_link", rows[0].id, { artistId });
  revalidatePublic();
  revalidatePath(`/admin/artists/${artistId}`);
}

export async function deleteArtistLink(formData: FormData) {
  const session = await requireAdmin("editor");
  const id = text(formData, "id");
  const artistId = text(formData, "artistId");
  await getDb().delete(artistLinks).where(eq(artistLinks.id, id));
  await audit(session.user.id, "artist_link.deleted", "artist_link", id, { artistId });
  revalidatePublic();
  revalidatePath(`/admin/artists/${artistId}`);
}

export async function addArtistEmbed(formData: FormData) {
  const session = await requireAdmin("editor");
  const artistId = text(formData, "artistId");
  const rows = await getDb().insert(artistEmbeds).values({
    artistId,
    type: text(formData, "type"),
    title: text(formData, "title"),
    url: text(formData, "url"),
    position: integer(formData, "position"),
    active: true,
    featured: checked(formData, "featured"),
  }).returning({ id: artistEmbeds.id });
  await audit(session.user.id, "artist_embed.created", "artist_embed", rows[0].id, { artistId });
  revalidatePublic();
  revalidatePath(`/admin/artists/${artistId}`);
}

export async function deleteArtistEmbed(formData: FormData) {
  const session = await requireAdmin("editor");
  const id = text(formData, "id");
  const artistId = text(formData, "artistId");
  await getDb().delete(artistEmbeds).where(eq(artistEmbeds.id, id));
  await audit(session.user.id, "artist_embed.deleted", "artist_embed", id, { artistId });
  revalidatePublic();
  revalidatePath(`/admin/artists/${artistId}`);
}

export async function createPost(formData: FormData) {
  const session = await requireAdmin("editor");
  const title = text(formData, "title");
  const slug = slugify(text(formData, "slug") || title);
  const rows = await getDb().insert(posts).values({
    title,
    slug,
    status: "draft",
    authorName: session.user.name,
    createdBy: session.user.id,
    updatedBy: session.user.id,
  }).returning({ id: posts.id });
  await audit(session.user.id, "post.created", "post", rows[0].id, { title, slug });
  redirect(`/admin/posts/${rows[0].id}`);
}

export async function updatePost(formData: FormData) {
  const session = await requireAdmin("editor");
  const id = text(formData, "id");
  const title = text(formData, "title");
  const slug = slugify(text(formData, "slug") || title);
  const db = getDb();
  const current = (await db.select().from(posts).where(eq(posts.id, id)).limit(1))[0];
  if (!current) throw new Error("Publicação não encontrada.");

  const scheduledValue = text(formData, "scheduledAt");
  const scheduledAt = scheduledValue ? new Date(scheduledValue) : null;

  await db.update(posts).set({
    title,
    slug,
    excerpt: text(formData, "excerpt"),
    contentMarkdown: text(formData, "contentMarkdown"),
    authorName: text(formData, "authorName") || session.user.name,
    categoryId: uuidOrNull(text(formData, "categoryId")),
    coverMediaId: uuidOrNull(text(formData, "coverMediaId")),
    ogMediaId: uuidOrNull(text(formData, "ogMediaId")),
    featuredOnHome: checked(formData, "featuredOnHome"),
    homePosition: integer(formData, "homePosition"),
    scheduledAt,
    seoTitle: text(formData, "seoTitle"),
    seoDescription: text(formData, "seoDescription"),
    canonicalUrl: text(formData, "canonicalUrl"),
    updatedBy: session.user.id,
    updatedAt: new Date(),
  }).where(eq(posts.id, id));

  if (current.slug !== slug) {
    await db.insert(slugRedirects).values({
      entityType: "post",
      oldSlug: current.slug,
      newSlug: slug,
    }).onConflictDoUpdate({
      target: [slugRedirects.entityType, slugRedirects.oldSlug],
      set: { newSlug: slug },
    });
  }

  const tagIds = formData.getAll("tagIds").map(String).filter(uuidOrNull) as string[];
  await db.delete(postTags).where(eq(postTags.postId, id));
  if (tagIds.length) {
    await db.insert(postTags).values(tagIds.map((tagId) => ({ postId: id, tagId })));
  }

  await audit(session.user.id, "post.updated", "post", id, { title, slug, tagCount: tagIds.length });
  revalidatePublic();
  revalidatePath(`/noticias/${current.slug}`);
  revalidatePath(`/noticias/${slug}`);
  redirect(`/admin/posts/${id}?saved=1`);
}

export async function setPostPublication(formData: FormData) {
  const session = await requireAdmin("editor");
  const id = text(formData, "id");
  const action = text(formData, "action");
  const db = getDb();
  const status = action === "publish" ? "published" : action === "archive" ? "archived" : "draft";
  await db.update(posts).set({
    status,
    publishedAt: status === "published" ? new Date() : null,
    archivedAt: status === "archived" ? new Date() : null,
    updatedBy: session.user.id,
    updatedAt: new Date(),
  }).where(eq(posts.id, id));
  await audit(session.user.id, `post.${status}`, "post", id);
  revalidatePublic();
  revalidatePath(`/admin/posts/${id}`);
}

export async function upsertPostCategory(formData: FormData) {
  const session = await requireAdmin("editor");
  const id = text(formData, "id");
  const name = text(formData, "name");
  const values = {
    name,
    slug: slugify(text(formData, "slug") || name),
    position: integer(formData, "position"),
    active: checked(formData, "active"),
    showAsFilter: checked(formData, "showAsFilter"),
    updatedAt: new Date(),
  };
  const db = getDb();
  if (id) {
    await db.update(postCategories).set(values).where(eq(postCategories.id, id));
    await audit(session.user.id, "post_category.updated", "post_category", id, { name });
  } else {
    const rows = await db.insert(postCategories).values(values).returning({ id: postCategories.id });
    await audit(session.user.id, "post_category.created", "post_category", rows[0].id, { name });
  }
  revalidatePublic();
  revalidatePath("/admin/post-categories");
}

export async function deletePostCategory(formData: FormData) {
  const session = await requireAdmin("admin");
  const id = text(formData, "id");
  const db = getDb();
  const usage = await db.select({ id: posts.id }).from(posts).where(eq(posts.categoryId, id)).limit(1);
  if (usage.length) throw new Error("Não é possível excluir uma categoria usada por publicações. Reclassifique os posts primeiro.");
  await db.delete(postCategories).where(eq(postCategories.id, id));
  await audit(session.user.id, "post_category.deleted", "post_category", id);
  revalidatePublic();
  revalidatePath("/admin/post-categories");
}

export async function upsertTag(formData: FormData) {
  const session = await requireAdmin("editor");
  const id = text(formData, "id");
  const name = text(formData, "name");
  const values = { name, slug: slugify(text(formData, "slug") || name), updatedAt: new Date() };
  const db = getDb();
  if (id) await db.update(tags).set(values).where(eq(tags.id, id));
  else await db.insert(tags).values(values);
  await audit(session.user.id, id ? "tag.updated" : "tag.created", "tag", id || null, { name });
  revalidatePath("/admin/tags");
}

export async function deleteTag(formData: FormData) {
  const session = await requireAdmin("editor");
  const id = text(formData, "id");
  const db = getDb();
  await db.delete(postTags).where(eq(postTags.tagId, id));
  await db.delete(tags).where(eq(tags.id, id));
  await audit(session.user.id, "tag.deleted", "tag", id);
  revalidatePath("/admin/tags");
}

export async function upsertRelease(formData: FormData) {
  const session = await requireAdmin("editor");
  const id = text(formData, "id");
  const title = text(formData, "title");
  const values = {
    title,
    slug: slugify(text(formData, "slug") || title),
    artistName: text(formData, "artistName"),
    releaseType: text(formData, "releaseType") || "Single",
    releaseDate: text(formData, "releaseDate") || null,
    coverMediaId: uuidOrNull(text(formData, "coverMediaId")),
    platform: text(formData, "platform") || "Spotify",
    platformUrl: text(formData, "platformUrl"),
    externalId: nullable(formData, "externalId"),
    position: integer(formData, "position"),
    featuredOnHome: checked(formData, "featuredOnHome"),
    active: checked(formData, "active"),
    updatedAt: new Date(),
  };
  const db = getDb();
  if (id) {
    await db.update(releases).set(values).where(eq(releases.id, id));
    await audit(session.user.id, "release.updated", "release", id, { title });
  } else {
    const rows = await db.insert(releases).values(values).returning({ id: releases.id });
    await audit(session.user.id, "release.created", "release", rows[0].id, { title });
  }
  revalidatePublic();
  revalidatePath("/admin/releases");
}

export async function updatePage(formData: FormData) {
  const session = await requireAdmin("editor");
  const id = text(formData, "id");
  await getDb().update(pages).set({
    title: text(formData, "title"),
    slug: text(formData, "slug"),
    enabled: checked(formData, "enabled"),
    seoTitle: text(formData, "seoTitle"),
    seoDescription: text(formData, "seoDescription"),
    canonicalUrl: text(formData, "canonicalUrl"),
    ogMediaId: uuidOrNull(text(formData, "ogMediaId")),
    updatedAt: new Date(),
  }).where(eq(pages.id, id));
  await audit(session.user.id, "page.updated", "page", id);
  revalidatePublic();
  revalidatePath(`/admin/pages/${id}`);
}

export async function updatePageSection(formData: FormData) {
  const session = await requireAdmin("editor");
  const id = text(formData, "id");
  const pageId = text(formData, "pageId");
  await getDb().update(pageSections).set({
    eyebrow: text(formData, "eyebrow"),
    title: text(formData, "title"),
    subtitle: text(formData, "subtitle"),
    body: text(formData, "body"),
    position: integer(formData, "position"),
    enabled: checked(formData, "enabled"),
    updatedAt: new Date(),
  }).where(eq(pageSections.id, id));
  await audit(session.user.id, "page_section.updated", "page_section", id, { pageId });
  revalidatePublic();
  revalidatePath(`/admin/pages/${pageId}`);
}

export async function addPageSectionItem(formData: FormData) {
  const session = await requireAdmin("editor");
  const sectionId = text(formData, "sectionId");
  const pageId = text(formData, "pageId");
  const rows = await getDb().insert(pageSectionItems).values({
    sectionId,
    itemKey: text(formData, "itemKey"),
    title: text(formData, "title"),
    subtitle: text(formData, "subtitle"),
    body: text(formData, "body"),
    label: text(formData, "label"),
    url: text(formData, "url"),
    mediaId: uuidOrNull(text(formData, "mediaId")),
    position: integer(formData, "position"),
    enabled: true,
  }).returning({ id: pageSectionItems.id });
  await audit(session.user.id, "page_section_item.created", "page_section_item", rows[0].id, { sectionId });
  revalidatePublic();
  revalidatePath(`/admin/pages/${pageId}`);
}

export async function updatePageSectionItem(formData: FormData) {
  const session = await requireAdmin("editor");
  const id = text(formData, "id");
  const pageId = text(formData, "pageId");
  await getDb().update(pageSectionItems).set({
    itemKey: text(formData, "itemKey"),
    title: text(formData, "title"),
    subtitle: text(formData, "subtitle"),
    body: text(formData, "body"),
    label: text(formData, "label"),
    url: text(formData, "url"),
    mediaId: uuidOrNull(text(formData, "mediaId")),
    position: integer(formData, "position"),
    enabled: checked(formData, "enabled"),
    updatedAt: new Date(),
  }).where(eq(pageSectionItems.id, id));
  await audit(session.user.id, "page_section_item.updated", "page_section_item", id);
  revalidatePublic();
  revalidatePath(`/admin/pages/${pageId}`);
}

export async function deletePageSectionItem(formData: FormData) {
  const session = await requireAdmin("editor");
  const id = text(formData, "id");
  const pageId = text(formData, "pageId");
  await getDb().delete(pageSectionItems).where(eq(pageSectionItems.id, id));
  await audit(session.user.id, "page_section_item.deleted", "page_section_item", id);
  revalidatePublic();
  revalidatePath(`/admin/pages/${pageId}`);
}

export async function upsertNavigationItem(formData: FormData) {
  const session = await requireAdmin("editor");
  const id = text(formData, "id");
  const values = {
    menuKey: text(formData, "menuKey") || "primary",
    parentId: uuidOrNull(text(formData, "parentId")),
    label: text(formData, "label"),
    url: text(formData, "url"),
    linkType: text(formData, "linkType") || "internal",
    position: integer(formData, "position"),
    enabled: checked(formData, "enabled"),
    newTab: checked(formData, "newTab"),
    updatedAt: new Date(),
  };
  const db = getDb();
  if (id) {
    await db.update(navigationItems).set(values).where(eq(navigationItems.id, id));
    await audit(session.user.id, "navigation.updated", "navigation_item", id, values);
  } else {
    const rows = await db.insert(navigationItems).values(values).returning({ id: navigationItems.id });
    await audit(session.user.id, "navigation.created", "navigation_item", rows[0].id, values);
  }
  revalidatePublic();
  revalidatePath("/admin/navigation");
}

export async function deleteNavigationItem(formData: FormData) {
  const session = await requireAdmin("admin");
  const id = text(formData, "id");
  await getDb().delete(navigationItems).where(eq(navigationItems.id, id));
  await audit(session.user.id, "navigation.deleted", "navigation_item", id);
  revalidatePublic();
  revalidatePath("/admin/navigation");
}

export async function updateSiteSettings(formData: FormData) {
  const session = await requireAdmin("admin");
  await getDb().update(siteSettings).set({
    brandName: text(formData, "brandName"),
    tagline: text(formData, "tagline"),
    contactEmail: text(formData, "contactEmail"),
    contactPhone: text(formData, "contactPhone"),
    location: text(formData, "location"),
    address: text(formData, "address"),
    hours: text(formData, "hours"),
    defaultSeoTitle: text(formData, "defaultSeoTitle"),
    defaultSeoDescription: text(formData, "defaultSeoDescription"),
    logoMediaId: uuidOrNull(text(formData, "logoMediaId")),
    socialImageMediaId: uuidOrNull(text(formData, "socialImageMediaId")),
    updatedAt: new Date(),
  }).where(eq(siteSettings.id, "site"));
  await audit(session.user.id, "site_settings.updated", "site_settings", null);
  revalidatePublic();
  revalidatePath("/admin/settings");
}

export async function upsertSocialLink(formData: FormData) {
  const session = await requireAdmin("editor");
  const id = text(formData, "id");
  const values = {
    platform: text(formData, "platform"),
    label: text(formData, "label"),
    url: text(formData, "url"),
    position: integer(formData, "position"),
    active: checked(formData, "active"),
    updatedAt: new Date(),
  };
  const db = getDb();
  if (id) await db.update(socialLinks).set(values).where(eq(socialLinks.id, id));
  else await db.insert(socialLinks).values(values);
  await audit(session.user.id, id ? "social_link.updated" : "social_link.created", "social_link", id || null, values);
  revalidatePublic();
  revalidatePath("/admin/settings");
}

export async function upsertContactTopic(formData: FormData) {
  const session = await requireAdmin("editor");
  const id = text(formData, "id");
  const name = text(formData, "name");
  const values = {
    name,
    slug: slugify(text(formData, "slug") || name),
    saasType: text(formData, "saasType"),
    position: integer(formData, "position"),
    active: checked(formData, "active"),
    updatedAt: new Date(),
  };
  const db = getDb();
  if (id) await db.update(contactTopics).set(values).where(eq(contactTopics.id, id));
  else await db.insert(contactTopics).values(values);
  await audit(session.user.id, id ? "contact_topic.updated" : "contact_topic.created", "contact_topic", id || null, values);
  revalidatePublic();
  revalidatePath("/admin/settings");
}

export async function updateContactStatus(formData: FormData) {
  const session = await requireAdmin("editor");
  const id = text(formData, "id");
  const status = text(formData, "status") as "new" | "processing" | "exported" | "spam" | "archived";
  await getDb().update(contactSubmissions).set({ status }).where(eq(contactSubmissions.id, id));
  await audit(session.user.id, "contact.status_changed", "contact_submission", id, { status });
  revalidatePath("/admin/contacts");
}

export async function retryContactDelivery(formData: FormData) {
  const session = await requireAdmin("admin");
  const outboxId = text(formData, "outboxId");
  await getDb().update(integrationOutbox).set({ status: "pending", updatedAt: new Date() }).where(eq(integrationOutbox.id, outboxId));
  const result = await dispatchOutboxEvent(outboxId);
  await audit(session.user.id, "contact.integration_retried", "integration_outbox", outboxId, result);
  revalidatePath("/admin/contacts");
}

export async function uploadMedia(formData: FormData) {
  const session = await requireAdmin("editor");
  const file = formData.get("file");
  const altText = text(formData, "altText");
  if (!(file instanceof File) || file.size === 0) throw new Error("Selecione um arquivo.");
  if (!file.type.startsWith("image/")) throw new Error("A biblioteca de mídia aceita imagens neste estágio.");
  if (file.size > 12 * 1024 * 1024) throw new Error("Arquivo maior que 12 MB.");

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN não configurado. Upload real de mídia permanece bloqueado até o storage ser provisionado.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const image = sharp(buffer).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 });
  const output = await image.toBuffer({ resolveWithObject: true });
  const key = `media/${crypto.randomUUID()}.webp`;
  const blob = await put(key, output.data, { access: "public", addRandomSuffix: false, contentType: "image/webp" });

  const rows = await getDb().insert(mediaAssets).values({
    storageProvider: "vercel_blob",
    storageKey: key,
    url: blob.url,
    mimeType: "image/webp",
    byteSize: output.data.byteLength,
    width: output.info.width,
    height: output.info.height,
    altText,
    originalFilename: file.name,
    createdBy: session.user.id,
    updatedBy: session.user.id,
  }).returning({ id: mediaAssets.id });

  await audit(session.user.id, "media.uploaded", "media_asset", rows[0].id, { originalFilename: file.name, byteSize: output.data.byteLength });
  revalidatePath("/admin/media");
}

export async function archiveMedia(formData: FormData) {
  const session = await requireAdmin("admin");
  const id = text(formData, "id");
  await getDb().update(mediaAssets).set({ status: "archived", updatedBy: session.user.id, updatedAt: new Date() }).where(eq(mediaAssets.id, id));
  await audit(session.user.id, "media.archived", "media_asset", id);
  revalidatePath("/admin/media");
}

export async function createAdminUser(formData: FormData) {
  const session = await requireAdmin("owner");
  const email = text(formData, "email").toLowerCase();
  const name = text(formData, "name");
  const role = text(formData, "role") as "owner" | "admin" | "editor" | "viewer";
  const temporaryPassword = text(formData, "temporaryPassword");
  const passwordHash = await hashPassword(temporaryPassword);

  const rows = await getDb().insert(adminUsers).values({
    email,
    name,
    role,
    passwordHash,
    isActive: true,
    mustChangePassword: true,
  }).returning({ id: adminUsers.id });
  await audit(session.user.id, "admin_user.created", "admin_user", rows[0].id, { email, role });
  revalidatePath("/admin/users");
}

export async function updateAdminUser(formData: FormData) {
  const session = await requireAdmin("owner");
  const id = text(formData, "id");
  if (id === session.user.id && !checked(formData, "isActive")) throw new Error("O usuário atual não pode desativar a própria conta.");
  const role = text(formData, "role") as "owner" | "admin" | "editor" | "viewer";
  if (id === session.user.id && role !== "owner") throw new Error("O owner atual não pode remover o próprio papel de owner.");
  await getDb().update(adminUsers).set({
    name: text(formData, "name"),
    role,
    isActive: checked(formData, "isActive"),
    updatedAt: new Date(),
  }).where(eq(adminUsers.id, id));
  await audit(session.user.id, "admin_user.updated", "admin_user", id, { role });
  revalidatePath("/admin/users");
}

export async function resetAdminPassword(formData: FormData) {
  const session = await requireAdmin("owner");
  const id = text(formData, "id");
  const temporaryPassword = text(formData, "temporaryPassword");
  const passwordHash = await hashPassword(temporaryPassword);
  const db = getDb();
  await db.update(adminUsers).set({
    passwordHash,
    mustChangePassword: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    updatedAt: new Date(),
  }).where(eq(adminUsers.id, id));
  await db.delete(adminSessions).where(eq(adminSessions.userId, id));
  await audit(session.user.id, "admin_user.password_reset", "admin_user", id);
  revalidatePath("/admin/users");
}
