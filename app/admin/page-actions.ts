"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requireAdmin } from "../../lib/auth";
import { getDb } from "../../lib/db";
import { pageSectionBindings, sectionDefinitions } from "../../lib/db/page-management-schema";
import { pageSections, pages } from "../../lib/db/schema";
import { slugify } from "../../lib/slug";

function text(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function checked(formData: FormData, name: string) {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

function uuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

function revalidatePagePaths(slugs: string[]) {
  revalidatePath("/admin/pages");
  revalidatePath("/admin");
  revalidatePath("/sitemap.xml");
  for (const slug of new Set(slugs.filter(Boolean))) revalidatePath(slug ? `/${slug}` : "/");
}

export async function createPageAction(formData: FormData) {
  const session = await requireAdmin("editor");
  const title = text(formData, "title");
  const rawRoute = text(formData, "slug").replace(/^\/+|\/+$/g, "");
  const key = slugify(text(formData, "key") || title);
  if (!title || !key) throw new Error("Nome da página é obrigatório.");

  const rows = await getDb().insert(pages).values({
    key,
    title,
    slug: rawRoute,
    enabled: checked(formData, "enabled"),
    seoTitle: text(formData, "seoTitle"),
    seoDescription: text(formData, "seoDescription"),
  }).returning({ id: pages.id });
  await audit(session.user.id, "page.created", "page", rows[0].id, { title, key, slug: rawRoute });
  revalidatePagePaths([rawRoute]);
  redirect(`/admin/pages/${rows[0].id}`);
}

export async function deletePageAction(formData: FormData) {
  const session = await requireAdmin("admin");
  const id = uuid(text(formData, "id"));
  if (!id) throw new Error("Página inválida.");
  const db = getDb();
  const current = (await db.select().from(pages).where(eq(pages.id, id)).limit(1))[0];
  if (!current) throw new Error("Página não encontrada.");
  await db.delete(pages).where(eq(pages.id, id));
  await audit(session.user.id, "page.deleted", "page", id, { title: current.title, key: current.key, slug: current.slug });
  revalidatePagePaths([current.slug]);
  redirect("/admin/pages?deleted=1");
}

export async function attachSectionAction(formData: FormData) {
  const session = await requireAdmin("editor");
  const pageId = uuid(text(formData, "pageId"));
  const definitionId = uuid(text(formData, "definitionId"));
  if (!pageId || !definitionId) throw new Error("Página e seção são obrigatórias.");
  const db = getDb();
  const [page, definition] = await Promise.all([
    db.select().from(pages).where(eq(pages.id, pageId)).limit(1),
    db.select().from(sectionDefinitions).where(and(eq(sectionDefinitions.id, definitionId), eq(sectionDefinitions.active, true))).limit(1),
  ]);
  if (!page[0] || !definition[0]) throw new Error("Página ou seção não encontrada.");
  const existing = await db.select({ id: pageSections.id }).from(pageSections).where(and(eq(pageSections.pageId, pageId), eq(pageSections.sectionKey, definition[0].key))).limit(1);
  if (existing.length) throw new Error("Essa seção já está vinculada à página.");
  const positions = await db.select({ position: pageSections.position }).from(pageSections).where(eq(pageSections.pageId, pageId)).orderBy(asc(pageSections.position));
  const position = positions.length ? Math.max(...positions.map((item) => item.position)) + 1 : 1;
  const rows = await db.insert(pageSections).values({
    pageId,
    sectionKey: definition[0].key,
    type: definition[0].type,
    position,
    enabled: true,
  }).returning({ id: pageSections.id });
  await db.insert(pageSectionBindings).values({ pageSectionId: rows[0].id, definitionId });
  await audit(session.user.id, "page.section_attached", "page_section", rows[0].id, { pageId, definitionId, key: definition[0].key });
  revalidatePagePaths([page[0].slug]);
  revalidatePath(`/admin/pages/${pageId}`);
}

export async function detachSectionAction(formData: FormData) {
  const session = await requireAdmin("admin");
  const pageId = uuid(text(formData, "pageId"));
  const sectionId = uuid(text(formData, "sectionId"));
  if (!pageId || !sectionId) throw new Error("Seção inválida.");
  const db = getDb();
  const page = (await db.select().from(pages).where(eq(pages.id, pageId)).limit(1))[0];
  const section = (await db.select().from(pageSections).where(and(eq(pageSections.id, sectionId), eq(pageSections.pageId, pageId))).limit(1))[0];
  if (!page || !section) throw new Error("Página ou seção não encontrada.");
  await db.delete(pageSections).where(eq(pageSections.id, sectionId));
  await audit(session.user.id, "page.section_detached", "page_section", sectionId, { pageId, key: section.sectionKey });
  revalidatePagePaths([page.slug]);
  revalidatePath(`/admin/pages/${pageId}`);
}
