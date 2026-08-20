import Link from "next/link";
import { createPageAction } from "../../../page-actions";

export default function NewPagePage() {
  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">SITE</p><h1>Nova página</h1><p>Crie a página primeiro; depois vincule seções existentes do catálogo do CMS.</p></div><Link className="adminButton" href="/admin/pages">Voltar</Link></header>
      <section className="adminPanel">
        <form action={createPageAction} className="adminForm">
          <div className="adminFormGrid">
            <label>Nome da página<input name="title" required maxLength={180}/></label>
            <label>Rota<input name="slug" placeholder="nova-pagina"/><span style={{fontSize:10,fontWeight:400,color:"#69717e"}}>Use vazio apenas para a Home.</span></label>
            <label>Identificador interno<input name="key" placeholder="gerado pelo nome se vazio"/></label>
            <label className="adminCheck"><input name="enabled" type="checkbox" defaultChecked/> Página ativa</label>
            <label>Título SEO<input name="seoTitle" maxLength={180}/></label>
            <label className="full">Meta description<textarea name="seoDescription"/></label>
          </div>
          <button className="adminButton primary" type="submit">Criar página</button>
        </form>
      </section>
    </div>
  );
}
