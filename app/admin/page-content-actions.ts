"use server";

import { and, asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { audit, requirePersistentAdmin } from "../../lib/auth";
import { getDb } from "../../lib/db";
import { mediaAssets, pageSectionItems, pageSections, pages } from "../../lib/db/schema";
import { sitePageContract, siteSectionContract } from "./(protected)/pages/site-page-contract";
import {
  allowedItemFields,
  allowedSectionFields,
  assertItemCapacity,
  canCreateOrDeleteItems,
  canEditItem,
  normalizeCmsDestination,
} from "./page-content-contract";

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

function uuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

function revalidatePageContent(pageKey: string, pageId: string) {
  const contract = sitePageContract(pageKey);
  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${pageId}`);
  if (contract) revalidatePath(contract.route);
  revalidatePath("/sitemap.xml");
}

async function resolveSectionContext(pageIdValue: string, sectionIdValue: string) {
  const pageId = uuid(pageIdValue);
  const sectionId = uuid(sectionIdValue);
  if (!pageId || !sectionId) throw new Error("Página ou seção inválida.");

  const db = getDb();
  const [page, section] = await Promise.all([
    db.select().from(pages).where(eq(pages.id, pageId)).limit(1).then((rows) => rows[0]),
    db.select().from(pageSections).where(eq(pageSections.id, sectionId)).limit(1).then((rows) => rows[0]),
  ]);
  if (!page || !section || section.pageId !== page.id) throw new Error("Página ou seção não encontrada.");

  const pageContract = sitePageContract(page.key);
  const sectionContract = siteSectionContract(page.key, section.sectionKey);
  if (pageContract && !sectionContract) throw new Error("A seção não pertence ao contrato público desta página.");

  return { db, page, pageContract, section, sectionContract };
}

async function resolveItemContext(pageIdValue: string, itemIdValue: string) {
  const itemId = uuid(itemIdValue);
  if (!itemId) throw new Error("Item inválido.");
  const db = getDb();
  const item = (await db.select().from(pageSectionItems).where(eq(pageSectionItems.id, itemId)).limit(1))[0];
  if (!item) throw new Error("Item não encontrado.");
  const context = await resolveSectionContext(pageIdValue, item.sectionId);
  return { ...context, item };
}

async function validatedMediaId(rawValue: string, imageOnly: boolean) {
  if (!rawValue.trim()) return null;
  const mediaId = uuid(rawValue);
  if (!mediaId) throw new Error("Mídia inválida.");
  const media = (await getDb().select({ id: mediaAssets.id, mimeType: mediaAssets.mimeType })
    .from(mediaAssets)
    .where(and(eq(mediaAssets.id, mediaId), eq(mediaAssets.status, "active")))
    .limit(1))[0];
  if (!media) throw new Error("Mídia ativa não encontrada.");
  if (imageOnly && !media.mimeType.startsWith("image/")) throw new Error("Esta seção aceita somente imagens.");
  return media.id;
}

export async function updatePageSection(formData: FormData) {
  const session = await requirePersistentAdmin("editor");
  const id = text(formData, "id");
  const pageId = text(formData, "pageId");
  const context = await resolveSectionContext(pageId, id);
  const canonicalPage = Boolean(context.pageContract);
  const fields = allowedSectionFields(context.sectionContract, canonicalPage);

  const values = {
    ...(fields.includes("eyebrow") ? { eyebrow: text(formData, "eyebrow") } : {}),
    ...(fields.includes("title") ? { title: text(formData, "title") } : {}),
    ...(fields.includes("subtitle") ? { subtitle: text(formData, "subtitle") } : {}),
    ...(fields.includes("body") ? { body: text(formData, "body") } : {}),
    ...(!canonicalPage ? { position: Math.max(1, integer(formData, "position")) } : {}),
    enabled: checked(formData, "enabled"),
    updatedAt: new Date(),
  };

  await context.db.update(pageSections).set(values).where(and(eq(pageSections.id, context.section.id), eq(pageSections.pageId, context.page.id)));
  await audit(session.user.id, "page_section.updated", "page_section", context.section.id, {
    pageId: context.page.id,
    pageKey: context.page.key,
    sectionKey: context.section.sectionKey,
    allowedFields: fields,
  });
  revalidatePageContent(context.page.key, context.page.id);
}

export async function addPageSectionItem(formData: FormData) {
  const session = await requirePersistentAdmin("editor");
  const pageId = text(formData, "pageId");
  const sectionId = text(formData, "sectionId");
  const context = await resolveSectionContext(pageId, sectionId);
  const canonicalPage = Boolean(context.pageContract);
  const fields = allowedItemFields(context.sectionContract, canonicalPage);

  if (!canCreateOrDeleteItems(context.sectionContract, canonicalPage)) {
    throw new Error("Esta seção não permite criação de itens pelo CMS.");
  }

  const mediaId = canonicalPage
    ? null
    : await validatedMediaId(text(formData, "mediaId"), false);

  const created = await context.db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${context.section.id})::bigint)`);
    const currentItems = await tx.select({ position: pageSectionItems.position })
      .from(pageSectionItems)
      .where(eq(pageSectionItems.sectionId, context.section.id))
      .orderBy(asc(pageSectionItems.position));
    assertItemCapacity(context.sectionContract, canonicalPage, currentItems.length);
    const position = currentItems.length ? Math.max(...currentItems.map((item) => item.position)) + 1 : 1;
    const rows = await tx.insert(pageSectionItems).values({
      sectionId: context.section.id,
      itemKey: `item-${crypto.randomUUID()}`,
      ...(fields.includes("title") ? { title: text(formData, "title") } : {}),
      ...(fields.includes("subtitle") ? { subtitle: text(formData, "subtitle") } : {}),
      ...(fields.includes("body") ? { body: text(formData, "body") } : {}),
      ...(fields.includes("label") ? { label: text(formData, "label") } : {}),
      ...(fields.includes("url") ? { url: normalizeCmsDestination(text(formData, "url")) } : {}),
      ...(!canonicalPage ? { mediaId } : {}),
      position,
      enabled: true,
    }).returning({ id: pageSectionItems.id });
    return rows[0];
  });

  await audit(session.user.id, "page_section_item.created", "page_section_item", created.id, {
    pageId: context.page.id,
    sectionId: context.section.id,
    pageKey: context.page.key,
    sectionKey: context.section.sectionKey,
  });
  revalidatePageContent(context.page.key, context.page.id);
}

export async function updatePageSectionItem(formData: FormData) {
  const session = await requirePersistentAdmin("editor");
  const pageId = text(formData, "pageId");
  const itemId = text(formData, "id");
  const context = await resolveItemContext(pageId, itemId);
  const canonicalPage = Boolean(context.pageContract);
  if (!canEditItem(context.sectionContract, canonicalPage)) {
    throw new Error("Esta seção não possui itens editáveis pelo CMS.");
  }

  const fields = allowedItemFields(context.sectionContract, canonicalPage);
  const canEditMedia = !canonicalPage || context.sectionContract?.media === "item-image";
  const mediaId = canEditMedia
    ? await validatedMediaId(text(formData, "mediaId"), canonicalPage)
    : context.item.mediaId;

  const values = {
    ...(fields.includes("title") ? { title: text(formData, "title") } : {}),
    ...(fields.includes("subtitle") ? { subtitle: text(formData, "subtitle") } : {}),
    ...(fields.includes("body") ? { body: text(formData, "body") } : {}),
    ...(fields.includes("label") ? { label: text(formData, "label") } : {}),
    ...(fields.includes("url") ? { url: normalizeCmsDestination(text(formData, "url")) } : {}),
    ...(canEditMedia ? { mediaId } : {}),
    position: Math.max(1, integer(formData, "position")),
    enabled: checked(formData, "enabled"),
    updatedAt: new Date(),
  };

  await context.db.update(pageSectionItems).set(values).where(and(eq(pageSectionItems.id, context.item.id), eq(pageSectionItems.sectionId, context.section.id)));
  await audit(session.user.id, "page_section_item.updated", "page_section_item", context.item.id, {
    pageId: context.page.id,
    sectionId: context.section.id,
    pageKey: context.page.key,
    sectionKey: context.section.sectionKey,
    allowedFields: fields,
  });
  revalidatePageContent(context.page.key, context.page.id);
}

export async function deletePageSectionItem(formData: FormData) {
  const session = await requirePersistentAdmin("editor");
  const pageId = text(formData, "pageId");
  const itemId = text(formData, "id");
  const context = await resolveItemContext(pageId, itemId);
  const canonicalPage = Boolean(context.pageContract);
  if (!canCreateOrDeleteItems(context.sectionContract, canonicalPage)) {
    throw new Error("Esta seção não permite exclusão de itens pelo CMS.");
  }

  await context.db.delete(pageSectionItems).where(and(eq(pageSectionItems.id, context.item.id), eq(pageSectionItems.sectionId, context.section.id)));
  await audit(session.user.id, "page_section_item.deleted", "page_section_item", context.item.id, {
    pageId: context.page.id,
    sectionId: context.section.id,
    pageKey: context.page.key,
    sectionKey: context.section.sectionKey,
  });
  revalidatePageContent(context.page.key, context.page.id);
}
