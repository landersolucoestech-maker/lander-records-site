import { asc } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { artistCategories } from "../../../../lib/db/schema";
import { deleteArtistCategory, upsertArtistCategory } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ArtistCategoriesPage() {
  const rows = await getDb().select().from(artistCategories).orderBy(asc(artistCategories.position), asc(artistCategories.name));
  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">TAXONOMIA</p><h1>Categorias de artistas</h1><p>Novas categorias entram automaticamente no filtro público quando ativas e marcadas para exibição.</p></div></header>
      <section className="adminPanel adminStack">
        {rows.map((category) => (
          <form action={upsertArtistCategory} className="adminInlineForm" key={category.id}>
            <input type="hidden" name="id" value={category.id} />
            <input name="name" defaultValue={category.name} aria-label="Nome" required />
            <input name="slug" defaultValue={category.slug} aria-label="Slug" required />
            <input name="description" defaultValue={category.description} aria-label="Descrição" />
            <input name="position" type="number" defaultValue={category.position} aria-label="Ordem" />
            <label className="adminCheck"><input name="active" type="checkbox" defaultChecked={category.active} /> Ativa</label>
            <label className="adminCheck"><input name="showAsFilter" type="checkbox" defaultChecked={category.showAsFilter} /> Filtro</label>
            <button className="adminButton" type="submit">Salvar</button>
          </form>
        ))}
      </section>
      <section className="adminPanel">
        <h2>Nova categoria</h2>
        <form action={upsertArtistCategory} className="adminForm">
          <div className="adminFormGrid">
            <label>Nome<input name="name" required placeholder="Trap" /></label>
            <label>Slug<input name="slug" placeholder="trap" /></label>
            <label>Descrição<input name="description" /></label>
            <label>Ordem<input name="position" type="number" defaultValue={0} /></label>
            <label className="adminCheck"><input name="active" type="checkbox" defaultChecked /> Ativa</label>
            <label className="adminCheck"><input name="showAsFilter" type="checkbox" defaultChecked /> Exibir como filtro público</label>
          </div>
          <button className="adminButton primary" type="submit">Criar categoria</button>
        </form>
      </section>
      <section className="adminPanel">
        <h2>Exclusão segura</h2>
        <p>Uma categoria só pode ser excluída depois de todas as associações com artistas serem removidas.</p>
        <div className="adminActions">{rows.map((category) => <form action={deleteArtistCategory} key={category.id}><input type="hidden" name="id" value={category.id}/><button className="adminButton danger" type="submit">Excluir {category.name}</button></form>)}</div>
      </section>
    </div>
  );
}
