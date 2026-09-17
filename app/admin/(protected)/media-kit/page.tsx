import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { mediaAssets, pages, posts, siteSettings } from "../../../../lib/db/schema";
import { AdminIcon, type IconName } from "../../components/AdminIcon";
import styles from "./MediaKit.module.css";

export const dynamic = "force-dynamic";

function Metric({ accent, icon, label, value, hint }: { accent: "red" | "blue" | "green" | "orange"; icon: IconName; label: string; value: string | number; hint: string }) {
  return <article className={`adminMetricCard is-${accent}`}><span className="adminMetricIcon"><AdminIcon name={icon} size={24} /></span><div className="adminMetricCopy"><span>{label}</span><strong>{value}</strong><small>{hint}</small></div></article>;
}
function PanelTitle({ icon, title, description, action }: { icon: IconName; title: string; description: string; action?: React.ReactNode }) {
  return <div className="adminAnalyticsPanelHeading"><div className="adminPanelHeadingIdentity"><span className="adminPanelHeadingIcon"><AdminIcon name={icon} size={20} /></span><div><h2>{title}</h2><p>{description}</p></div></div>{action}</div>;
}

export default async function MediaKitPage() {
  const db = getDb();
  const [[settings], [pageCount], [postCount], [mediaCount]] = await Promise.all([
    db.select().from(siteSettings).limit(1),
    db.select({ value: count() }).from(pages).where(eq(pages.enabled, true)),
    db.select({ value: count() }).from(posts).where(eq(posts.status, "published")),
    db.select({ value: count() }).from(mediaAssets).where(eq(mediaAssets.status, "active")),
  ]);
  const brand = settings?.brandName || "Lander Records";
  const tagline = settings?.tagline || "Apresentação comercial da Lander Records";
  const contact = settings?.contactEmail || "Contato comercial não configurado";
  const phone = settings?.contactPhone || "Não configurado";
  const location = settings?.address || settings?.location || "Não configurado";
  const pagesTotal = pageCount?.value || 0, postsTotal = postCount?.value || 0, mediaTotal = mediaCount?.value || 0;

  return <div className="adminDashboard" data-testid="media-kit-manager">
    <section className="adminMetricGrid" aria-label="Resumo do Mídia Kit">
      <Metric accent="red" icon="pages" label="Páginas ativas" value={pagesTotal} hint="estrutura pública atual" />
      <Metric accent="green" icon="posts" label="Publicações" value={postsTotal} hint="conteúdos publicados" />
      <Metric accent="blue" icon="media" label="Mídias" value={mediaTotal} hint="arquivos ativos" />
      <Metric accent="orange" icon="document" label="Versão do kit" value="—" hint="versionamento não persistido" />
    </section>

    <div className={styles.workspace}>
      <div className={styles.editor}>
        <section className="adminDashboardPanel"><PanelTitle icon="document" title="Identidade e apresentação" description="Dados institucionais usados na apresentação comercial." action={<Link className="adminTextButton" href="/admin/settings">Editar dados</Link>} /><div className={styles.cardBody}><div className={styles.formGrid}><label><span>Título do documento</span><input value={brand} disabled readOnly/></label><label><span>Subtítulo</span><input value={tagline} disabled readOnly/></label><label><span>Versão editorial</span><input value="Não persistida" disabled readOnly/></label><label><span>Status</span><input value="Composição atual" disabled readOnly/></label><label className={styles.span2}><span>Resumo institucional</span><textarea rows={4} value={tagline} disabled readOnly/></label><label className={styles.span2}><span>Posicionamento comercial</span><textarea rows={4} value={location} disabled readOnly/></label></div></div></section>

        <section className="adminDashboardPanel"><PanelTitle icon="chart" title="Audiência" description="Métricas entram no documento apenas quando houver fonte real elegível conectada." action={<Link className="adminTextButton" href="/admin/settings/lander-records">Integrações</Link>} /><div className={styles.cardBody}><div className={styles.emptyState}><AdminIcon name="chart" size={24}/><strong>Nenhum dado real de audiência disponível</strong><p>Ausência de dado não vira zero, estimativa ou valor manual.</p></div></div></section>

        <section className="adminDashboardPanel"><PanelTitle icon="media" title="Inventário editorial" description="Recursos reais disponíveis para composição comercial." /><div className={styles.cardBody}><div className={styles.inventoryList}><article><div><strong>Biblioteca de mídia</strong><small>{mediaTotal} arquivos ativos disponíveis.</small></div><Link className="adminTextButton" href="/admin/media">Abrir biblioteca</Link></article><article><div><strong>Conteúdo editorial</strong><small>{postsTotal} publicações atualmente publicadas.</small></div><Link className="adminTextButton" href="/admin/posts">Ver conteúdos</Link></article></div></div></section>

        <section className="adminDashboardPanel"><PanelTitle icon="mail" title="Contato comercial" description="Informações apresentadas ao anunciante a partir das configurações reais." action={<Link className="adminTextButton" href="/admin/settings">Editar contato</Link>} /><div className={styles.cardBody}><div className={styles.formGrid}><label><span>Responsável / equipe</span><input value={brand} disabled readOnly/></label><label><span>E-mail</span><input value={contact} disabled readOnly/></label><label><span>Telefone / WhatsApp</span><input value={phone} disabled readOnly/></label><label><span>Localização</span><input value={location} disabled readOnly/></label></div></div></section>
      </div>

      <aside className={styles.preview} aria-label="Prévia visual do Mídia Kit"><header><div><span>PRÉVIA</span><strong>{brand}</strong></div><small>Dados reais disponíveis</small></header><div className={styles.sheet}><div className={styles.sheetBrand}><span>MÍDIA · PUBLICAÇÕES · PRESENÇA</span><h3>{brand}</h3><p>{tagline}</p></div><div className={styles.sheetStats}><div><strong>{pagesTotal}</strong><small>PÁGINAS ATIVAS</small></div><div><strong>{postsTotal}</strong><small>PUBLICAÇÕES</small></div><div><strong>{mediaTotal}</strong><small>ARQUIVOS</small></div></div><div className={styles.sheetContact}><strong>Contato comercial</strong><span>{contact}</span><span>{phone}</span></div><div className={styles.sheetFooter}><span>{location}</span><span>LANDER RECORDS · MÍDIA KIT</span></div></div></aside>
    </div>
  </div>;
}
