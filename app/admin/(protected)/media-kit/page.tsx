import { asc, count, eq } from "drizzle-orm";
import { requireAdmin } from "../../../../lib/auth";
import { hasMinimumRole } from "../../../../lib/auth/policy";
import { getDb } from "../../../../lib/db";
import {
  mockDataEnabled,
  mockMedia,
  mockMediaKitArtists,
  mockMediaKitItems,
  mockMediaKitReleases,
  mockMediaKitSections,
  mockMediaKitSettings,
  mockPosts,
  mockSiteSettings,
  mockSocialLinks,
} from "../../../../lib/mocks";
import {
  artists,
  mediaAssets,
  mediaKitItems,
  mediaKitSections,
  mediaKitSettings,
  posts,
  releases,
  siteSettings,
  socialLinks,
} from "../../../../lib/db/schema";
import { AdminIcon, type IconName } from "../../components/AdminIcon";
import { MediaKitBuilder } from "./components/MediaKitBuilder";
import { MediaKitPreviewDeck } from "./components/MediaKitPreviewDeck";
import { canMutateMediaKitInCurrentEnvironment } from "./preview-auth";
import styles from "./MediaKit.module.css";

export const dynamic = "force-dynamic";

function Metric({ accent, icon, label, value, hint }: { accent: "red" | "blue" | "green" | "orange"; icon: IconName; label: string; value: string | number; hint: string }) {
  return <article className={"adminMetricCard is-" + accent}><span className="adminMetricIcon"><AdminIcon name={icon} size={24} /></span><div className="adminMetricCopy"><span>{label}</span><strong>{value}</strong><small>{hint}</small></div></article>;
}

export default async function MediaKitPage() {
  const session = await requireAdmin();
  const mutationEnabled = canMutateMediaKitInCurrentEnvironment(session);
  const canEdit = mutationEnabled && hasMinimumRole(session.user.role, "editor");
  const [
    kitSettingsRows,
    sectionRows,
    itemRows,
    mediaRows,
    [artistCount],
    [releaseCount],
    [postCount],
    artistRows,
    releaseRows,
    socialRows,
    siteSettingsRows,
  ] = mockDataEnabled()
    ? [
        [mockMediaKitSettings],
        mockMediaKitSections.map((item)=>({...item})),
        mockMediaKitItems.map((item)=>({...item})),
        mockMedia.map(({id,url,altText,originalFilename,mimeType})=>({id,url,altText,originalFilename,mimeType})),
        [{value:mockMediaKitArtists.length}],
        [{value:mockMediaKitReleases.length}],
        [{value:mockPosts.length}],
        mockMediaKitArtists,
        mockMediaKitReleases,
        mockSocialLinks,
        [mockSiteSettings],
      ]
    : await (async()=>{
        const db=getDb();
        return Promise.all([
          db.select().from(mediaKitSettings).where(eq(mediaKitSettings.id, "default")).limit(1),
          db.select({id:mediaKitSections.id,type:mediaKitSections.type,theme:mediaKitSections.theme,eyebrow:mediaKitSections.eyebrow,title:mediaKitSections.title,subtitle:mediaKitSections.subtitle,body:mediaKitSections.body,ctaLabel:mediaKitSections.ctaLabel,ctaUrl:mediaKitSections.ctaUrl,mediaId:mediaKitSections.mediaId,position:mediaKitSections.position,enabled:mediaKitSections.enabled,settings:mediaKitSections.settings}).from(mediaKitSections).orderBy(asc(mediaKitSections.position), asc(mediaKitSections.createdAt)),
          db.select({id:mediaKitItems.id,sectionId:mediaKitItems.sectionId,kind:mediaKitItems.kind,title:mediaKitItems.title,subtitle:mediaKitItems.subtitle,body:mediaKitItems.body,label:mediaKitItems.label,value:mediaKitItems.value,url:mediaKitItems.url,sourceKey:mediaKitItems.sourceKey,icon:mediaKitItems.icon,mediaId:mediaKitItems.mediaId,position:mediaKitItems.position,enabled:mediaKitItems.enabled,metadata:mediaKitItems.metadata}).from(mediaKitItems).orderBy(asc(mediaKitItems.position), asc(mediaKitItems.createdAt)),
          db.select({id:mediaAssets.id,url:mediaAssets.url,altText:mediaAssets.altText,originalFilename:mediaAssets.originalFilename,mimeType:mediaAssets.mimeType}).from(mediaAssets).where(eq(mediaAssets.status, "active")).orderBy(asc(mediaAssets.originalFilename)),
          db.select({value:count()}).from(artists).where(eq(artists.isPublished,true)),
          db.select({value:count()}).from(releases).where(eq(releases.active,true)),
          db.select({value:count()}).from(posts).where(eq(posts.status,"published")),
          db.select({name:artists.name,eyebrow:artists.eyebrow,shortBio:artists.shortBio}).from(artists).where(eq(artists.isPublished,true)).limit(6),
          db.select({title:releases.title,artistName:releases.artistName,releaseType:releases.releaseType,releaseDate:releases.releaseDate}).from(releases).where(eq(releases.active,true)).limit(6),
          db.select({platform:socialLinks.platform,label:socialLinks.label,url:socialLinks.url}).from(socialLinks).where(eq(socialLinks.active,true)).limit(20),
          db.select({contactEmail:siteSettings.contactEmail,contactPhone:siteSettings.contactPhone,location:siteSettings.location,address:siteSettings.address}).from(siteSettings).limit(1),
        ]);
      })();

  const settings = kitSettingsRows[0] || {
    documentTitle: "Mídia Kit",
    edition: "2026",
    footerWebsite: "landerrecords.com",
    showPageNumbers: true,
  };
  const imageMedia = mediaRows.filter((media) => media.mimeType.startsWith("image/"));
  const mediaUrl = new Map(imageMedia.map((media) => [media.id, media.url]));
  const itemsBySection = new Map<string, typeof itemRows>();
  for (const item of itemRows) {
    const current = itemsBySection.get(item.sectionId) || [];
    current.push(item);
    itemsBySection.set(item.sectionId, current);
  }

  const sections = sectionRows.map((section) => ({
    ...section,
    mediaUrl: section.mediaId ? mediaUrl.get(section.mediaId) || "" : "",
    items: (itemsBySection.get(section.id) || []).map((item) => ({
      ...item,
      mediaUrl: item.mediaId ? mediaUrl.get(item.mediaId) || "" : "",
    })),
  }));

  const artistsTotal = Number(artistCount?.value || 0);
  const releasesTotal = Number(releaseCount?.value || 0);
  const postsTotal = Number(postCount?.value || 0);
  const visibleSections = sections.filter((section) => section.enabled).length;
  const visibleItems = itemRows.filter((item) => item.enabled).length;
  const instagram = socialRows.find((item) => item.platform.toLowerCase().includes("instagram"));
  const company = siteSettingsRows[0];
  const contactEmail = company?.contactEmail || "contato@landerrecords.com";
  const contactPhone = company?.contactPhone || "Não configurado";
  const location = company?.address || company?.location || "Não configurado";
  const website = settings.footerWebsite || "landerrecords.com";

  return <div className={["adminDashboard", styles.mediaKitLayout].join(" ")} data-testid="media-kit-manager">
    <section className="adminMetricGrid" aria-label="Resumo do Mídia Kit">
      <Metric accent="red" icon="pages" label="Seções visíveis" value={visibleSections} hint="páginas no deck" />
      <Metric accent="green" icon="document" label="Itens de conteúdo" value={visibleItems} hint="blocos ativos" />
      <Metric accent="blue" icon="artists" label="Artistas publicados" value={artistsTotal} hint="fonte automática disponível" />
      <Metric accent="orange" icon="media" label="Lançamentos" value={releasesTotal} hint="fonte automática disponível" />
    </section>

    <div className={styles.workspace}>
      <div className={styles.editor}>
        {canEdit ? <MediaKitBuilder settings={settings} sections={sections} media={imageMedia}/> : <section className={styles.builderEmpty}><AdminIcon name="eye" size={24}/><strong>Modo somente leitura</strong><span>Sua sessão pode visualizar a composição, mas não editar o Mídia Kit.</span></section>}
      </div>

      <aside className={styles.preview} aria-label="Prévia visual do Mídia Kit">
        <header className={styles.previewHeader}><div><span>PRÉVIA</span><strong>{settings.documentTitle} {settings.edition}</strong></div><small>{visibleSections} {visibleSections === 1 ? "página" : "páginas"} · composição editorial</small></header>
        <div className={styles.previewViewport}>
          <MediaKitPreviewDeck
            settings={settings}
            sections={sections}
            real={{
              artistsTotal,
              releasesTotal,
              postsTotal,
              mediaTotal: imageMedia.length,
              contactEmail,
              contactPhone,
              location,
              instagram: instagram?.label || instagram?.url || "Instagram não configurado",
              website,
              artists: artistRows,
              releases: releaseRows,
            }}
          />
        </div>
      </aside>
    </div>
  </div>;
}
