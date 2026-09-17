import { asc } from "drizzle-orm";
import { requireAdmin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { artistCategories, postCategories } from "../../../../lib/db/schema";
import CategoryManager from "./CategoryManager";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const session = await requireAdmin();
  const db = getDb();
  const [artists, news] = await Promise.all([
    db.select().from(artistCategories).orderBy(asc(artistCategories.position), asc(artistCategories.name)),
    db.select().from(postCategories).orderBy(asc(postCategories.position), asc(postCategories.name)),
  ]);

  const canEdit = session.source === "session" && session.user.role !== "viewer";
  const canDelete = session.source === "session" && (session.user.role === "admin" || session.user.role === "owner");
  return <CategoryManager artistCategories={artists} canDelete={canDelete} canEdit={canEdit} postCategories={news} />;
}
