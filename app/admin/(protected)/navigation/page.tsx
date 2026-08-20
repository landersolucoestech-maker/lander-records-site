import { asc } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { navigationItems } from "../../../../lib/db/schema";
import { deleteNavigationItem, upsertNavigationItem } from "../../actions";

export const dynamic = "force-dynamic";

export default async function NavigationPage() {
  const rows = await getDb().select().from(navigationItems).orderBy(asc(navigationItems.menuKey), asc(navigationItems.position));
  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">NAVEGAÇÃO</p><h1>Menus</h1><p>Itens internos/externos, ordem, estado, nova aba e estrutura de submenu por parent.</p></div></header>
      <section className="adminPanel adminStack">
        {rows.map((item) => <form action={upsertNavigationItem} className="adminInlineForm" key={item.id}>
          <input type="hidden" name="id" value={item.id}/>
          <select name="menuKey" defaultValue={item.menuKey}><option value="primary">Principal</option><option value="footer">Footer</option></select>
          <input name="label" defaultValue={item.label} aria-label="Nome"/>
          <input name="url" defaultValue={item.url} aria-label="URL"/>
          <input name="position" type="number" defaultValue={item.position} aria-label="Ordem"/>
          <label className="adminCheck"><input name="enabled" type="checkbox" defaultChecked={item.enabled}/> Ativo</label>
          <label className="adminCheck"><input name="newTab" type="checkbox" defaultChecked={item.newTab}/> Nova aba</label>
          <button className="adminButton" type="submit">Salvar</button>
          <input type="hidden" name="linkType" value={item.linkType}/><input type="hidden" name="parentId" value={item.parentId || ""}/>
        </form>)}
      </section>
      <section className="adminPanel"><h2>Novo item</h2><form action={upsertNavigationItem} className="adminForm"><div className="adminFormGrid"><label>Menu<select name="menuKey" defaultValue="primary"><option value="primary">Principal</option><option value="footer">Footer</option></select></label><label>Nome<input name="label" required/></label><label>URL<input name="url" required placeholder="/artistas ou https://..."/></label><label>Tipo<select name="linkType" defaultValue="internal"><option value="internal">Interno</option><option value="external">Externo</option></select></label><label>Item pai<select name="parentId" defaultValue=""><option value="">Sem pai</option>{rows.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label>Ordem<input name="position" type="number" defaultValue={0}/></label><label className="adminCheck"><input name="enabled" type="checkbox" defaultChecked/> Ativo</label><label className="adminCheck"><input name="newTab" type="checkbox"/> Abrir em nova aba</label></div><button className="adminButton primary" type="submit">Criar item</button></form></section>
      <section className="adminPanel"><h2>Excluir</h2><div className="adminActions">{rows.map((item) => <form action={deleteNavigationItem} key={item.id}><input type="hidden" name="id" value={item.id}/><button className="adminButton danger" type="submit">Excluir {item.label}</button></form>)}</div></section>
    </div>
  );
}
