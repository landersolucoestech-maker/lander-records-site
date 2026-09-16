import { asc } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { tags } from "../../../../lib/db/schema";
import { deleteTag, upsertTag } from "../../actions";
import { AdminIcon } from "../../components/AdminIcon";
import styles from "../DashboardCrud.module.css";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const rows = await getDb().select().from(tags).orderBy(asc(tags.name));

  return <div className="adminDashboard">
    <header className="adminDashboardHeading"><div><h1>Tags</h1><p>Gerencie o vocabulário editorial com a mesma hierarquia visual e densidade do Dashboard.</p></div></header>

    <div className={styles.stack}>
      <section className={`adminDashboardPanel ${styles.panel}`}>
        <div className="adminAnalyticsPanelHeading">
          <div className="adminPanelHeadingIdentity"><span className="adminPanelHeadingIcon"><AdminIcon name="tags" size={20} /></span><div><h2>Tags editoriais</h2><p>{rows.length} {rows.length === 1 ? "tag cadastrada" : "tags cadastradas"}</p></div></div>
        </div>
        {rows.length ? <div className={styles.list}>{rows.map((tag) => <form action={upsertTag} className={styles.row} key={tag.id}>
          <input type="hidden" name="id" value={tag.id} />
          <input aria-label={`Nome de ${tag.name}`} name="name" defaultValue={tag.name} required />
          <input aria-label={`Slug de ${tag.name}`} name="slug" defaultValue={tag.slug} required />
          <div className={styles.rowActions}><button className={styles.secondaryButton} type="submit"><AdminIcon name="check" size={14} />Salvar</button><button className={styles.dangerButton} formAction={deleteTag} type="submit"><AdminIcon name="trash" size={14} />Excluir</button></div>
        </form>)}</div> : <div className={styles.empty}>Nenhuma tag cadastrada.</div>}
      </section>

      <section className={`adminDashboardPanel ${styles.panel}`}>
        <div className="adminAnalyticsPanelHeading"><div className="adminPanelHeadingIdentity"><span className="adminPanelHeadingIcon"><AdminIcon name="plus" size={20} /></span><div><h2>Nova tag</h2><p>Adicione um termo editorial mantendo nome e slug consistentes.</p></div></div></div>
        <form action={upsertTag} className={styles.panelBody}>
          <div className={styles.fieldGrid}><label>Nome<input name="name" required /></label><label>Slug<input name="slug" /></label></div>
          <div className={styles.formActions}><button className="adminPrimaryCompact" type="submit"><AdminIcon name="plus" size={14} />Criar tag</button></div>
        </form>
      </section>
    </div>
  </div>;
}
