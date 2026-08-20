import Link from "next/link";
import { asc } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { pages } from "../../../../lib/db/schema";

export const dynamic = "force-dynamic";

export default async function PagesAdminPage() {
  const rows = await getDb().select().from(pages).orderBy(asc(pages.title));
  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">SITE</p><h1>Páginas e seções</h1><p>Conteúdo estruturado por seções conhecidas, com ordem e ativação — sem page-builder arbitrário.</p></div></header>
      <section className="adminPanel"><table className="adminTable"><thead><tr><th>Página</th><th>Chave</th><th>Slug</th><th>Status</th><th></th></tr></thead><tbody>{rows.map((page) => <tr key={page.id}><td><strong>{page.title}</strong></td><td><span className="adminCode">{page.key}</span></td><td>{page.slug || "/"}</td><td><span className={`adminBadge ${page.enabled ? "live" : "draft"}`}>{page.enabled ? "Ativa" : "Inativa"}</span></td><td><Link href={`/admin/pages/${page.id}`}>Gerenciar →</Link></td></tr>)}</tbody></table></section>
    </div>
  );
}
