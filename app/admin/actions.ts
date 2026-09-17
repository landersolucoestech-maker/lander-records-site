"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import {
  audit,
  destroyAdminSession,
  getAdminSession,
  hashPassword,
  requirePersistentAdmin,
  verifyPassword,
} from "../../lib/auth";
import { isAdminRole } from "../../lib/auth/policy";
import { getDb } from "../../lib/db";
import {
  adminSessions,
  adminUsers,
  artistCategories,
  artistCategoryRelations,
  contactTopics,
  mediaAssets,
  navigationItems,
  postCategories,
  posts,
  siteSettings,
  socialLinks,
} from "../../lib/db/schema";
import { normalizeExternalUrl } from "../../lib/integrations/identity";
import { slugify } from "../../lib/slug";
import { deleteMedia, uploadMedia as uploadStoredMedia } from "@/lib/storage";
import {
  addPageSectionItem as guardedAddPageSectionItem,
  deletePageSectionItem as guardedDeletePageSectionItem,
  updatePageSection as guardedUpdatePageSection,
  updatePageSectionItem as guardedUpdatePageSectionItem,
} from "./page-content-actions";
import {
  isNavigationLinkType,
  isNavigationMenuKey,
  navigationDeletionError,
  navigationDestinationError,
  navigationHierarchyError,
  normalizeNavigationNewTab,
} from "./navigation-contract";

function text(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
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

function requiredUuid(formData: FormData, name: string, label: string) {
  const value = uuidOrNull(text(formData, name));
  if (!value) throw new Error(`${label} inválido.`);
  return value;
}

function validAdminEmail(value: string) {
  return value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function assertAdminIdentity(name: string, email?: string) {
  if (!name || name.length > 180) throw new Error("Nome de usuário inválido.");
  if (email !== undefined && !validAdminEmail(email)) throw new Error("E-mail de usuário inválido.");
}

function revalidatePublic() {
  for (const path of ["/", "/artistas", "/noticias", "/sobre-nos", "/contato", "/politica-de-privacidade", "/termos-e-condicoes", "/sitemap.xml"]) revalidatePath(path);
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

export async function upsertArtistCategory(formData: FormData) {
  const session = await requirePersistentAdmin("editor");
  const idValue = text(formData, "id");
  const id = idValue ? uuidOrNull(idValue) : null;
  if (idValue && !id) throw new Error("Categoria de artista inválida.");
  const name = text(formData, "name");
  const slug = slugify(text(formData, "slug") || name);
  if (!name || !slug) throw new Error("Nome e slug da categoria são obrigatórios.");
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
  revalidatePath("/admin/categories");
}

export async function deleteArtistCategory(formData: FormData) {
  const session = await requirePersistentAdmin("admin");
  const id = requiredUuid(formData, "id", "Categoria de artista");
  const db = getDb();
  const relations = await db.select({ artistId: artistCategoryRelations.artistId }).from(artistCategoryRelations).where(eq(artistCategoryRelations.categoryId, id)).limit(1);
  if (relations.length) throw new Error("Não é possível excluir uma categoria associada a artistas. Desassocie primeiro.");
  await db.delete(artistCategories).where(eq(artistCategories.id, id));
  await audit(session.user.id, "artist_category.deleted", "artist_category", id);
  revalidatePublic();
  revalidatePath("/admin/categories");
}

export async function upsertPostCategory(formData: FormData) {
  const session = await requirePersistentAdmin("editor");
  const idValue = text(formData, "id");
  const id = idValue ? uuidOrNull(idValue) : null;
  if (idValue && !id) throw new Error("Categoria de notícia inválida.");
  const name = text(formData, "name");
  const slug = slugify(text(formData, "slug") || name);
  if (!name || !slug) throw new Error("Nome e slug da categoria são obrigatórios.");
  const values = {
    name,
    slug,
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
  revalidatePath("/admin/categories");
}

export async function deletePostCategory(formData: FormData) {
  const session = await requirePersistentAdmin("admin");
  const id = requiredUuid(formData, "id", "Categoria de notícia");
  const db = getDb();
  const usage = await db.select({ id: posts.id }).from(posts).where(eq(posts.categoryId, id)).limit(1);
  if (usage.length) throw new Error("Não é possível excluir uma categoria usada por publicações. Reclassifique os posts primeiro.");
  await db.delete(postCategories).where(eq(postCategories.id, id));
  await audit(session.user.id, "post_category.deleted", "post_category", id);
  revalidatePublic();
  revalidatePath("/admin/categories");
}

export async function updatePageSection(formData: FormData) {
  return guardedUpdatePageSection(formData);
}

export async function addPageSectionItem(formData: FormData) {
  return guardedAddPageSectionItem(formData);
}

export async function updatePageSectionItem(formData: FormData) {
  return guardedUpdatePageSectionItem(formData);
}

export async function deletePageSectionItem(formData: FormData) {
  return guardedDeletePageSectionItem(formData);
}

export async function upsertNavigationItem(formData: FormData) {
  const session = await requirePersistentAdmin("editor");
  const id = text(formData, "id");
  const menuKey = text(formData, "menuKey");
  const parentValue = text(formData, "parentId");
  const parentId = uuidOrNull(parentValue);
  const label = text(formData, "label");
  const url = text(formData, "url");
  const linkType = text(formData, "linkType");
  const positionValue = text(formData, "position");
  const position = Number(positionValue);
  const fail = (code: string): never => redirect(`/admin/navigation?error=${encodeURIComponent(code)}`);
  if (id && !uuidOrNull(id)) fail("invalid_item");
  if (!isNavigationMenuKey(menuKey)) fail("invalid_menu");
  if (!isNavigationLinkType(linkType)) fail("invalid_type");
  if (!label || label.length > 160) fail("invalid_label");
  if (!positionValue || !Number.isInteger(position) || position < 0 || position > 9999) fail("invalid_position");
  if (parentValue && !parentId) fail("invalid_hierarchy");
  const destinationError = navigationDestinationError(linkType as "internal" | "external", url);
  if (destinationError) fail(destinationError);
  const values = {
    menuKey,
    parentId,
    label,
    url,
    linkType,
    position,
    enabled: checked(formData, "enabled"),
    newTab: normalizeNavigationNewTab(linkType as "internal" | "external", checked(formData, "newTab")),
    updatedAt: new Date(),
  };
  const db = getDb();
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(1735289201)`);
    const current = id ? (await tx.select().from(navigationItems).where(eq(navigationItems.id, id)).limit(1))[0] : null;
    if (id && !current) return { error: "invalid_item" } as const;
    const child = id ? (await tx.select({ id: navigationItems.id }).from(navigationItems).where(eq(navigationItems.parentId, id)).limit(1))[0] : null;
    const parent = parentId ? (await tx.select().from(navigationItems).where(eq(navigationItems.id, parentId)).limit(1))[0] : null;
    const hierarchyError = navigationHierarchyError({
      currentMenuKey: current?.menuKey,
      hasChildren: Boolean(child),
      itemId: id,
      menuKey,
      parent: parent || null,
      parentId,
    });
    if (hierarchyError) return { error: hierarchyError } as const;
    if (id) {
      await tx.update(navigationItems).set(values).where(eq(navigationItems.id, id));
      return { id, operation: "updated" } as const;
    }
    const rows = await tx.insert(navigationItems).values(values).returning({ id: navigationItems.id });
    return { id: rows[0].id, operation: "created" } as const;
  });
  if ("error" in result && result.error) fail(result.error);
  await audit(session.user.id, `navigation.${result.operation}`, "navigation_item", result.id, values);
  revalidatePublic();
  revalidatePath("/admin/navigation");
  redirect("/admin/navigation?saved=1");
}

export async function deleteNavigationItem(formData: FormData) {
  const session = await requirePersistentAdmin("admin");
  const id = text(formData, "id");
  if (!uuidOrNull(id)) redirect("/admin/navigation?error=invalid_item");
  const db = getDb();
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(1735289201)`);
    const item = (await tx.select({ id: navigationItems.id, label: navigationItems.label }).from(navigationItems).where(eq(navigationItems.id, id)).limit(1))[0];
    if (!item) return { error: "invalid_item" } as const;
    const child = (await tx.select({ id: navigationItems.id }).from(navigationItems).where(eq(navigationItems.parentId, id)).limit(1))[0];
    const deletionError = navigationDeletionError(Boolean(child));
    if (deletionError) return { error: deletionError } as const;
    await tx.delete(navigationItems).where(eq(navigationItems.id, id));
    return { item } as const;
  });
  if ("error" in result) redirect(`/admin/navigation?error=${result.error}`);
  await audit(session.user.id, "navigation.deleted", "navigation_item", id, { label: result.item.label });
  revalidatePublic();
  revalidatePath("/admin/navigation");
  redirect("/admin/navigation?saved=deleted");
}

export async function updateSiteSettings(formData: FormData) {
  const session = await requirePersistentAdmin("admin");
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
  const session = await requirePersistentAdmin("editor");
  const idValue = text(formData, "id");
  const id = idValue ? uuidOrNull(idValue) : null;
  if (idValue && !id) throw new Error("Link social inválido.");
  const url = normalizeExternalUrl(text(formData, "url"));
  const values = {
    platform: text(formData, "platform"),
    label: text(formData, "label"),
    url,
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
  const session = await requirePersistentAdmin("editor");
  const idValue = text(formData, "id");
  const id = idValue ? uuidOrNull(idValue) : null;
  if (idValue && !id) throw new Error("Assunto de contato inválido.");
  const name = text(formData, "name");
  const slug = slugify(text(formData, "slug") || name);
  if (!name || !slug) throw new Error("Nome e slug do assunto são obrigatórios.");
  const values = {
    name,
    slug,
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

export async function uploadMedia(formData: FormData) {
  const session = await requirePersistentAdmin("editor");
  const file = formData.get("file");
  const altText = text(formData, "altText");
  if (!(file instanceof File) || file.size === 0) throw new Error("Selecione um arquivo.");
  if (!file.type.startsWith("image/")) throw new Error("A biblioteca de mídia aceita imagens neste estágio.");
  if (file.size > 12 * 1024 * 1024) throw new Error("Arquivo maior que 12 MB.");
  if (!altText || altText.length > 500) throw new Error("Texto alternativo inválido.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const image = sharp(buffer).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 });
  const output = await image.toBuffer({ resolveWithObject: true });
  const key = `site/${crypto.randomUUID()}.webp`;
  const stored = await uploadStoredMedia(key, output.data, "image/webp");
  let rows;
  try {
    rows = await getDb().insert(mediaAssets).values({
      storageProvider: "supabase_storage",
      storageKey: stored.key,
      url: stored.url,
      mimeType: "image/webp",
      byteSize: output.data.byteLength,
      width: output.info.width,
      height: output.info.height,
      altText,
      originalFilename: file.name,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    }).returning({ id: mediaAssets.id });
  } catch (error) {
    await deleteMedia(stored.key).catch(() => undefined);
    throw error;
  }

  await audit(session.user.id, "media.uploaded", "media_asset", rows[0].id, { originalFilename: file.name, byteSize: output.data.byteLength });
  revalidatePath("/admin/media");
}

export async function archiveMedia(formData: FormData) {
  const session = await requirePersistentAdmin("admin");
  const id = requiredUuid(formData, "id", "Mídia");
  await getDb().update(mediaAssets).set({ status: "archived", updatedBy: session.user.id, updatedAt: new Date() }).where(eq(mediaAssets.id, id));
  await audit(session.user.id, "media.archived", "media_asset", id);
  revalidatePath("/admin/media");
}

export async function createAdminUser(formData: FormData) {
  const session = await requirePersistentAdmin("owner");
  const email = text(formData, "email").toLowerCase();
  const name = text(formData, "name");
  const roleValue = text(formData, "role");
  if (!isAdminRole(roleValue)) throw new Error("Papel administrativo inválido.");
  assertAdminIdentity(name, email);
  const temporaryPassword = text(formData, "temporaryPassword");
  const passwordHash = await hashPassword(temporaryPassword);

  const rows = await getDb().insert(adminUsers).values({
    email,
    name,
    role: roleValue,
    passwordHash,
    isActive: true,
    mustChangePassword: true,
  }).returning({ id: adminUsers.id });
  await audit(session.user.id, "admin_user.created", "admin_user", rows[0].id, { email, role: roleValue });
  revalidatePath("/admin/users");
}

export async function updateAdminUser(formData: FormData) {
  const session = await requirePersistentAdmin("owner");
  const id = requiredUuid(formData, "id", "Usuário");
  const roleValue = text(formData, "role");
  if (!isAdminRole(roleValue)) throw new Error("Papel administrativo inválido.");
  const name = text(formData, "name");
  assertAdminIdentity(name);
  const isActive = checked(formData, "isActive");
  if (id === session.user.id && !isActive) throw new Error("O usuário atual não pode desativar a própria conta.");
  if (id === session.user.id && roleValue !== "owner") throw new Error("O proprietário atual não pode remover o próprio papel de proprietário.");
  const db = getDb();
  const current = (await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.id, id)).limit(1))[0];
  if (!current) throw new Error("Usuário não encontrado.");
  await db.update(adminUsers).set({
    name,
    role: roleValue,
    isActive,
    updatedAt: new Date(),
  }).where(eq(adminUsers.id, id));
  await audit(session.user.id, "admin_user.updated", "admin_user", id, { role: roleValue });
  revalidatePath("/admin/users");
}

export async function resetAdminPassword(formData: FormData) {
  const session = await requirePersistentAdmin("owner");
  const id = requiredUuid(formData, "id", "Usuário");
  const db = getDb();
  const current = (await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.id, id)).limit(1))[0];
  if (!current) throw new Error("Usuário não encontrado.");
  const temporaryPassword = text(formData, "temporaryPassword");
  const passwordHash = await hashPassword(temporaryPassword);
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
