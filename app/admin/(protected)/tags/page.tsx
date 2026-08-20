import { asc } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { tags } from "../../../../lib/db/schema";
import { deleteTag, upsertTag } from "../../actions";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const rows = await getDb().select().from(tags).orderBy(asc(tags.name));
  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">EDITORIAL</p><h1>Tags</h1><p>Vocabulário de tags para organização e expansão editorial.</p></div></header>
      <section className="adminPanel adminStack">{rows.map((tag) => <form action={upsertTag} className="adminInlineForm" key={tag.id}><input type="hidden" name="id" value={tag.id}/><input name="name" defaultValue={tag.name} required/><input name="slug" defaultValue={tag.slug} required/><span/><span/><span/><span/><button className="adminButton" type="submit">Salvar</button><button className="adminButton danger" formAction={deleteTag} type="submit">Excluir</button></form>)}</section>
      <section className="adminPanel"><h2>Nova tag</h2><form action={upsertTag} className="adminForm"><div className="adminFormGrid"><label>Nome<input name="name" required/></label><label>Slug<input name="slug"/></label></div><button className="adminButton primary" type="submit">Criar tag</button></form></section>
    </div>
  );
}
