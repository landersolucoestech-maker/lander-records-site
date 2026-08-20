"use server";

import { put } from "@vercel/blob";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { audit, requireAdmin } from "../../lib/auth";
import { getDb } from "../../lib/db";
import { postLinks, postProfiles } from "../../lib/db/news-management-schema";
import { mediaAssets, postTags, posts, slugRedirects } from "../../lib/db/schema";
import { slugify } from "../../lib/slug";

export type PostActionState = { ok: boolean; error?: string };

const socialPlatforms = ["facebook", "instagram", "youtube", "tiktok"] as const;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

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

function uuidList(formData: FormData, name: string) {
  return formData.getAll(name).map(String).map(uuidOrNull).filter((value): value is string => Boolean(value));
}

function parseDate(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Data da publicação inválida.");
  return date;
}

async function prepareImage(formData: FormData, fieldName: string, slug: string, kind: "cover" | "author") {
  const file = formData.get(fieldName);
  if (!(file instanceof File) || file.size === 0) return null;
  if (!file.type.startsWith("image/")) throw new Error("O arquivo enviado precisa ser uma imagem válida.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("A imagem enviada excede o limite de 12 MB.");
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("O armazenamento de mídia não está configurado para uploads.");

  const source = Buffer.from(await file.arrayBuffer());
  const output = await sharp(source).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer({ resolveWithObject: true });
  const key = `media/news/${slug}/${kind}-${crypto.randomUUID()}.webp`;
  const blob = await put(key, output.data, { access: "public", addRandomSuffix: false, contentType: "image/webp" });
  return {
    storageProvider: "vercel_blob" as const,
    storageKey: key,
    url: blob.url,
    mimeType: "image/webp",
    byteSize: output.info.size,
    width: output.info.width,
    height: output.info.height,
    originalFilename: file.name,
  };
}

function revalidatePostContent(slugs: string[]) {
  for (const path of ["/", "/noticias", "/sitemap.xml", "/admin", "/admin/posts"]) revalidatePath(path);
  for (const slug of new Set(slugs.filter(Boolean))) revalidatePath(`/noticias/${slug}`);
}

export async function savePostAction(_: PostActionState, formData: FormData): Promise<PostActionState> {
  const session = await requireAdmin("editor");
  const id = uuidOrNull(text(formData, "id"));
  const title = text(formData, "title");
  const slug = slugify(text(formData, "slug") || title);
  const status = text(formData, "status") || "draft";
  const categoryId = uuidOrNull(text(formData, "categoryId"));
  const authorName = text(formData, "authorName");
  const excerpt = text(formData, "excerpt");
  const contentMarkdown = text(formData, "contentMarkdown");

  if (!title || !slug) return { ok: false, error: "Título e slug são obrigatórios." };
  if (!authorName) return { ok: false, error: "Autor é obrigatório." };
  if (!categoryId) return { ok: false, error: "Categoria é obrigatória." };
  if (!["draft", "published", "archived"].includes(status)) return { ok: false, error: "Status inválido." };
  if (!contentMarkdown) return { ok: false, error: "Conteúdo é obrigatório." };

  let publishedAt: Date | null = null;
  try {
    publishedAt = parseDate(text(formData, "publishedAt"));
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Data inválida." };
  }
  if (status === "published" && !publishedAt) publishedAt = new Date();

  let coverUpload: Awaited<ReturnType<typeof prepareImage>> = null;
  let authorUpload: Awaited<ReturnType<typeof prepareImage>> = null;
  try {
    [coverUpload, authorUpload] = await Promise.all([
      prepareImage(formData, "coverMediaUpload", slug, "cover"),
      prepareImage(formData, "authorMediaUpload", slug, "author"),
    ]);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao processar as imagens." };
  }

  const db = getDb();
  let postId = id || "";
  let previousSlug = "";

  try {
    postId = await db.transaction(async (tx) => {
      let coverMediaId = uuidOrNull(text(formData, "coverMediaId"));
      let authorMediaId = uuidOrNull(text(formData, "authorMediaId"));
      if (coverUpload) {
        const rows = await tx.insert(mediaAssets).values({ ...coverUpload, altText: `${title} — imagem principal`, status: "active", createdBy: session.user.id, updatedBy: session.user.id }).returning({ id: mediaAssets.id });
        coverMediaId = rows[0].id;
      }
      if (authorUpload) {
        const rows = await tx.insert(mediaAssets).values({ ...authorUpload, altText: `${authorName} — autor`, status: "active", createdBy: session.user.id, updatedBy: session.user.id }).returning({ id: mediaAssets.id });
        authorMediaId = rows[0].id;
      }

      let resolvedId = id;
      if (resolvedId) {
        const current = (await tx.select().from(posts).where(eq(posts.id, resolvedId)).limit(1))[0];
        if (!current) throw new Error("Notícia não encontrada.");
        previousSlug = current.slug;
        await tx.update(posts).set({
          title,
          slug,
          excerpt,
          contentMarkdown,
          authorName,
          categoryId,
          coverMediaId,
          ogMediaId: coverMediaId,
          status: status as "draft" | "published" | "archived",
          featuredOnHome: checked(formData, "featuredOnHome"),
          homePosition: integer(formData, "homePosition"),
          publishedAt,
          scheduledAt: null,
          archivedAt: status === "archived" ? new Date() : null,
          seoTitle: text(formData, "seoTitle"),
          seoDescription: text(formData, "seoDescription"),
          canonicalUrl: text(formData, "canonicalUrl"),
          updatedBy: session.user.id,
          updatedAt: new Date(),
        }).where(eq(posts.id, resolvedId));
      } else {
        const inserted = await tx.insert(posts).values({
          title,
          slug,
          excerpt,
          contentMarkdown,
          authorName,
          categoryId,
          coverMediaId,
          ogMediaId: coverMediaId,
          status: status as "draft" | "published" | "archived",
          featuredOnHome: checked(formData, "featuredOnHome"),
          homePosition: integer(formData, "homePosition"),
          publishedAt,
          scheduledAt: null,
          archivedAt: status === "archived" ? new Date() : null,
          seoTitle: text(formData, "seoTitle"),
          seoDescription: text(formData, "seoDescription"),
          canonicalUrl: text(formData, "canonicalUrl"),
          createdBy: session.user.id,
          updatedBy: session.user.id,
        }).returning({ id: posts.id });
        resolvedId = inserted[0].id;
      }

      if (previousSlug && previousSlug !== slug) {
        await tx.insert(slugRedirects).values({ entityType: "post", oldSlug: previousSlug, newSlug: slug }).onConflictDoUpdate({
          target: [slugRedirects.entityType, slugRedirects.oldSlug],
          set: { newSlug: slug },
        });
      }

      await tx.insert(postProfiles).values({
        postId: resolvedId,
        authorMediaId,
        publicationLink: text(formData, "publicationLink") || `/noticias/${slug}`,
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: postProfiles.postId,
        set: { authorMediaId, publicationLink: text(formData, "publicationLink") || `/noticias/${slug}`, updatedAt: new Date() },
      });

      await tx.delete(postLinks).where(and(eq(postLinks.postId, resolvedId), inArray(postLinks.platform, socialPlatforms)));
      const links = socialPlatforms.map((platform) => ({ platform, url: text(formData, `link_${platform}`) })).filter((item) => item.url);
      if (links.length) await tx.insert(postLinks).values(links.map((item) => ({ postId: resolvedId!, platform: item.platform, url: item.url, updatedAt: new Date() })));

      const tagIds = uuidList(formData, "tagIds");
      await tx.delete(postTags).where(eq(postTags.postId, resolvedId));
      if (tagIds.length) await tx.insert(postTags).values(tagIds.map((tagId) => ({ postId: resolvedId!, tagId })));

      return resolvedId;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao salvar notícia.";
    if (/duplicate key|unique/i.test(message)) return { ok: false, error: "Já existe uma notícia com esse slug." };
    return { ok: false, error: message };
  }

  await audit(session.user.id, id ? "post.updated" : "post.created", "post", postId, { title, slug, status });
  revalidatePostContent([previousSlug, slug]);
  redirect(`/admin/posts/${postId}?saved=1`);
}

export async function deletePostAction(formData: FormData) {
  const session = await requireAdmin("admin");
  const id = uuidOrNull(text(formData, "id"));
  if (!id) throw new Error("Notícia inválida.");
  const db = getDb();
  const current = (await db.select({ slug: posts.slug, title: posts.title }).from(posts).where(eq(posts.id, id)).limit(1))[0];
  if (!current) throw new Error("Notícia não encontrada.");
  await db.delete(posts).where(eq(posts.id, id));
  await audit(session.user.id, "post.deleted", "post", id, { title: current.title, slug: current.slug });
  revalidatePostContent([current.slug]);
  redirect("/admin/posts?deleted=1");
}
