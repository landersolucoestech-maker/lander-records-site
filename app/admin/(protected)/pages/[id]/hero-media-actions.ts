"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requirePersistentAdmin } from "../../../../../lib/auth";
import { getDb } from "../../../../../lib/db";
import { mediaAssets, pageSections, pages } from "../../../../../lib/db/schema";
import { deleteMedia as deleteStoredMedia, uploadMedia as uploadStoredMedia } from "@/lib/storage";
import { sitePageContract, siteSectionContract } from "../site-page-contract";

const MAX_HERO_MEDIA_BYTES = 50 * 1024 * 1024;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function text(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function safeFilename(name: string) {
  const sanitized = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return sanitized || "hero-media";
}

function isHeroMediaMimeType(mimeType: string) {
  return mimeType.startsWith("image/") || mimeType.startsWith("video/");
}

async function sectionForUpdate(sectionId: string, pageId: string) {
  if (!UUID_RE.test(sectionId) || !UUID_RE.test(pageId)) throw new Error("Seção inválida.");
  const db = getDb();
  const [page, section] = await Promise.all([
    db.select().from(pages).where(eq(pages.id, pageId)).limit(1).then((rows) => rows[0]),
    db.select().from(pageSections).where(and(eq(pageSections.id, sectionId), eq(pageSections.pageId, pageId))).limit(1).then((rows) => rows[0]),
  ]);
  if (!page || !section) throw new Error("Página ou seção não encontrada.");

  const pageContract = sitePageContract(page.key);
  const sectionContract = siteSectionContract(page.key, section.sectionKey);
  if (!pageContract || !sectionContract || sectionContract.media !== "section-image-video") {
    throw new Error("Esta seção não possui contrato público para mídia de fundo.");
  }
  return { page, pageContract, section, sectionContract };
}

function refreshSection(pageId: string, publicRoute: string) {
  revalidatePath(publicRoute);
  revalidatePath(`/admin/pages/${pageId}`);
  revalidatePath("/admin/media");
}

function backToSection(pageId: string, sectionId: string) {
  redirect(`/admin/pages/${pageId}?section=${encodeURIComponent(sectionId)}`);
}

export async function uploadPageSectionMedia(formData: FormData) {
  const session = await requirePersistentAdmin("editor");
  const pageId = text(formData, "pageId");
  const sectionId = text(formData, "sectionId");
  const context = await sectionForUpdate(sectionId, pageId);
  const upload = formData.get("file");

  if (!(upload instanceof File) || upload.size === 0) throw new Error("Selecione uma imagem ou vídeo para enviar.");
  if (!isHeroMediaMimeType(upload.type)) throw new Error("O Hero aceita somente arquivos de imagem ou vídeo.");
  if (upload.size > MAX_HERO_MEDIA_BYTES) throw new Error("O arquivo do Hero deve ter no máximo 50 MB.");

  const storageKey = `page-sections/${pageId}/${sectionId}/${randomUUID()}-${safeFilename(upload.name)}`;
  const stored = await uploadStoredMedia(storageKey, new Uint8Array(await upload.arrayBuffer()), upload.type);
  const altText = text(formData, "altText");
  const db = getDb();
  let mediaId = "";

  try {
    const inserted = await db.insert(mediaAssets).values({
      storageProvider: "supabase_storage",
      storageKey: stored.key,
      url: stored.url,
      mimeType: upload.type,
      byteSize: upload.size,
      altText,
      originalFilename: upload.name,
      status: "active",
      createdBy: session.user.id,
      updatedBy: session.user.id,
    }).returning({ id: mediaAssets.id });
    const insertedMediaId = inserted[0]?.id;
    if (!insertedMediaId) throw new Error("Não foi possível registrar a mídia enviada.");
    mediaId = insertedMediaId;
  } catch (error) {
    await deleteStoredMedia(stored.key).catch(() => undefined);
    throw error;
  }

  await db.update(pageSections).set({
    settings: { ...(context.section.settings || {}), mediaId },
    updatedAt: new Date(),
  }).where(and(eq(pageSections.id, context.section.id), eq(pageSections.pageId, context.page.id)));

  await audit(session.user.id, "page_section.hero_media_uploaded", "page_section", context.section.id, {
    pageId: context.page.id,
    pageKey: context.page.key,
    sectionKey: context.section.sectionKey,
    mediaId,
    mimeType: upload.type,
    filename: upload.name,
  });

  refreshSection(context.page.id, context.pageContract.route);
  backToSection(context.page.id, context.section.id);
}

export async function setPageSectionMedia(formData: FormData) {
  const session = await requirePersistentAdmin("editor");
  const pageId = text(formData, "pageId");
  const sectionId = text(formData, "sectionId");
  const mediaId = text(formData, "mediaId");
  const context = await sectionForUpdate(sectionId, pageId);

  if (!UUID_RE.test(mediaId)) throw new Error("Selecione uma mídia válida.");
  const db = getDb();
  const media = (await db.select({ id: mediaAssets.id, mimeType: mediaAssets.mimeType })
    .from(mediaAssets)
    .where(and(eq(mediaAssets.id, mediaId), eq(mediaAssets.status, "active")))
    .limit(1))[0];
  if (!media || !isHeroMediaMimeType(media.mimeType)) throw new Error("A mídia selecionada precisa ser uma imagem ou vídeo ativo.");

  await db.update(pageSections).set({
    settings: { ...(context.section.settings || {}), mediaId },
    updatedAt: new Date(),
  }).where(and(eq(pageSections.id, context.section.id), eq(pageSections.pageId, context.page.id)));

  await audit(session.user.id, "page_section.hero_media_selected", "page_section", context.section.id, {
    pageId: context.page.id,
    pageKey: context.page.key,
    sectionKey: context.section.sectionKey,
    mediaId,
  });
  refreshSection(context.page.id, context.pageContract.route);
  backToSection(context.page.id, context.section.id);
}

export async function removePageSectionMedia(formData: FormData) {
  const session = await requirePersistentAdmin("editor");
  const pageId = text(formData, "pageId");
  const sectionId = text(formData, "sectionId");
  const context = await sectionForUpdate(sectionId, pageId);
  const settings = { ...(context.section.settings || {}) };
  delete settings.mediaId;

  await getDb().update(pageSections).set({ settings, updatedAt: new Date() })
    .where(and(eq(pageSections.id, context.section.id), eq(pageSections.pageId, context.page.id)));
  await audit(session.user.id, "page_section.hero_media_removed", "page_section", context.section.id, {
    pageId: context.page.id,
    pageKey: context.page.key,
    sectionKey: context.section.sectionKey,
  });
  refreshSection(context.page.id, context.pageContract.route);
  backToSection(context.page.id, context.section.id);
}
