import { asc } from "drizzle-orm";
import { requireAdmin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { mockDataEnabled } from "../../../../lib/mocks";
import { tags } from "../../../../lib/db/schema";
import { mockDataEnabled, mockPostTags } from "../../../../lib/mocks";
import { deleteTag, upsertTag } from "../../tag-actions";
import { AdminIcon } from "../../components/AdminIcon";
import styles from "../DashboardCrud.module.css";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const session = await requireAdmin();
  const rows = mockDataEnabled() ? mockPostTags.map((tag) => ({ ...tag, slug: tag.name.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") })) : await getDb().select().from(tags).orderBy(asc(tags.name));
  const canEdit = !mockMode && session.source === "session" && session.user.role !== "viewer";
  const canDelete = !mockMode && session.source === "session" && (session.user.role === "admin" || session.user.role === "owner");
  return <div className="adminDashboard" data-testid="tags-manager">
    <section className={`adminDashboardPanel ${styles.panel}`}>
      <div className="adminAnalyticsPanelHeading"><div className="adminPanelHeadingIdentity"><span className="adminPanelHeadingIcon"><AdminIcon name="tags" size={20}/></span><div><h2>Tags de conteúdo</h2><p>Taxonomia independente das categorias, persistida para associação às publicações.</p></div></div></div>
      {rows.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Nome</th><th>Slug</th><th>Ações</th></tr></thead><tbody>
        {rows.map((tag)=><tr key={tag.id}><td colSpan={3}><form action={upsertTag}><input type="hidden" name="id" value={tag.id}/><input aria-label={`Nome de ${tag.name}`} disabled={!canEdit} name="name" defaultValue={tag.name} required maxLength={120}/><input aria-label={`Slug de ${tag.name}`} disabled={!canEdit} name="slug" defaultValue={tag.slug} maxLength={160}/>{canEdit?<button className="adminButton" type="submit">Salvar</button>:<span className="adminBadge">Somente leitura</span>}{canDelete?<button className="adminButton" formAction={deleteTag} type="submit">Excluir</button>:null}</form></td></tr>)}
      </tbody></table></div>:<div className={styles.empty}>Nenhuma tag cadastrada.</div>}
    </section>
    {canEdit?<section className={`adminDashboardPanel ${styles.panel}`}><div className="adminAnalyticsPanelHeading"><div className="adminPanelHeadingIdentity"><span className="adminPanelHeadingIcon"><AdminIcon name="plus" size={20}/></span><div><h2>Nova tag</h2><p>Crie uma tag reutilizável para conteúdos.</p></div></div></div><form action={upsertTag}><input name="name" placeholder="Nome" required maxLength={120}/><input name="slug" placeholder="slug-opcional" maxLength={160}/><button className="adminButton primary" type="submit">Adicionar</button></form></section>:null}
  </div>;
}
