import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { mediaAssets, releases } from "../../../../lib/db/schema";
import { upsertRelease } from "../../actions";
import { AdminIcon, type IconName } from "../../components/AdminIcon";
import styles from "../DashboardCrud.module.css";

export const dynamic = "force-dynamic";

function Metric({ accent, icon, label, value, hint }: { accent: "red" | "blue" | "green" | "orange"; icon: IconName; label: string; value: number; hint: string }) {
  return <article className={`adminMetricCard is-${accent}`}><span className="adminMetricIcon"><AdminIcon name={icon} size={24} /></span><div className="adminMetricCopy"><span>{label}</span><strong className={styles.metricNumber}>{new Intl.NumberFormat("pt-BR").format(value)}</strong><small>{hint}</small></div></article>;
}

export default async function ReleasesPage() {
  const db = getDb();
  const [rows, media] = await Promise.all([
    db.select().from(releases).orderBy(asc(releases.position)),
    db.select().from(mediaAssets).where(eq(mediaAssets.status, "active")).orderBy(asc(mediaAssets.originalFilename)),
  ]);
  const activeCount = rows.filter((release) => release.active).length;
  const featuredCount = rows.filter((release) => release.featuredOnHome).length;
  const withCover = rows.filter((release) => Boolean(release.coverMediaId)).length;

  return <div className="adminDashboard">
    <header className="adminDashboardHeading"><div><h1>Lançamentos</h1><p>Gerencie os registros editoriais de lançamentos com a mesma hierarquia visual do Dashboard.</p></div></header>

    <section className="adminMetricGrid" aria-label="Resumo dos lançamentos">
      <Metric accent="red" icon="media" label="Lançamentos" value={rows.length} hint="registros cadastrados" />
      <Metric accent="green" icon="check" label="Ativos" value={activeCount} hint="disponíveis no catálogo" />
      <Metric accent="blue" icon="target" label="Destaques" value={featuredCount} hint="marcados para destaque" />
      <Metric accent="orange" icon="image" label="Com capa" value={withCover} hint="assets vinculados" />
    </section>

    <div className={styles.stack}>
      <section className={`adminDashboardPanel ${styles.panel}`}>
        <div className="adminAnalyticsPanelHeading"><div className="adminPanelHeadingIdentity"><span className="adminPanelHeadingIcon"><AdminIcon name="media" size={20} /></span><div><h2>Catálogo cadastrado</h2><p>{rows.length ? "Edite dados, mídia, ordem e disponibilidade de cada registro." : "Nenhum lançamento cadastrado."}</p></div></div></div>
        {rows.length ? <div>{rows.map((release) => <form action={upsertRelease} className={styles.releaseCard} key={release.id}>
          <input type="hidden" name="id" value={release.id} />
          <div className={styles.releaseHeader}><div className={styles.releaseIdentity}><strong>{release.title}</strong><span>{release.artistName} · {release.releaseType || "Lançamento"}</span></div><button className={styles.secondaryButton} type="submit"><AdminIcon name="check" size={14} />Salvar</button></div>
          <div className={styles.fieldGrid}>
            <label>Título<input name="title" defaultValue={release.title} required /></label><label>Slug<input name="slug" defaultValue={release.slug} required /></label>
            <label>Artista<input name="artistName" defaultValue={release.artistName} required /></label><label>Tipo<input name="releaseType" defaultValue={release.releaseType} /></label>
            <label>Data<input name="releaseDate" type="date" defaultValue={release.releaseDate || ""} /></label><label>Plataforma<input name="platform" defaultValue={release.platform} /></label>
            <label className={styles.wide}>URL<input name="platformUrl" type="url" defaultValue={release.platformUrl} /></label><label>ID externo<input name="externalId" defaultValue={release.externalId || ""} /></label>
            <label>Capa<select name="coverMediaId" defaultValue={release.coverMediaId || ""}><option value="">Sem capa</option>{media.map((item) => <option key={item.id} value={item.id}>{item.originalFilename}</option>)}</select></label><label>Ordem<input name="position" type="number" defaultValue={release.position} /></label>
            <label className={styles.check}><input name="featuredOnHome" type="checkbox" defaultChecked={release.featuredOnHome} />Marcado como destaque</label><label className={styles.check}><input name="active" type="checkbox" defaultChecked={release.active} />Ativo</label>
          </div>
        </form>)}</div> : <div className={styles.empty}>Cadastre o primeiro lançamento para iniciar este catálogo.</div>}
      </section>

      <section className={`adminDashboardPanel ${styles.panel}`}>
        <div className="adminAnalyticsPanelHeading"><div className="adminPanelHeadingIdentity"><span className="adminPanelHeadingIcon"><AdminIcon name="plus" size={20} /></span><div><h2>Novo lançamento</h2><p>Cadastre apenas os dados editoriais disponíveis para o registro.</p></div></div></div>
        <form action={upsertRelease} className={styles.panelBody}>
          <div className={styles.fieldGrid}>
            <label>Título<input name="title" required /></label><label>Slug<input name="slug" /></label><label>Artista<input name="artistName" required /></label><label>Tipo<input name="releaseType" defaultValue="Single" /></label>
            <label>Data<input name="releaseDate" type="date" /></label><label>Plataforma<input name="platform" defaultValue="Spotify" /></label><label className={styles.wide}>URL<input name="platformUrl" type="url" /></label><label>ID externo<input name="externalId" /></label>
            <label>Capa<select name="coverMediaId" defaultValue=""><option value="">Sem capa</option>{media.map((item) => <option key={item.id} value={item.id}>{item.originalFilename}</option>)}</select></label><label>Ordem<input name="position" type="number" defaultValue={0} /></label><label className={styles.check}><input name="featuredOnHome" type="checkbox" defaultChecked />Marcado como destaque</label><label className={styles.check}><input name="active" type="checkbox" defaultChecked />Ativo</label>
          </div>
          <div className={styles.formActions}><button className="adminPrimaryCompact" type="submit"><AdminIcon name="plus" size={14} />Criar lançamento</button></div>
        </form>
      </section>
    </div>
  </div>;
}
