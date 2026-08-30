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
  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">TAXONOMIA</p><h1>Categorias</h1><p>Um único módulo para categorias de Artistas e Notícias, mantendo regras e filtros públicos independentes.</p></div></header>
      <CategoryManager artistCategories={artists} postCategories={news} />
    </div>
  );
}
