"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requirePersistentAdmin } from "../../../../../lib/auth";
import { getDb } from "../../../../../lib/db";
import { mediaAssets, pageSections } from "../../../../../lib/db/schema";
import { uploadMedia as uploadStoredMedia } from "@/lib/storage";

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
  const rows = await getDb()
    .select()
    .from(pageSections)
    .where(and(eq(pageSections.id, sectionId), eq(pageSections.pageId, pageId)))
    .limit(1);
  const section = rows[0];
  if (!section) throw new Error("Seção não encontrada.");
  if (section.sectionKey !== "hero") throw new Error("Upload de mídia direta disponível somente para o Hero.");
  return section;
}

function refreshHero(pageId: string) {
  revalidatePath("/");
  revalidatePath(`/admin/pages/${pageId}`);
  revalidatePath("/admin/media");
}

function backToHero(pageId: string, sectionId: string) {
  redirect(`/admin/pages/${pageId}/?section=${encodeURIComponent(sectionId)}`);
}

export async function uploadPageSectionMedia(formData: FormData) {
  const session = await requirePersistentAdmin("editor");
  const pageId = text(formData, "pageId");
  const sectionId = text(formData, "sectionId");
  const section = await sectionForUpdate(sectionId, pageId);
  const upload = formData.get("file");

  if (!(upload instanceof File) || upload.size === 0) throw new Error("Selecione uma imagem ou vídeo para enviar.");
  if (!isHeroMediaMimeType(upload.type)) throw new Error("O Hero aceita somente arquivos de imagem ou vídeo.");
  if (upload.size > MAX_HERO_MEDIA_BYTES) throw new Error("O arquivo do Hero deve ter no máximo 50 MB.");

  const storageKey = `page-sections/${pageId}/${sectionId}/${randomUUID()}-${safeFilename(upload.name)}`;
  const stored = await uploadStoredMedia(storageKey, new Uint8Array(await upload.arrayBuffer()), upload.type);
  const altText = text(formData, "altText");
  const db = getDb();

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

  const mediaId = inserted[0]?.id;
  if (!mediaId) throw new Error("Não foi possível registrar a mídia enviada.");

  await db.update(pageSections).set({
    settings: { ...(section.settings || {}), mediaId },
    updatedAt: new Date(),
  }).where(eq(pageSections.id, sectionId));

  await audit(session.user.id, "page_section.hero_media_uploaded", "page_section", sectionId, {
    pageId,
    mediaId,
    mimeType: upload.type,
    filename: upload.name,
  });

  refreshHero(pageId);
  backToHero(pageId, sectionId);
}

export async function setPageSectionMedia(formData: FormData) {
  const session = await requirePersistentAdmin("editor");
  const pageId = text(formData, "pageId");
  const sectionId = text(formData, "sectionId");
  const mediaId = text(formData, "mediaId");
  const section = await sectionForUpdate(sectionId, pageId);

  if (!UUID_RE.test(mediaId)) throw new Error("Selecione uma mídia válida.");
  const db = getDb();
  const mediaRows = await db.select({ id: mediaAssets.id, mimeType: mediaAssets.mimeType })
    .from(mediaAssets)
    .where(and(eq(mediaAssets.id, mediaId), eq(mediaAssets.status, "active")))
    .limit(1);
  const media = mediaRows[0];
  if (!media || !isHeroMediaMimeType(media.mimeType)) throw new Error("A mídia selecionada precisa ser uma imagem ou vídeo ativo.");

  await db.update(pageSections).set({
    settings: { ...(section.settings || {}), mediaId },
    updatedAt: new Date(),
  }).where(eq(pageSections.id, sectionId));

  await audit(session.user.id, "page_section.hero_media_selected", "page_section", sectionId, { pageId, mediaId });
  refreshHero(pageId);
  backToHero(pageId, sectionId);
}

export async function removePageSectionMedia(formData: FormData) {
  const session = await requirePersistentAdmin("editor");
  const pageId = text(formData, "pageId");
  const sectionId = text(formData, "sectionId");
  const section = await sectionForUpdate(sectionId, pageId);
  const settings = { ...(section.settings || {}) };
  delete settings.mediaId;

  await getDb().update(pageSections).set({ settings, updatedAt: new Date() }).where(eq(pageSections.id, sectionId));
  await audit(session.user.id, "page_section.hero_media_removed", "page_section", sectionId, { pageId });
  refreshHero(pageId);
  backToHero(pageId, sectionId);
}
