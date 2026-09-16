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
  const phone = settings?.contactPhone || "Não configurado";
  const location = settings?.address || settings?.location || "Não configurado";
  const pagesTotal = pageCount?.value || 0;
  const postsTotal = postCount?.value || 0;
  const mediaTotal = mediaCount?.value || 0;

  return <div className={styles.page}>
    <section className={styles.metrics} aria-label="Resumo do Mídia Kit">
      <article><span className={styles.metricIcon}><AdminIcon name="pages" size={16}/></span><div><small>Páginas ativas</small><strong>{pagesTotal}</strong><p>Estrutura atual do Site</p></div></article>
      <article><span className={styles.metricIcon}><AdminIcon name="posts" size={16}/></span><div><small>Publicações</small><strong>{postsTotal}</strong><p>Conteúdos públicos</p></div></article>
      <article><span className={styles.metricIcon}><AdminIcon name="media" size={16}/></span><div><small>Mídias</small><strong>{mediaTotal}</strong><p>Arquivos da biblioteca</p></div></article>
      <article><span className={styles.metricIcon}><AdminIcon name="document" size={16}/></span><div><small>Versão do kit</small><strong>—</strong><p>Versionamento ainda não persistido</p></div></article>
    </section>

    <div className={styles.workspace}>
      <div className={styles.editor}>
        <section className={styles.card}>
          <header><div><h2>Identidade e apresentação</h2><p>Defina como o Portal se apresenta comercialmente usando os dados reais já persistidos no projeto.</p></div><Link className={styles.outlineButton} href="/admin/settings">Editar dados</Link></header>
          <div className={styles.cardBody}><div className={styles.formGrid}>
            <label><span>Título do documento</span><input value={brand} disabled readOnly/></label>
            <label><span>Subtítulo</span><input value={tagline} disabled readOnly/></label>
            <label><span>Versão editorial</span><input value="Não persistida" disabled readOnly/></label>
            <label><span>Status</span><input value="Composição atual" disabled readOnly/></label>
            <label className={styles.span2}><span>Resumo institucional</span><textarea rows={4} value={tagline} disabled readOnly/></label>
            <label className={styles.span2}><span>Posicionamento comercial</span><textarea rows={4} value={location} disabled readOnly/></label>
          </div></div>
        </section>

        <section className={styles.card}>
          <header><div><h2>Audiência</h2><p>Os números entram no documento somente quando houver uma fonte real elegível conectada ao projeto.</p></div><Link className={styles.outlineButton} href="/admin/settings/lander-records">Integrações</Link></header>
          <div className={styles.cardBody}><div className={styles.emptyState}><AdminIcon name="chart" size={24}/><strong>Nenhum dado real de audiência disponível</strong><p>Ausência de dado não vira zero, estimativa ou valor manual. A lógica atual do projeto permanece preservada.</p></div></div>
        </section>

        <section className={styles.card}>
          <header><div><h2>Inventário publicitário</h2><p>A referência visual é reproduzida sem criar um novo domínio de inventário que hoje não existe no projeto.</p></div></header>
          <div className={styles.cardBody}><div className={styles.inventoryList}>
            <article><div><strong>Biblioteca de mídia</strong><small>{mediaTotal} arquivos ativos disponíveis para composição editorial.</small></div><Link className={styles.outlineButton} href="/admin/media">Abrir biblioteca</Link></article>
            <article><div><strong>Conteúdo editorial</strong><small>{postsTotal} publicações atualmente publicadas.</small></div><Link className={styles.outlineButton} href="/admin/posts">Ver conteúdos</Link></article>
          </div></div>
        </section>

        <section className={styles.card}>
          <header><div><h2>Newsletter e presença digital</h2><p>A camada visual acompanha a referência; configurações continuam sendo lidas dos módulos reais existentes.</p></div></header>
          <div className={styles.cardBody}><div className={styles.formGrid}>
            <label><span>Presença digital</span><input value="Gerenciada em Integrações" disabled readOnly/></label>
            <label><span>Newsletter</span><input value="Sem configuração independente persistida" disabled readOnly/></label>
          </div></div>
        </section>

        <section className={styles.card}>
          <header><div><h2>Contato comercial</h2><p>Informações apresentadas ao anunciante, preservando a fonte de dados atual do projeto.</p></div><Link className={styles.outlineButton} href="/admin/settings">Editar contato</Link></header>
          <div className={styles.cardBody}><div className={styles.formGrid}>
            <label><span>Responsável / equipe</span><input value={brand} disabled readOnly/></label>
            <label><span>E-mail</span><input value={contact} disabled readOnly/></label>
            <label><span>Telefone / WhatsApp</span><input value={phone} disabled readOnly/></label>
            <label><span>Localização</span><input value={location} disabled readOnly/></label>
          </div></div>
        </section>

        <div className={styles.editorActions}><Link className={styles.outlineButton} href="/" target="_blank"><AdminIcon name="eye" size={15}/>Preview público</Link><Link className={styles.outlineButton} href="/admin/settings"><AdminIcon name="edit" size={15}/>Editar dados de origem</Link></div>
      </div>

      <aside className={styles.preview} aria-label="Prévia visual do Mídia Kit">
        <header><div><span>LIVE PREVIEW</span><strong>{brand}</strong></div><small>Dados reais disponíveis</small></header>
        <div className={styles.sheet}>
          <div className={styles.sheetBrand}><span>MÍDIA · PUBLICAÇÕES · PRESENÇA</span><h3>{brand}</h3><p>{tagline}</p></div>
          <div className={styles.sheetStats}><div><strong>{pagesTotal}</strong><small>PÁGINAS ATIVAS</small></div><div><strong>{postsTotal}</strong><small>PUBLICAÇÕES</small></div><div><strong>{mediaTotal}</strong><small>ARQUIVOS</small></div></div>
          <div className={styles.sheetContact}><strong>Contato comercial</strong><span>{contact}</span><span>{phone}</span></div>
          <div className={styles.sheetFooter}><span>{location}</span><span>LANDER RECORDS · MÍDIA KIT</span></div>
        </div>
      </aside>
    </div>
  </div>;
}
