"use server";

import { and, asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { audit } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { deleteMedia, uploadMedia as uploadStoredMedia } from "../../../../lib/storage";
import { mediaAssets, mediaKitItems, mediaKitSections, mediaKitSettings } from "../../../../lib/db/schema";
import { MEDIA_FIT_VALUES, MEDIA_POSITION_VALUES } from "./media-kit-contract";
import { requireMediaKitMutationAdmin } from "./preview-auth";

const SECTION_TYPES = new Set(["cover", "editorial", "metrics", "audience", "cards", "application", "artists", "contact", "custom"]);
const THEMES = new Set(["light", "dark"]);
const ITEM_KINDS = new Set(["metric", "card", "bullet", "contact", "text", "release"]);
const SOURCE_KEYS = new Set(["static", "artists_total", "releases_total", "posts_total", "media_total", "contact_email", "contact_phone", "location", "instagram", "website"]);
const ICONS = new Set(["activity", "artists", "calendar", "chart", "document", "external", "mail", "media", "pages", "plus", "posts", "smartphone", "target", "users"]);
const AUDIENCE_GROUPS = new Set(["gender", "age", "interest", "city"]);
const MEDIA_FITS = new Set<string>(MEDIA_FIT_VALUES);
const MEDIA_POSITIONS = new Set<string>(MEDIA_POSITION_VALUES);

function text(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function checked(formData: FormData, name: string) {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

function integer(formData: FormData, name: string, fallback = 0) {
  const raw = text(formData, name);
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < 0 || value > 9999) throw new Error("Posição inválida.");
  return value;
}

function uuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

function requiredUuid(formData: FormData, name: string, label: string) {
  const value = uuid(text(formData, name));
  if (!value) throw new Error(label + " inválido.");
  return value;
}

function enumValue(formData: FormData, name: string, allowed: Set<string>, fallback: string) {
  const value = text(formData, name) || fallback;
  if (!allowed.has(value)) throw new Error("Valor inválido para " + name + ".");
  return value;
}

function destination(formData: FormData, name: string) {
  const value = text(formData, name);
  if (!value) return "";
  if (value.startsWith("/") || /^https?:\/\//i.test(value) || /^(mailto|tel):/i.test(value)) return value;
  throw new Error("Destino inválido. Use URL completa, rota interna, mailto: ou tel:.");
}

async function selectedMediaId(formData: FormData, name: string) {
  const raw = text(formData, name);
  if (!raw) return null;
  const id = uuid(raw);
  if (!id) throw new Error("Mídia inválida.");
  const row = (await getDb()
    .select({ id: mediaAssets.id, mimeType: mediaAssets.mimeType })
    .from(mediaAssets)
    .where(and(eq(mediaAssets.id, id), eq(mediaAssets.status, "active")))
    .limit(1))[0];
  if (!row) throw new Error("Mídia ativa não encontrada.");
  if (!row.mimeType.startsWith("image/")) throw new Error("O Mídia Kit aceita apenas imagens.");
  return row.id;
}

type MediaKitMutationSession = Awaited<ReturnType<typeof requireMediaKitMutationAdmin>>;

async function resolveMediaInput(formData: FormData, session: MediaKitMutationSession) {
  const file = formData.get("imageFile");
  if (!(file instanceof File) || file.size === 0) {
    return selectedMediaId(formData, "mediaId");
  }

  if (!file.type.startsWith("image/")) throw new Error("Selecione um arquivo de imagem.");
  if (file.size > 12 * 1024 * 1024) throw new Error("Imagem maior que 12 MB.");

  const fallbackAlt = text(formData, "title") || text(formData, "label") || "Imagem do Mídia Kit";
  const altText = text(formData, "imageAltText") || fallbackAlt;
  if (!altText || altText.length > 500) throw new Error("Texto alternativo da imagem inválido.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const output = await sharp(buffer)
    .rotate()
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84 })
    .toBuffer({ resolveWithObject: true });

  const key = `media-kit/${crypto.randomUUID()}.webp`;
  const isDisposablePreview = session.source === "development-auth-bypass";
  let storageProvider = "supabase_storage";
  let storageKey = key;
  let url = "";
  let storedRemotely = false;

  if (isDisposablePreview) {
    storageProvider = "preview_inline";
    storageKey = `preview/${key}`;
    url = `data:image/webp;base64,${output.data.toString("base64")}`;
  } else {
    const stored = await uploadStoredMedia(key, output.data, "image/webp");
    storageKey = stored.key;
    url = stored.url;
    storedRemotely = true;
  }

  try {
    const rows = await getDb().insert(mediaAssets).values({
      storageProvider,
      storageKey,
      url,
      mimeType: "image/webp",
      byteSize: output.data.byteLength,
      width: output.info.width,
      height: output.info.height,
      altText,
      originalFilename: file.name,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    }).returning({ id: mediaAssets.id });

    await audit(session.user.id, "media_kit.image_uploaded", "media_asset", rows[0].id, {
      originalFilename: file.name,
      byteSize: output.data.byteLength,
      storageProvider,
    });
    revalidatePath("/admin/media");
    return rows[0].id;
  } catch (error) {
    if (storedRemotely) await deleteMedia(storageKey).catch(() => undefined);
    throw error;
  }
}

function compactRecord(entries: Array<[string, string | number]>) {
  return Object.fromEntries(entries.filter(([, value]) => value !== ""));
}

function sectionSettingsFromForm(formData: FormData) {
  const fit = text(formData, "mediaFit") || "cover";
  const position = text(formData, "mediaPosition") || "center";
  if (!MEDIA_FITS.has(fit)) throw new Error("Enquadramento de imagem inválido.");
  if (!MEDIA_POSITIONS.has(position)) throw new Error("Foco de imagem inválido.");
  return compactRecord([
    ["mediaFit", fit],
    ["mediaPosition", position],
    ["coverSideNote", text(formData, "coverSideNote")],
    ["mockupLabel", text(formData, "mockupLabel")],
    ["sideTitle", text(formData, "sideTitle")],
    ["sideCaption", text(formData, "sideCaption")],
    ["bannerTitle", text(formData, "bannerTitle")],
    ["bannerNote", text(formData, "bannerNote")],
    ["dataNote", text(formData, "dataNote")],
    ["footerNote", text(formData, "footerNote")],
    ["featuredLabel", text(formData, "featuredLabel")],
    ["quote", text(formData, "quote")],
    ["quoteAuthor", text(formData, "quoteAuthor")],
    ["nextStepsTitle", text(formData, "nextStepsTitle")],
    ["nextStepsBody", text(formData, "nextStepsBody")],
    ["closingSlogan", text(formData, "closingSlogan")],
  ]);
}

function itemMetadataFromForm(formData: FormData) {
  const group = text(formData, "audienceGroup");
  const percentageRaw = text(formData, "percentage");
  const entries: Array<[string, string | number]> = [];
  if (group) {
    if (!AUDIENCE_GROUPS.has(group)) throw new Error("Grupo de audiência inválido.");
    entries.push(["group", group]);
  }
  if (percentageRaw) {
    const percentage = Number.parseInt(percentageRaw, 10);
    if (!Number.isInteger(percentage) || percentage < 0 || percentage > 100) throw new Error("Percentual deve estar entre 0 e 100.");
    entries.push(["percentage", percentage]);
  }
  return Object.fromEntries(entries);
}

function refresh() {
  revalidatePath("/admin/media-kit");
}

export async function updateMediaKitSettings(formData: FormData) {
  const session = await requireMediaKitMutationAdmin("editor");
  const documentTitle = text(formData, "documentTitle");
  const edition = text(formData, "edition");
  const footerWebsite = text(formData, "footerWebsite");
  if (!documentTitle || documentTitle.length > 180) throw new Error("Título do documento inválido.");
  if (!edition || edition.length > 80) throw new Error("Edição inválida.");

  const values = {
    documentTitle,
    edition,
    footerWebsite,
    showPageNumbers: checked(formData, "showPageNumbers"),
    updatedAt: new Date(),
  };
  await getDb().insert(mediaKitSettings).values({ id: "default", ...values }).onConflictDoUpdate({
    target: mediaKitSettings.id,
    set: values,
  });
  await audit(session.user.id, "media_kit.settings_updated", "media_kit_settings", null, values);
  refresh();
}

export async function createMediaKitSection(formData: FormData) {
  const session = await requireMediaKitMutationAdmin("editor");
  const type = enumValue(formData, "type", SECTION_TYPES, "custom");
  const theme = enumValue(formData, "theme", THEMES, "light");
  const title = text(formData, "title") || "Nova seção";
  const selectedMediaId = await resolveMediaInput(formData, session);
  const db = getDb();

  const created = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(2815202601)`);
    const existing = await tx.select({ position: mediaKitSections.position }).from(mediaKitSections).orderBy(asc(mediaKitSections.position));
    const position = existing.length ? Math.max(...existing.map((row) => row.position)) + 1 : 1;
    const rows = await tx.insert(mediaKitSections).values({
      type,
      theme,
      eyebrow: text(formData, "eyebrow"),
      title,
      subtitle: text(formData, "subtitle"),
      body: text(formData, "body"),
      ctaLabel: text(formData, "ctaLabel"),
      ctaUrl: destination(formData, "ctaUrl"),
      mediaId: selectedMediaId,
      position,
      enabled: true,
      settings: sectionSettingsFromForm(formData),
    }).returning({ id: mediaKitSections.id });
    return rows[0];
  });

  await audit(session.user.id, "media_kit.section_created", "media_kit_section", created.id, { type, title });
  refresh();
}

export async function updateMediaKitSection(formData: FormData) {
  const session = await requireMediaKitMutationAdmin("editor");
  const id = requiredUuid(formData, "id", "Seção");
  const type = enumValue(formData, "type", SECTION_TYPES, "custom");
  const theme = enumValue(formData, "theme", THEMES, "light");
  const values = {
    type,
    theme,
    eyebrow: text(formData, "eyebrow"),
    title: text(formData, "title"),
    subtitle: text(formData, "subtitle"),
    body: text(formData, "body"),
    ctaLabel: text(formData, "ctaLabel"),
    ctaUrl: destination(formData, "ctaUrl"),
    mediaId: await resolveMediaInput(formData, session),
    position: integer(formData, "position", 1),
    enabled: checked(formData, "enabled"),
    settings: sectionSettingsFromForm(formData),
    updatedAt: new Date(),
  };
  const db = getDb();
  const current = (await db.select({ id: mediaKitSections.id }).from(mediaKitSections).where(eq(mediaKitSections.id, id)).limit(1))[0];
  if (!current) throw new Error("Seção não encontrada.");
  await db.update(mediaKitSections).set(values).where(eq(mediaKitSections.id, id));
  await audit(session.user.id, "media_kit.section_updated", "media_kit_section", id, { type, title: values.title, position: values.position, enabled: values.enabled });
  refresh();
}

export async function deleteMediaKitSection(formData: FormData) {
  const session = await requireMediaKitMutationAdmin("editor");
  const id = requiredUuid(formData, "id", "Seção");
  const db = getDb();
  const current = (await db.select({ id: mediaKitSections.id, title: mediaKitSections.title }).from(mediaKitSections).where(eq(mediaKitSections.id, id)).limit(1))[0];
  if (!current) throw new Error("Seção não encontrada.");
  await db.delete(mediaKitSections).where(eq(mediaKitSections.id, id));
  await audit(session.user.id, "media_kit.section_deleted", "media_kit_section", id, { title: current.title });
  refresh();
}

export async function createMediaKitItem(formData: FormData) {
  const session = await requireMediaKitMutationAdmin("editor");
  const sectionId = requiredUuid(formData, "sectionId", "Seção");
  const kind = enumValue(formData, "kind", ITEM_KINDS, "card");
  const sourceKey = enumValue(formData, "sourceKey", SOURCE_KEYS, "static");
  const icon = enumValue(formData, "icon", ICONS, "document");
  const selectedMediaId = await resolveMediaInput(formData, session);
  const db = getDb();

  const created = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${sectionId})::bigint)`);
    const section = (await tx.select({ id: mediaKitSections.id }).from(mediaKitSections).where(eq(mediaKitSections.id, sectionId)).limit(1))[0];
    if (!section) throw new Error("Seção não encontrada.");
    const existing = await tx.select({ position: mediaKitItems.position }).from(mediaKitItems).where(eq(mediaKitItems.sectionId, sectionId)).orderBy(asc(mediaKitItems.position));
    const position = existing.length ? Math.max(...existing.map((row) => row.position)) + 1 : 1;
    const rows = await tx.insert(mediaKitItems).values({
      sectionId,
      kind,
      title: text(formData, "title"),
      subtitle: text(formData, "subtitle"),
      body: text(formData, "body"),
      label: text(formData, "label"),
      value: text(formData, "value"),
      url: destination(formData, "url"),
      sourceKey,
      icon,
      mediaId: selectedMediaId,
      position,
      enabled: true,
      metadata: itemMetadataFromForm(formData),
    }).returning({ id: mediaKitItems.id });
    return rows[0];
  });

  await audit(session.user.id, "media_kit.item_created", "media_kit_item", created.id, { sectionId, kind, sourceKey });
  refresh();
}

export async function updateMediaKitItem(formData: FormData) {
  const session = await requireMediaKitMutationAdmin("editor");
  const id = requiredUuid(formData, "id", "Item");
  const sectionId = requiredUuid(formData, "sectionId", "Seção");
  const kind = enumValue(formData, "kind", ITEM_KINDS, "card");
  const sourceKey = enumValue(formData, "sourceKey", SOURCE_KEYS, "static");
  const icon = enumValue(formData, "icon", ICONS, "document");
  const values = {
    kind,
    title: text(formData, "title"),
    subtitle: text(formData, "subtitle"),
    body: text(formData, "body"),
    label: text(formData, "label"),
    value: text(formData, "value"),
    url: destination(formData, "url"),
    sourceKey,
    icon,
    mediaId: await resolveMediaInput(formData, session),
    position: integer(formData, "position", 1),
    enabled: checked(formData, "enabled"),
    metadata: itemMetadataFromForm(formData),
    updatedAt: new Date(),
  };
  const db = getDb();
  const current = (await db.select({ id: mediaKitItems.id }).from(mediaKitItems).where(and(eq(mediaKitItems.id, id), eq(mediaKitItems.sectionId, sectionId))).limit(1))[0];
  if (!current) throw new Error("Item não encontrado.");
  await db.update(mediaKitItems).set(values).where(and(eq(mediaKitItems.id, id), eq(mediaKitItems.sectionId, sectionId)));
  await audit(session.user.id, "media_kit.item_updated", "media_kit_item", id, { sectionId, kind, sourceKey, position: values.position, enabled: values.enabled });
  refresh();
}

export async function deleteMediaKitItem(formData: FormData) {
  const session = await requireMediaKitMutationAdmin("editor");
  const id = requiredUuid(formData, "id", "Item");
  const sectionId = requiredUuid(formData, "sectionId", "Seção");
  const db = getDb();
  const current = (await db.select({ id: mediaKitItems.id, title: mediaKitItems.title }).from(mediaKitItems).where(and(eq(mediaKitItems.id, id), eq(mediaKitItems.sectionId, sectionId))).limit(1))[0];
  if (!current) throw new Error("Item não encontrado.");
  await db.delete(mediaKitItems).where(and(eq(mediaKitItems.id, id), eq(mediaKitItems.sectionId, sectionId)));
  await audit(session.user.id, "media_kit.item_deleted", "media_kit_item", id, { sectionId, title: current.title });
  refresh();
}
