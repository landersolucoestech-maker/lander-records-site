import { asc } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { postCategories } from "../../../../lib/db/schema";
import { deletePostCategory, upsertPostCategory } from "../../actions";

export const dynamic = "force-dynamic";

export default async function PostCategoriesPage() {
  const rows = await getDb().select().from(postCategories).orderBy(asc(postCategories.position), asc(postCategories.name));
  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">EDITORIAL</p><h1>Categorias de posts</h1><p>Taxonomia editorial e filtros públicos do Portal.</p></div></header>
      <section className="adminPanel adminStack">
        {rows.map((category) => <form action={upsertPostCategory} className="adminInlineForm" key={category.id}><input type="hidden" name="id" value={category.id}/><input name="name" defaultValue={category.name} required/><input name="slug" defaultValue={category.slug} required/><input name="position" type="number" defaultValue={category.position}/><label className="adminCheck"><input name="active" type="checkbox" defaultChecked={category.active}/> Ativa</label><label className="adminCheck"><input name="showAsFilter" type="checkbox" defaultChecked={category.showAsFilter}/> Filtro</label><span/><button className="adminButton" type="submit">Salvar</button></form>)}
      </section>
      <section className="adminPanel"><h2>Exclusão segura</h2><div className="adminActions">{rows.map((category) => <form action={deletePostCategory} key={category.id}><input type="hidden" name="id" value={category.id}/><button className="adminButton danger" type="submit">Excluir {category.name}</button></form>)}</div></section>
      <section className="adminPanel"><h2>Nova categoria</h2><form action={upsertPostCategory} className="adminForm"><div className="adminFormGrid"><label>Nome<input name="name" required/></label><label>Slug<input name="slug"/></label><label>Ordem<input name="position" type="number" defaultValue={0}/></label><label className="adminCheck"><input name="active" type="checkbox" defaultChecked/> Ativa</label><label className="adminCheck"><input name="showAsFilter" type="checkbox" defaultChecked/> Exibir como filtro</label></div><button className="adminButton primary" type="submit">Criar categoria</button></form></section>
    </div>
  );
}
