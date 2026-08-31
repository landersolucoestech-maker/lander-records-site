import Link from "next/link";
import { requireAdmin } from "../../../../../lib/auth";
import { createPageAction } from "../../../page-actions";

export default async function NewPagePage() {
  await requireAdmin("editor");
  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">ESTRUTURA ADMINISTRATIVA</p><h1>Nova estrutura de página</h1><p>Este fluxo cria somente um registro no CMS. Ele não cria rota pública, template ou componente no frontend.</p></div><Link className="adminButton" href="/admin/pages">Voltar</Link></header>
      <section className="adminPanel">
        <form action={createPageAction} className="adminForm">
          <div className="adminFormGrid">
            <label>Nome da página<input name="title" required maxLength={180}/></label>
            <label>Slug cadastrado<input name="slug" placeholder="nova-estrutura"/><span style={{fontSize:10,fontWeight:400,color:"#69717e"}}>Metadado administrativo; não cria uma rota pública.</span></label>
            <label>Identificador interno<input name="key" placeholder="gerado pelo nome se vazio"/></label>
            <label className="adminCheck"><input name="enabled" type="checkbox" defaultChecked/> Conteúdo habilitado</label>
            <label>Título SEO<input name="seoTitle" maxLength={180}/></label>
            <label className="full">Meta description<textarea name="seoDescription"/></label>
          </div>
          <button className="adminButton primary" type="submit">Criar estrutura</button>
        </form>
      </section>
    </div>
  );
}
