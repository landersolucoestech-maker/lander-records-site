import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { mediaAssets, pages, posts, siteSettings } from "../../../../lib/db/schema";
import { AdminIcon } from "../../components/AdminIcon";
import styles from "./MediaKit.module.css";

export const dynamic = "force-dynamic";

export default async function MediaKitPage() {
  const db = getDb();
  const [[settings], [pageCount], [postCount], [mediaCount]] = await Promise.all([
    db.select().from(siteSettings).limit(1),
    db.select({ value: count() }).from(pages).where(eq(pages.enabled, true)),
    db.select({ value: count() }).from(posts).where(eq(posts.status, "published")),
    db.select({ value: count() }).from(mediaAssets).where(eq(mediaAssets.status, "active")),
  ]);

  const brand = settings?.brandName || "Lander Records";
  const tagline = settings?.tagline || "Apresentação comercial do portal";
  const contact = settings?.contactEmail || "Contato comercial não configurado";

  return <div className={styles.page}>
    <div className={styles.notice}><AdminIcon name="document" size={18} /><div><strong>Composição baseada em dados reais do Portal</strong>Esta etapa padroniza a experiência do Mídia Kit sem criar um novo domínio de persistência. Audiência e inventário só serão exibidos quando houver fonte real conectada.</div></div>

    <section className={styles.metrics} aria-label="Resumo do Mídia Kit">
      <article className={styles.metric}><div><small>Páginas ativas</small><strong>{pageCount?.value || 0}</strong><span>estrutura pública atual</span></div><span className={styles.metricIcon}><AdminIcon name="pages" size={18} /></span></article>
      <article className={styles.metric}><div><small>Publicações</small><strong>{postCount?.value || 0}</strong><span>conteúdos publicados</span></div><span className={styles.metricIcon}><AdminIcon name="posts" size={18} /></span></article>
      <article className={styles.metric}><div><small>Mídias</small><strong>{mediaCount?.value || 0}</strong><span>arquivos ativos</span></div><span className={styles.metricIcon}><AdminIcon name="media" size={18} /></span></article>
      <article className={styles.metric}><div><small>Versão do kit</small><strong>—</strong><span>versionamento ainda não persistido</span></div><span className={styles.metricIcon}><AdminIcon name="document" size={18} /></span></article>
    </section>

    <div className={styles.workspace}>
      <div className={styles.stack}>
        <section className={styles.card}>
          <div className={styles.cardHeader}><div><h2>Identidade e apresentação</h2><p>Informações já existentes no projeto, apresentadas no padrão visual do novo Admin.</p></div><Link className="adminButton" href="/admin/settings">Editar dados</Link></div>
          <div className={styles.cardBody}><div className={styles.identityGrid}>
            <div className={styles.field}><span>Marca</span><strong>{brand}</strong></div>
            <div className={styles.field}><span>Tagline</span><strong>{tagline || "Não configurada"}</strong></div>
            <div className={styles.field}><span>E-mail comercial</span><p>{contact}</p></div>
            <div className={styles.field}><span>Telefone</span><p>{settings?.contactPhone || "Não configurado"}</p></div>
            <div className={`${styles.field} ${styles.wide}`}><span>Endereço</span><p>{settings?.address || settings?.location || "Não configurado"}</p></div>
          </div></div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}><div><h2>Audiência</h2><p>Métricas só entram no documento quando uma fonte elegível estiver conectada.</p></div></div>
          <div className={styles.cardBody}><div className={styles.emptyState}><AdminIcon name="chart" size={24} /><strong>Nenhum dado real de audiência disponível</strong><p>O Mídia Kit não cria estimativas nem substitui ausência por zero. Quando analytics estiver conectado, esta área poderá consumir os dados reais.</p></div></div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}><div><h2>Inventário e presença digital</h2><p>Biblioteca e conteúdo público continuam sendo gerenciados em seus módulos de origem.</p></div></div>
          <div className={styles.cardBody}><div className={styles.actions}><Link className="adminButton" href="/admin/media"><AdminIcon name="media" size={15} />Abrir biblioteca</Link><Link className="adminButton" href="/admin/posts"><AdminIcon name="posts" size={15} />Ver conteúdos</Link><Link className="adminButton" href="/admin/settings/lander-records"><AdminIcon name="integration" size={15} />Integrações</Link></div></div>
        </section>
      </div>

      <aside className={styles.preview} aria-label="Prévia visual do Mídia Kit">
        <div className={styles.previewHeader}><strong>LIVE PREVIEW</strong><span>Composição não persistida</span></div>
        <div className={styles.sheet}>
          <div className={styles.sheetBrand}><span>MÍDIA · PUBLICAÇÕES · PRESENÇA</span><h3>{brand}</h3><p>{tagline}</p></div>
          <div className={styles.sheetStats}><div><strong>{pageCount?.value || 0}</strong><small>PÁGINAS ATIVAS</small></div><div><strong>{postCount?.value || 0}</strong><small>PUBLICAÇÕES</small></div><div><strong>{mediaCount?.value || 0}</strong><small>ARQUIVOS</small></div></div>
          <div className={styles.sheetFooter}><span>{contact}</span><span>LANDER RECORDS · MÍDIA KIT</span></div>
        </div>
      </aside>
    </div>
  </div>;
}
