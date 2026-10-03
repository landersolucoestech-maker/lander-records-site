"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { audit, requirePersistentAdmin } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { tags } from "../../../lib/db/schema";
import { slugify } from "../../../lib/slug";

const text = (formData: FormData, name: string) => String(formData.get(name) || "").trim();
const uuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;

export async function upsertTag(formData: FormData) {
  const session = await requirePersistentAdmin("editor");
  const id = uuid(text(formData, "id"));
  const name = text(formData, "name");
  const slug = slugify(text(formData, "slug") || name);
  if (!name || name.length > 120) throw new Error("Nome da tag inválido.");
  if (!slug || slug.length > 160) throw new Error("Slug da tag inválido.");
  if (id) {
    const rows = await getDb().update(tags).set({ name, slug, updatedAt: new Date() }).where(eq(tags.id, id)).returning({ id: tags.id });
    if (!rows[0]) throw new Error("Tag não encontrada.");
    await audit(session.user.id, "tag.updated", "tag", id, { slug });
  } else {
    const rows = await getDb().insert(tags).values({ name, slug }).returning({ id: tags.id });
    await audit(session.user.id, "tag.created", "tag", rows[0].id, { slug });
  }
  revalidatePath("/admin/tags");
}

export async function deleteTag(formData: FormData) {
  const session = await requirePersistentAdmin("admin");
  const id = uuid(text(formData, "id"));
  if (!id) throw new Error("Tag inválida.");
  const rows = await getDb().delete(tags).where(eq(tags.id, id)).returning({ id: tags.id });
  if (!rows[0]) throw new Error("Tag não encontrada.");
  await audit(session.user.id, "tag.deleted", "tag", id);
  revalidatePath("/admin/tags");
}
