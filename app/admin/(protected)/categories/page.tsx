import { asc } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { artistCategories, postCategories } from "../../../../lib/db/schema";
import CategoryManager from "./CategoryManager";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const db = getDb();
  const [artists, news] = await Promise.all([
    db.select().from(artistCategories).orderBy(asc(artistCategories.position), asc(artistCategories.name)),
    db.select().from(postCategories).orderBy(asc(postCategories.position), asc(postCategories.name)),
  ]);

  return <div className="adminDashboard">
    <header className="adminDashboardHeading">
      <div><h1>Categorias</h1><p>Organize as taxonomias de artistas e notícias com as mesmas regras visuais e operacionais do Dashboard.</p></div>
    </header>
    <CategoryManager artistCategories={artists} postCategories={news} />
  </div>;
}
