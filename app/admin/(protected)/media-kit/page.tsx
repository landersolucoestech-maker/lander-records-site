import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { requireAdmin } from "../../../../lib/auth";
import { hasMinimumRole } from "../../../../lib/auth/policy";
import { getDb } from "../../../../lib/db";
import { artists, mediaAssets, pages, posts, releases, siteSettings, socialLinks } from "../../../../lib/db/schema";
import { AdminIcon, type IconName } from "../../components/AdminIcon";
import { MediaKitPreviewDeck } from "./components/MediaKitPreviewDeck";
import styles from "./MediaKit.module.css";

export const dynamic = "force-dynamic";

function Metric({ accent, icon, label, value, hint }: { accent: "red" | "blue" | "green" | "orange"; icon: IconName; label: string; value: string | number; hint: string }) {
  return <article className={"adminMetricCard is-" + accent}><span className="adminMetricIcon"><AdminIcon name={icon} size={24} /></span><div className="adminMetricCopy"><span>{label}</span><strong>{value}</strong><small>{hint}</small></div></article>;
}
function PanelTitle({ icon, title, description, action }: { icon: IconName; title: string; description: string; action?: React.ReactNode }) {
  return <div className="adminAnalyticsPanelHeading"><div className="adminPanelHeadingIdentity"><span className="adminPanelHeadingIcon"><AdminIcon name={icon} size={20} /></span><div><h2>{title}</h2><p>{description}</p></div></div>{action}</div>;
}

export default async function MediaKitPage() {
  const session = await requireAdmin();
  const persistent = session.source === "session";
  const canEditContent = persistent && hasMinimumRole(session.user.role, "editor");
  const canAdminSettings = persistent && hasMinimumRole(session.user.role, "admin");
  const db = getDb();
  const [[settings], [pageCount], [postCount], [mediaCount], [artistCount], [releaseCount], artistRows, releaseRows, socialRows] = await Promise.all([
    db.select().from(siteSettings).limit(1),
    db.select({ value: count() }).from(pages).where(eq(pages.enabled, true)),
    db.select({ value: count() }).from(posts).where(eq(posts.status, "published")),
    db.select({ value: count() }).from(mediaAssets).where(eq(mediaAssets.status, "active")),
    db.select({ value: count() }).from(artists).where(eq(artists.isPublished, true)),
    db.select({ value: count() }).from(releases).where(eq(releases.active, true)),
    db.select({ name: artists.name, eyebrow: artists.eyebrow, shortBio: artists.shortBio }).from(artists).where(eq(artists.isPublished, true)).limit(4),
    db.select({ title: releases.title, artistName: releases.artistName, releaseType: releases.releaseType, releaseDate: releases.releaseDate }).from(releases).where(eq(releases.active, true)).limit(4),
    db.select({ platform: socialLinks.platform, label: socialLinks.label, url: socialLinks.url }).from(socialLinks).where(eq(socialLinks.active, true)).limit(8),
  ]);
  const brand = settings?.brandName || "Lander Records";
  const tagline = settings?.tagline || "Gravadora, produtora musical e gestão artística 360°.";
  const contact = settings?.contactEmail || "contato@landerrecords.com";
  const phone = settings?.contactPhone || "Não configurado";
  const location = settings?.address || settings?.location || "Não configurado";
  const website = contact.includes("@") ? contact.split("@").at(-1) || "landerrecords.com" : "landerrecords.com";
  const pagesTotal = Number(pageCount?.value || 0);
  const postsTotal = Number(postCount?.value || 0);
  const mediaTotal = Number(mediaCount?.value || 0);
  const artistsTotal = Number(artistCount?.value || 0);
  const releasesTotal = Number(releaseCount?.value || 0);

  return <div className={["adminDashboard", styles.mediaKitLayout].join(" ")} data-testid="media-kit-manager">
    <section className="adminMetricGrid" aria-label="Resumo do Mídia Kit">
      <Metric accent="red" icon="artists" label="Artistas publicados" value={artistsTotal} hint="casting disponível" />
      <Metric accent="green" icon="media" label="Lançamentos" value={releasesTotal} hint="lançamentos ativos" />
      <Metric accent="blue" icon="posts" label="Publicações" value={postsTotal} hint="conteúdos publicados" />
      <Metric accent="orange" icon="document" label="Páginas do kit" value="6" hint="template editorial 2026" />
    </section>

    <div className={styles.workspace}>
      <div className={styles.editor}>
        <section className="adminDashboardPanel"><PanelTitle icon="document" title="Identidade e apresentação" description="Dados institucionais usados na apresentação comercial." action={<Link className="adminTextButton" href="/admin/settings">{canAdminSettings ? "Editar dados" : "Consultar dados"}</Link>} /><div className={styles.cardBody}><div className={styles.formGrid}><label><span>Título do documento</span><input value={brand} disabled readOnly/></label><label><span>Subtítulo</span><input value={tagline} disabled readOnly/></label><label><span>Versão editorial</span><input value="Mídia Kit 2026" disabled readOnly/></label><label><span>Status</span><input value="Deck comercial em 6 páginas" disabled readOnly/></label><label className={styles.span2}><span>Resumo institucional</span><textarea rows={4} value={tagline} disabled readOnly/></label><label className={styles.span2}><span>Posicionamento comercial</span><textarea rows={4} value={location} disabled readOnly/></label></div></div></section>

        <section className="adminDashboardPanel"><PanelTitle icon="chart" title="Audiência" description="A página de audiência está diagramada e recebe apenas métricas verificadas." action={<Link className="adminTextButton" href="/admin/settings/lander-records">{canEditContent ? "Integrações" : "Consultar integrações"}</Link>} /><div className={styles.cardBody}><div className={styles.emptyState}><AdminIcon name="chart" size={24}/><strong>Template de audiência pronto</strong><p>Alcance, seguidores, demografia e cidades permanecem como “A integrar” até existir uma fonte elegível conectada.</p></div></div></section>

        <section className="adminDashboardPanel"><PanelTitle icon="artists" title="Artistas e lançamentos" description="Dados reais do catálogo alimentam a página de destaques." /><div className={styles.cardBody}><div className={styles.inventoryList}><article><div><strong>Artistas publicados</strong><small>{artistsTotal} perfis disponíveis para o deck.</small></div><Link className="adminTextButton" href="/admin/artists">Abrir artistas</Link></article><article><div><strong>Lançamentos ativos</strong><small>{releasesTotal} lançamentos disponíveis.</small></div><Link className="adminTextButton" href="/admin/releases">Ver lançamentos</Link></article></div></div></section>

        <section className="adminDashboardPanel"><PanelTitle icon="media" title="Inventário editorial" description="Recursos reais disponíveis para composição comercial." /><div className={styles.cardBody}><div className={styles.inventoryList}><article><div><strong>Biblioteca de mídia</strong><small>{mediaTotal} arquivos ativos disponíveis.</small></div><Link className="adminTextButton" href="/admin/media">Abrir biblioteca</Link></article><article><div><strong>Conteúdo editorial</strong><small>{postsTotal} publicações atualmente publicadas.</small></div><Link className="adminTextButton" href="/admin/posts">Ver conteúdos</Link></article></div></div></section>

        <section className="adminDashboardPanel"><PanelTitle icon="mail" title="Contato comercial" description="Informações usadas na página final do deck." action={<Link className="adminTextButton" href="/admin/settings">{canAdminSettings ? "Editar contato" : "Consultar contato"}</Link>} /><div className={styles.cardBody}><div className={styles.formGrid}><label><span>Responsável / equipe</span><input value={brand} disabled readOnly/></label><label><span>E-mail</span><input value={contact} disabled readOnly/></label><label><span>Telefone / WhatsApp</span><input value={phone} disabled readOnly/></label><label><span>Localização</span><input value={location} disabled readOnly/></label></div></div></section>
      </div>

      <aside className={styles.preview} aria-label="Prévia visual do Mídia Kit">
        <header className={styles.previewHeader}><div><span>PRÉVIA</span><strong>{brand}</strong></div><small>6 páginas · deck comercial</small></header>
        <div className={styles.previewViewport}>
          <MediaKitPreviewDeck brand={brand} tagline={tagline} contact={contact} phone={phone} location={location} website={website} pagesTotal={pagesTotal} postsTotal={postsTotal} mediaTotal={mediaTotal} artistsTotal={artistsTotal} releasesTotal={releasesTotal} artists={artistRows} releases={releaseRows} socials={socialRows}/>
        </div>
      </aside>
    </div>
  </div>;
}
