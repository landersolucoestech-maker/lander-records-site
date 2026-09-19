import { AdminIcon, type IconName } from "../../../components/AdminIcon";
import styles from "../MediaKit.module.css";

type PreviewItem = {
  id: string;
  kind: string;
  title: string;
  subtitle: string;
  body: string;
  label: string;
  value: string;
  url: string;
  sourceKey: string;
  icon: string;
  position: number;
  enabled: boolean;
  mediaUrl: string;
};

type PreviewSection = {
  id: string;
  type: string;
  theme: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  position: number;
  enabled: boolean;
  mediaUrl: string;
  items: PreviewItem[];
};

type ArtistItem = { name: string; eyebrow: string; shortBio: string };
type ReleaseItem = { title: string; artistName: string; releaseType: string; releaseDate: string | Date | null };

type PreviewSettings = {
  documentTitle: string;
  edition: string;
  footerWebsite: string;
  showPageNumbers: boolean;
};

type RealData = {
  artistsTotal: number;
  releasesTotal: number;
  postsTotal: number;
  mediaTotal: number;
  contactEmail: string;
  contactPhone: string;
  location: string;
  instagram: string;
  website: string;
  artists: ArtistItem[];
  releases: ReleaseItem[];
};

const allowedIcons = new Set<IconName>(["activity","artists","calendar","chart","document","external","mail","media","pages","plus","posts","smartphone","target","users"]);

function iconName(value: string): IconName {
  return allowedIcons.has(value as IconName) ? value as IconName : "document";
}

function releaseYear(value: string | Date | null) {
  if (!value) return "";
  if (value instanceof Date) return String(value.getUTCFullYear());
  return value.slice(0, 4);
}

function resolveValue(item: PreviewItem, real: RealData) {
  const values: Record<string, string | number> = {
    artists_total: real.artistsTotal,
    releases_total: real.releasesTotal,
    posts_total: real.postsTotal,
    media_total: real.mediaTotal,
    contact_email: real.contactEmail,
    contact_phone: real.contactPhone,
    location: real.location,
    instagram: real.instagram,
    website: real.website,
  };
  return item.sourceKey === "static" ? item.value : values[item.sourceKey] ?? item.value;
}

function Brand({ dark = false }: { dark?: boolean }) {
  return <div className={styles.mkBrand}><span className={styles.mkBrandMark} aria-hidden="true"><i/><i/><i/><i/></span><div><strong>LANDER <b>RECORDS</b></strong><small className={dark ? styles.mkMutedDark : undefined}>MÚSICA · ARTISTAS · CULTURA · OPORTUNIDADES</small></div></div>;
}

function PageShell({
  settings,
  section,
  pageNumber,
  children,
}: {
  settings: PreviewSettings;
  section: PreviewSection;
  pageNumber: number;
  children: React.ReactNode;
}) {
  const dark = section.theme === "dark";
  return <article className={[styles.mkPage, dark ? styles.mkPageDark : styles.mkPageLight].join(" ")} data-section-type={section.type}>
    <header className={styles.mkPageHeader}><Brand dark={dark}/><div className={styles.mkPageMeta}><span>{settings.documentTitle.toUpperCase()} {settings.edition}</span>{settings.showPageNumbers ? <strong>{String(pageNumber).padStart(2,"0")}</strong> : null}</div></header>
    {children}
    <footer className={styles.mkPageFooter}><span>{settings.footerWebsite.toUpperCase()}</span><span className={dark ? styles.mkMutedDark : undefined}>{section.eyebrow || "LANDER RECORDS"}</span></footer>
  </article>;
}

function Heading({ section }: { section: PreviewSection }) {
  return <section className={styles.mkDynamicIntro}>
    {section.eyebrow ? <span className={styles.mkSectionEyebrow}>{section.eyebrow}</span> : null}
    <h3>{section.title || "Seção sem título"}</h3>
    <i className={styles.mkRedRule}/>
    {section.subtitle ? <strong>{section.subtitle}</strong> : null}
    {section.body ? <div className={styles.mkRichText}>{section.body.split(/\n{2,}/).map((paragraph)=><p key={paragraph}>{paragraph}</p>)}</div> : null}
    {section.ctaLabel && section.ctaUrl ? <a className={styles.mkCta} href={section.ctaUrl}>{section.ctaLabel}<span>→</span></a> : null}
  </section>;
}

function CoverPage({ settings, section, pageNumber, real }: { settings: PreviewSettings; section: PreviewSection; pageNumber: number; real: RealData }) {
  const items=section.items.filter(item=>item.enabled);
  const style = section.mediaUrl ? { backgroundImage: `linear-gradient(90deg,rgba(5,6,8,.96),rgba(5,6,8,.46)),url("${section.mediaUrl}")` } : undefined;
  return <PageShell settings={settings} section={{...section,theme:"dark"}} pageNumber={pageNumber}>
    <div className={styles.mkCoverDynamic} style={style}>
      <div className={styles.mkCoverDynamicCopy}>
        {section.eyebrow ? <span className={styles.mkKicker}>{section.eyebrow}</span> : null}
        <h3>{section.title || "MÍDIA KIT"}</h3>
        <i className={styles.mkRedRule}/>
        {section.subtitle ? <strong>{section.subtitle}</strong> : null}
        {section.body ? <p>{section.body}</p> : null}
        {section.ctaLabel && section.ctaUrl ? <a className={styles.mkCtaDark} href={section.ctaUrl}>{section.ctaLabel}<span>→</span></a> : null}
      </div>
      <div className={styles.mkCoverDynamicVisual}><div className={styles.mkLaptopMock}><div className={styles.mkLaptopBar}><span>LANDER RECORDS</span><small>ARTISTAS · LANÇAMENTOS · CONTEÚDO</small></div><div className={styles.mkLaptopHero}><strong>MÚSICA<br/>MOVE<br/>PESSOAS.</strong><span>▶</span></div><div className={styles.mkLaptopThumbs}><i/><i/><i/><i/></div></div></div>
    </div>
    <div className={styles.mkDynamicHighlights}>{items.map((item)=><div key={item.id}><AdminIcon name={iconName(item.icon)} size={18}/><strong>{item.title}</strong><span>{String(resolveValue(item,real) || item.subtitle || "")}</span><small>{item.subtitle}</small></div>)}</div>
  </PageShell>;
}

function EditorialPage({ settings, section, pageNumber, real }: { settings: PreviewSettings; section: PreviewSection; pageNumber: number; real: RealData }) {
  const items=section.items.filter(item=>item.enabled);
  return <PageShell settings={settings} section={section} pageNumber={pageNumber}>
    <div className={styles.mkDynamicBody}>
      <div className={styles.mkEditorialTop}><Heading section={section}/>{section.mediaUrl ? <div className={styles.mkEditorialMedia} style={{backgroundImage:`linear-gradient(180deg,#10121655,#101216dd),url("${section.mediaUrl}")`}}/> : <div className={styles.mkEditorialMediaFallback}><strong>MÚSICA.<br/>NEGÓCIOS.<br/>CULTURA.</strong></div>}</div>
      {items.length ? <div className={styles.mkMetricStrip}>{items.map(item=><div className={styles.mkMetricTile} key={item.id}><AdminIcon name={iconName(item.icon)} size={18}/><strong>{String(resolveValue(item,real) || "—")}</strong><span>{item.title || item.label}</span><small>{item.subtitle}</small></div>)}</div> : null}
    </div>
  </PageShell>;
}

function AudiencePage({ settings, section, pageNumber, real }: { settings: PreviewSettings; section: PreviewSection; pageNumber: number; real: RealData }) {
  const items=section.items.filter(item=>item.enabled);
  return <PageShell settings={settings} section={section} pageNumber={pageNumber}>
    <div className={styles.mkDynamicBody}>
      <Heading section={section}/>
      <div className={styles.mkAudienceBuilderGrid}>{items.map((item,index)=><article key={item.id} className={styles.mkAudienceBuilderCard}><div><AdminIcon name={iconName(item.icon)} size={18}/><strong>{item.title || item.label}</strong></div><span className={styles.mkAudienceValue}>{String(resolveValue(item,real) || item.subtitle || "—")}</span>{item.body ? <p>{item.body}</p> : null}<i><b style={{width:String(Math.min(88,28+(index*13)%60))+"%"}}/></i></article>)}</div>
    </div>
  </PageShell>;
}

function CardsPage({ settings, section, pageNumber, real }: { settings: PreviewSettings; section: PreviewSection; pageNumber: number; real: RealData }) {
  const items=section.items.filter(item=>item.enabled);
  return <PageShell settings={settings} section={section} pageNumber={pageNumber}>
    <div className={styles.mkDynamicBody}>
      <Heading section={section}/>
      <div className={styles.mkBuilderCardGrid}>{items.map((item)=><article key={item.id}><div className={styles.mkBuilderCardVisual} style={item.mediaUrl?{backgroundImage:`linear-gradient(#1117,#111d),url("${item.mediaUrl}")`}:undefined}><AdminIcon name={iconName(item.icon)} size={22}/><span>{String(resolveValue(item,real) || item.label || "LANDER RECORDS")}</span></div><h4>{item.title || item.label}</h4>{item.subtitle ? <strong>{item.subtitle}</strong> : null}{item.body ? <p>{item.body}</p> : null}{item.url ? <a href={item.url}>Saiba mais →</a> : null}</article>)}</div>
    </div>
  </PageShell>;
}

function ArtistsPage({ settings, section, pageNumber, real }: { settings: PreviewSettings; section: PreviewSection; pageNumber: number; real: RealData }) {
  const items=section.items.filter(item=>item.enabled);
  const featured=real.artists[0];
  return <PageShell settings={settings} section={section} pageNumber={pageNumber}>
    <div className={styles.mkDynamicBody}>
      <Heading section={section}/>
      <div className={styles.mkArtistsBuilderLayout}>
        <section><h4>LANÇAMENTOS RECENTES</h4>{real.releases.slice(0,4).map(release=><div className={styles.mkReleaseBuilderRow} key={release.artistName+"-"+release.title}><i/><p><strong>{release.artistName}</strong><b>{release.title}</b><small>{release.releaseType}{releaseYear(release.releaseDate)?" · "+releaseYear(release.releaseDate):""}</small></p></div>)}</section>
        <section className={styles.mkFeaturedBuilder} style={section.mediaUrl?{backgroundImage:`linear-gradient(0deg,#090a0ee8,#090a0e22),url("${section.mediaUrl}")`}:undefined}><span>ARTISTA EM DESTAQUE</span><strong>{featured?.name || "Destaque a definir"}</strong><p>{featured?.shortBio || featured?.eyebrow || "Selecione artistas publicados para destacar automaticamente."}</p></section>
        <section><h4>DESTAQUES / OPORTUNIDADES</h4>{items.map(item=><div className={styles.mkOpportunityBuilder} key={item.id}><span>+</span><p><strong>{item.title}</strong>{item.body ? <small>{item.body}</small> : null}</p></div>)}</section>
      </div>
    </div>
  </PageShell>;
}

function ContactPage({ settings, section, pageNumber, real }: { settings: PreviewSettings; section: PreviewSection; pageNumber: number; real: RealData }) {
  const items=section.items.filter(item=>item.enabled);
  return <PageShell settings={settings} section={section} pageNumber={pageNumber}>
    <div className={styles.mkContactBuilder}>
      <Heading section={section}/>
      <aside style={section.mediaUrl?{backgroundImage:`linear-gradient(180deg,#090a0dbd,#090a0df2),url("${section.mediaUrl}")`}:undefined}>
        <span>CONTATO & PRÓXIMOS PASSOS</span>
        <div>{items.map(item=><p key={item.id}><AdminIcon name={iconName(item.icon)} size={15}/><span><strong>{item.title || item.label}</strong><b>{String(resolveValue(item,real) || item.value || "Não configurado")}</b></span></p>)}</div>
      </aside>
    </div>
  </PageShell>;
}

function GenericPage({ settings, section, pageNumber, real }: { settings: PreviewSettings; section: PreviewSection; pageNumber: number; real: RealData }) {
  const items=section.items.filter(item=>item.enabled);
  return <PageShell settings={settings} section={section} pageNumber={pageNumber}>
    <div className={styles.mkDynamicBody}>
      <Heading section={section}/>
      {items.length ? <div className={styles.mkGenericItems}>{items.map(item=><article key={item.id}>{item.mediaUrl?<div className={styles.mkGenericMedia} style={{backgroundImage:`url("${item.mediaUrl}")`}}/>:null}<div><AdminIcon name={iconName(item.icon)} size={17}/><h4>{item.title || item.label}</h4>{resolveValue(item,real)?<strong>{String(resolveValue(item,real))}</strong>:null}{item.subtitle?<span>{item.subtitle}</span>:null}{item.body?<p>{item.body}</p>:null}{item.url?<a href={item.url}>Abrir →</a>:null}</div></article>)}</div> : null}
    </div>
  </PageShell>;
}

function DynamicPage({ settings, section, pageNumber, real }: { settings: PreviewSettings; section: PreviewSection; pageNumber: number; real: RealData }) {
  if (section.type === "cover") return <CoverPage settings={settings} section={section} pageNumber={pageNumber} real={real}/>;
  if (section.type === "editorial" || section.type === "metrics") return <EditorialPage settings={settings} section={section} pageNumber={pageNumber} real={real}/>;
  if (section.type === "audience") return <AudiencePage settings={settings} section={section} pageNumber={pageNumber} real={real}/>;
  if (section.type === "cards") return <CardsPage settings={settings} section={section} pageNumber={pageNumber} real={real}/>;
  if (section.type === "artists") return <ArtistsPage settings={settings} section={section} pageNumber={pageNumber} real={real}/>;
  if (section.type === "contact") return <ContactPage settings={settings} section={section} pageNumber={pageNumber} real={real}/>;
  return <GenericPage settings={settings} section={section} pageNumber={pageNumber} real={real}/>;
}

export function MediaKitPreviewDeck({
  settings,
  sections,
  real,
}: {
  settings: PreviewSettings;
  sections: PreviewSection[];
  real: RealData;
}) {
  const visibleSections=sections.filter(section=>section.enabled).sort((a,b)=>a.position-b.position);
  if (!visibleSections.length) return <div className={styles.mkPreviewEmpty}><AdminIcon name="document" size={28}/><strong>Nenhuma seção visível</strong><span>Adicione ou ative uma seção no editor para montar o Mídia Kit.</span></div>;
  return <div className={styles.mkDeck} data-testid="media-kit-preview-deck">
    {visibleSections.map((section,index)=><DynamicPage key={section.id} settings={settings} section={section} pageNumber={index+1} real={real}/>)}
  </div>;
}
