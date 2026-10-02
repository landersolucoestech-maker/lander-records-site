"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requirePersistentAdmin } from "../../lib/auth";
import { getDb } from "../../lib/db";
import { pageSectionBindings, sectionDefinitions } from "../../lib/db/page-management-schema";
import { pageSections, pages } from "../../lib/db/schema";
import { slugify } from "../../lib/slug";
import { sitePageContract } from "./(protected)/pages/site-page-contract";

function text(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function uuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

function assertMutablePageStructure(page: { key: string }) {
  if (sitePageContract(page.key)) {
    throw new Error("A estrutura desta página é canônica e não pode ser criada, anexada, removida ou excluída arbitrariamente.");
  }
}

function revalidatePagePaths(slugs: string[]) {
  revalidatePath("/admin/pages");
  revalidatePath("/admin");
  revalidatePath("/sitemap.xml");
  for (const slug of new Set(slugs.filter(Boolean))) revalidatePath(slug ? `/${slug}` : "/");
}

export async function deletePageAction(formData: FormData) {
  const session = await requirePersistentAdmin("admin");
  const id = uuid(text(formData, "id"));
  if (!id) throw new Error("Página inválida.");
  const db = getDb();
  const current = (await db.select().from(pages).where(eq(pages.id, id)).limit(1))[0];
  if (!current) throw new Error("Página não encontrada.");
  assertMutablePageStructure(current);
  await db.delete(pages).where(eq(pages.id, id));
  await audit(session.user.id, "page.deleted", "page", id, { title: current.title, key: current.key, slug: current.slug });
  revalidatePagePaths([current.slug]);
  redirect("/admin/pages?deleted=1");
}

export async function createPageSectionAction(formData: FormData) {
  const session = await requirePersistentAdmin("editor");
  const pageId = uuid(text(formData, "pageId"));
  const name = text(formData, "name");
  const key = slugify(text(formData, "identifier") || name);
  if (!pageId || !name || !key) throw new Error("Página, nome e identificador da seção são obrigatórios.");

  const db = getDb();
  const page = (await db.select().from(pages).where(eq(pages.id, pageId)).limit(1))[0];
  if (!page) throw new Error("Página não encontrada.");
  assertMutablePageStructure(page);

  const existing = await db.select({ id: pageSections.id }).from(pageSections).where(and(eq(pageSections.pageId, pageId), eq(pageSections.sectionKey, key))).limit(1);
  if (existing.length) throw new Error("Já existe uma seção com esse identificador nesta página.");

  const created = await db.transaction(async (tx) => {
    let definition = (await tx.select({ id: sectionDefinitions.id, type: sectionDefinitions.type }).from(sectionDefinitions).where(eq(sectionDefinitions.key, key)).limit(1))[0];
    if (!definition) {
      const inserted = await tx.insert(sectionDefinitions).values({
        key,
        name,
        type: "content",
        description: `Seção ${name} criada pelo módulo Páginas.`,
        active: true,
      }).onConflictDoNothing({ target: sectionDefinitions.key }).returning({ id: sectionDefinitions.id, type: sectionDefinitions.type });
      definition = inserted[0] || (await tx.select({ id: sectionDefinitions.id, type: sectionDefinitions.type }).from(sectionDefinitions).where(eq(sectionDefinitions.key, key)).limit(1))[0];
    }
    if (!definition) throw new Error("Não foi possível registrar a definição da seção.");

    const positions = await tx.select({ position: pageSections.position }).from(pageSections).where(eq(pageSections.pageId, pageId)).orderBy(asc(pageSections.position));
    const position = positions.length ? Math.max(...positions.map((item) => item.position)) + 1 : 1;
    const rows = await tx.insert(pageSections).values({
      pageId,
      sectionKey: key,
      type: definition.type,
      title: name,
      position,
      enabled: true,
    }).returning({ id: pageSections.id });
    await tx.insert(pageSectionBindings).values({ pageSectionId: rows[0].id, definitionId: definition.id });
    return { id: rows[0].id, definitionId: definition.id };
  });

  await audit(session.user.id, "page.section_created", "page_section", created.id, { pageId, definitionId: created.definitionId, key, name });
  revalidatePagePaths([page.slug]);
  revalidatePath(`/admin/pages/${pageId}`);
  redirect(`/admin/pages/${pageId}?section=${encodeURIComponent(created.id)}`);
}

export async function attachSectionAction(formData: FormData) {
  const session = await requirePersistentAdmin("editor");
  const pageId = uuid(text(formData, "pageId"));
  const definitionId = uuid(text(formData, "definitionId"));
  if (!pageId || !definitionId) throw new Error("Página e seção são obrigatórias.");
  const db = getDb();
  const [page, definition] = await Promise.all([
    db.select().from(pages).where(eq(pages.id, pageId)).limit(1),
    db.select().from(sectionDefinitions).where(and(eq(sectionDefinitions.id, definitionId), eq(sectionDefinitions.active, true))).limit(1),
  ]);
  if (!page[0] || !definition[0]) throw new Error("Página ou seção não encontrada.");
  assertMutablePageStructure(page[0]);
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
  const session = await requirePersistentAdmin("admin");
  const pageId = uuid(text(formData, "pageId"));
  const sectionId = uuid(text(formData, "sectionId"));
  if (!pageId || !sectionId) throw new Error("Seção inválida.");
  const db = getDb();
  const page = (await db.select().from(pages).where(eq(pages.id, pageId)).limit(1))[0];
  const section = (await db.select().from(pageSections).where(and(eq(pageSections.id, sectionId), eq(pageSections.pageId, pageId))).limit(1))[0];
  if (!page || !section) throw new Error("Página ou seção não encontrada.");
  assertMutablePageStructure(page);
  await db.delete(pageSections).where(eq(pageSections.id, sectionId));
  await audit(session.user.id, "page.section_detached", "page_section", sectionId, { pageId, key: section.sectionKey });
  revalidatePagePaths([page.slug]);
  revalidatePath(`/admin/pages/${pageId}`);
}