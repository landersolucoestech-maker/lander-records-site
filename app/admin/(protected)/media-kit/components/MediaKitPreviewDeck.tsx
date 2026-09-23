import { AdminIcon, type IconName } from "../../../components/AdminIcon";
import {
  isPublishableValue,
  mediaFit,
  mediaPosition,
  recordText,
  visibleByPosition,
} from "../media-kit-contract";
import styles from "../MediaKitPreview.module.css";

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
  metadata: Record<string, unknown>;
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
  settings: Record<string, unknown>;
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

const allowedIcons = new Set<IconName>([
  "activity","artists","calendar","chart","document","external","mail","media",
  "pages","plus","posts","smartphone","target","users",
]);

function iconName(value: string): IconName {
  return allowedIcons.has(value as IconName) ? value as IconName : "document";
}

function numberValue(record: Record<string, unknown> | undefined, key: string) {
  const value = record?.[key];
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
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

function publishableValue(item: PreviewItem, real: RealData) {
  const value = resolveValue(item, real);
  return isPublishableValue(value) ? value : "";
}

function meaningfulItem(item: PreviewItem, real: RealData) {
  return Boolean(
    item.mediaUrl ||
    item.title.trim() ||
    item.subtitle.trim() ||
    item.body.trim() ||
    item.label.trim() ||
    item.url.trim() ||
    publishableValue(item, real),
  );
}

function imageStyle(section: PreviewSection): React.CSSProperties {
  return { objectFit: mediaFit(section.settings), objectPosition: mediaPosition(section.settings) };
}

function coverHeadline(title: string) {
  const normalized = title.trim();
  const match = normalized.match(/^(.*?)([^\s]+[.!?]?)$/);
  if (!match) return normalized;
  return <>{match[1]}<em>{match[2]}</em></>;
}

function Brand({ dark = false }: { dark?: boolean }) {
  return <div className={styles.brand}>
    <span className={styles.brandMark} aria-hidden="true"><i/><i/></span>
    <div>
      <strong>LANDER <b>RECORDS</b></strong>
      <small className={dark ? styles.mutedDark : undefined}>MÚSICA · ARTISTAS · NEGÓCIOS · OPORTUNIDADES</small>
    </div>
  </div>;
}

function PageShell({
  settings,
  section,
  pageNumber,
  children,
  forceDark = false,
  forceLight = false,
}: {
  settings: PreviewSettings;
  section: PreviewSection;
  pageNumber: number;
  children: React.ReactNode;
  forceDark?: boolean;
  forceLight?: boolean;
}) {
  const dark = forceDark ? true : forceLight ? false : section.theme === "dark";
  const footerNote = recordText(section.settings, "footerNote", section.eyebrow || "INFORMAÇÃO QUE MOVE O MERCADO");
  return <article
    className={[styles.page, dark ? styles.pageDark : styles.pageLight].join(" ")}
    data-preview-version="reference-portrait-v1"
    data-section-type={section.type}
  >
    <header className={styles.pageHeader}>
      <Brand dark={dark}/>
      <div className={styles.pageMeta}>
        <span>{settings.documentTitle.toUpperCase()} {settings.edition}</span>
        {settings.showPageNumbers ? <strong>{String(pageNumber).padStart(2,"0")}</strong> : null}
      </div>
    </header>
    <div className={styles.pageBody}>{children}</div>
    <footer className={styles.pageFooter}>
      <span>{settings.footerWebsite.toUpperCase()}</span>
      <span className={dark ? styles.mutedDark : undefined}>{footerNote}</span>
    </footer>
  </article>;
}

function SectionHeading({
  section,
  fallbackTitle,
  compact = false,
}: {
  section: PreviewSection;
  fallbackTitle: string;
  compact?: boolean;
}) {
  return <div className={compact ? styles.headingCompact : styles.heading}>
    {section.eyebrow ? <span>{section.eyebrow}</span> : null}
    <h3>{section.title || fallbackTitle}</h3>
    <i/>
    {section.subtitle ? <strong>{section.subtitle}</strong> : null}
    {section.body ? <div>{section.body.split(/\n{2,}/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div> : null}
  </div>;
}

function CoverPage({
  settings,
  section,
  pageNumber,
  real,
}: {
  settings: PreviewSettings;
  section: PreviewSection;
  pageNumber: number;
  real: RealData;
}) {
  const items = visibleByPosition(section.items).filter((item) => meaningfulItem(item, real));
  const deviceItem = items.find((item) => item.mediaUrl);
  const highlights = items.filter((item) => item.id !== deviceItem?.id).slice(0, 4);

  return <PageShell settings={settings} section={section} pageNumber={pageNumber} forceDark>
    <div className={styles.cover}>
      {section.mediaUrl ? <img className={styles.coverBackdrop} src={section.mediaUrl} alt="" style={imageStyle(section)}/> : null}
      <div className={styles.coverShade}/>
      <div className={styles.coverTopNote}>{recordText(section.settings, "coverSideNote", "INFORMAÇÃO, MÚSICA E OPORTUNIDADES.")}</div>
      <div className={styles.coverCopy}>
        <span>{section.eyebrow || "LANDER RECORDS · " + settings.edition}</span>
        <h2>{coverHeadline(section.title || "CONECTANDO ARTISTAS, MÚSICA E OPORTUNIDADES.")}</h2>
        <i/>
        {section.subtitle ? <strong>{section.subtitle}</strong> : null}
        {section.body ? <p>{section.body}</p> : null}
      </div>
      <div className={styles.coverDevice}>
        <div className={styles.deviceBar}><b>LANDER RECORDS</b><span>ARTISTAS · LANÇAMENTOS · NOTÍCIAS</span></div>
        <div className={styles.deviceHero}>
          {deviceItem?.mediaUrl ? <img src={deviceItem.mediaUrl} alt={deviceItem.title || "Site Lander Records"}/> : null}
          <strong>{recordText(section.settings, "mockupLabel", "MÚSICA MOVE PESSOAS.")}</strong>
        </div>
        <div className={styles.deviceTiles}><i/><i/><i/><i/></div>
      </div>
      {highlights.length ? <div className={styles.coverMetrics} data-reference-slot="cover-highlights">
        {highlights.map((item) => <div key={item.id}>
          <AdminIcon name={iconName(item.icon)} size={18}/>
          <strong>{item.title || item.label}</strong>
          {publishableValue(item, real) !== "" ? <b>{String(publishableValue(item, real))}</b> : null}
          {item.subtitle ? <small>{item.subtitle}</small> : null}
        </div>)}
      </div> : null}
    </div>
  </PageShell>;
}

function AboutPage({
  settings,
  section,
  pageNumber,
  real,
}: {
  settings: PreviewSettings;
  section: PreviewSection;
  pageNumber: number;
  real: RealData;
}) {
  const metrics = visibleByPosition(section.items)
    .filter((item) => meaningfulItem(item, real) && publishableValue(item, real) !== "")
    .slice(0, 5);

  return <PageShell settings={settings} section={section} pageNumber={pageNumber} forceLight>
    <div className={styles.about}>
      <div className={styles.aboutIntro}>
        <SectionHeading section={section} fallbackTitle="SOBRE A LANDER RECORDS"/>
        <aside className={styles.aboutVisual}>
          {section.mediaUrl ? <img src={section.mediaUrl} alt={section.title || "Lander Records"} style={imageStyle(section)}/> : null}
          <div className={styles.aboutVisualShade}/>
          <strong>{recordText(section.settings, "sideTitle", "MÚSICA, NEGÓCIOS, TENDÊNCIAS E OPORTUNIDADES EM UM SÓ LUGAR.")}</strong>
          <i/>
        </aside>
      </div>
      <div className={styles.aboutMetrics} data-reference-slot="about-kpis">
        {metrics.map((item) => <div key={item.id}>
          <AdminIcon name={iconName(item.icon)} size={18}/>
          <b>{String(publishableValue(item, real))}</b>
          <strong>{item.title || item.label}</strong>
          {item.subtitle ? <small>{item.subtitle}</small> : null}
        </div>)}
      </div>
      <div className={styles.aboutBanner}>
        {section.mediaUrl ? <img src={section.mediaUrl} alt="" style={imageStyle(section)}/> : null}
        <div/>
        <strong>{recordText(section.settings, "bannerTitle", "CONTEÚDO QUE GERA VISIBILIDADE REAL PARA ARTISTAS E MARCAS.")}</strong>
        <i/>
      </div>
    </div>
  </PageShell>;
}

function AudiencePage({
  settings,
  section,
  pageNumber,
}: {
  settings: PreviewSettings;
  section: PreviewSection;
  pageNumber: number;
}) {
  const items = visibleByPosition(section.items);
  const group = (name: string) => items.filter((item) => recordText(item.metadata, "group") === name);
  const measurable = (rows: PreviewItem[]) => rows.filter((item) => numberValue(item.metadata, "percentage") > 0);
  const genders = measurable(group("gender")).slice(0, 2);
  const ages = measurable(group("age")).slice(0, 5);
  const interests = group("interest").filter((item) => item.title.trim()).slice(0, 6);
  const cities = measurable(group("city")).slice(0, 6);
  const firstGender = numberValue(genders[0]?.metadata, "percentage");
  const displayPercent = (item: PreviewItem) => numberValue(item.metadata, "percentage") + "%";

  return <PageShell settings={settings} section={section} pageNumber={pageNumber} forceLight>
    <div className={styles.audience}>
      <SectionHeading section={section} fallbackTitle="NOSSA AUDIÊNCIA" compact/>
      <div className={styles.audienceGrid} data-reference-slot="audience-grid">
        <section className={styles.audiencePanel}>
          <h4>PERFIL DO PÚBLICO</h4>
          <div className={styles.donut} style={{background:`conic-gradient(#ed1c24 0 ${firstGender}%,#22262b ${firstGender}% 100%)`}}>
            <div><strong>{genders[0] ? displayPercent(genders[0]) : "—"}</strong></div>
          </div>
          <div className={styles.legend}>
            {genders.map((item,index) => <span key={item.id}><i className={index===0?styles.redDot:styles.blackDot}/>{item.title}<b>{displayPercent(item)}</b></span>)}
          </div>
        </section>
        <section className={styles.audiencePanel}>
          <h4>FAIXA ETÁRIA</h4>
          <div className={styles.barList}>
            {ages.map((item)=><div key={item.id}><span>{item.title}</span><i><b style={{width:displayPercent(item)}}/></i><strong>{displayPercent(item)}</strong></div>)}
          </div>
        </section>
        <section className={styles.audiencePanel}>
          <h4>PRINCIPAIS INTERESSES</h4>
          <div className={styles.interestList}>
            {interests.map((item)=><div key={item.id}><AdminIcon name={iconName(item.icon)} size={14}/><span>{item.title}</span></div>)}
          </div>
        </section>
        <section className={styles.audiencePanel}>
          <h4>PRINCIPAIS CIDADES</h4>
          <div className={styles.barList}>
            {cities.map((item)=><div key={item.id}><span>{item.title}</span><i><b style={{width:displayPercent(item)}}/></i><strong>{displayPercent(item)}</strong></div>)}
          </div>
        </section>
      </div>
    </div>
  </PageShell>;
}

function AdvertisingPage({
  settings,
  section,
  pageNumber,
  real,
}: {
  settings: PreviewSettings;
  section: PreviewSection;
  pageNumber: number;
  real: RealData;
}) {
  const items = visibleByPosition(section.items).filter((item)=>meaningfulItem(item,real)).slice(0,6);
  return <PageShell settings={settings} section={section} pageNumber={pageNumber} forceLight>
    <div className={styles.advertising}>
      <SectionHeading section={section} fallbackTitle="FORMATOS DE PUBLICIDADE" compact/>
      <div className={styles.adGrid} data-reference-slot="advertising-grid">
        {items.map((item,index)=><article key={item.id}>
          <h4>{item.title || item.label}</h4>
          <div className={styles.adVisual}>
            {item.mediaUrl ? <img src={item.mediaUrl} alt={item.title || item.label}/> : <div className={styles.adVisualFallback}><AdminIcon name={iconName(item.icon)} size={22}/><strong>{index===2?"ANUNCIE AQUI":item.title}</strong></div>}
          </div>
          {item.body ? <p>{item.body}</p> : null}
        </article>)}
      </div>
    </div>
  </PageShell>;
}

function ApplicationPage({
  settings,
  section,
  pageNumber,
  real,
}: {
  settings: PreviewSettings;
  section: PreviewSection;
  pageNumber: number;
  real: RealData;
}) {
  const items = visibleByPosition(section.items).filter((item)=>meaningfulItem(item,real)).slice(0,4);
  const classes=[styles.calloutTop,styles.calloutRight,styles.calloutBottom,styles.calloutLeft];
  return <PageShell settings={settings} section={section} pageNumber={pageNumber} forceLight>
    <div className={styles.application}>
      <SectionHeading section={section} fallbackTitle="EXEMPLO DE APLICAÇÃO" compact/>
      <div className={styles.applicationStage} data-reference-slot="application-example">
        <div className={styles.siteMockup}>
          <div className={styles.siteMockupBar}><Brand/><span>ARTISTAS · LANÇAMENTOS · NOTÍCIAS</span></div>
          <div className={styles.siteMockupHero}>
            {section.mediaUrl ? <img src={section.mediaUrl} alt="Aplicação comercial no site Lander Records" style={imageStyle(section)}/> : null}
            <strong>LANDER RECORDS</strong>
          </div>
          <div className={styles.siteMockupContent}><i/><i/><i/><i/></div>
          <aside>ANUNCIE<br/>AQUI <b>→</b></aside>
        </div>
        {items.map((item,index)=><div className={[styles.applicationCallout,classes[index]].join(" ")} key={item.id}>{item.title || item.label}</div>)}
      </div>
    </div>
  </PageShell>;
}

function ArtistsPage({
  settings,
  section,
  pageNumber,
  real,
}: {
  settings: PreviewSettings;
  section: PreviewSection;
  pageNumber: number;
  real: RealData;
}) {
  const featured=real.artists[0];
  return <PageShell settings={settings} section={section} pageNumber={pageNumber} forceLight>
    <div className={styles.artistExtra}>
      <SectionHeading section={section} fallbackTitle="ARTISTAS & DESTAQUES" compact/>
      <div className={styles.artistExtraCard}>
        {section.mediaUrl ? <img src={section.mediaUrl} alt={featured?.name || "Artista Lander Records"} style={imageStyle(section)}/> : null}
        <div><span>{recordText(section.settings,"featuredLabel","ARTISTA EM DESTAQUE")}</span><strong>{featured?.name || "LANDER RECORDS"}</strong><p>{featured?.shortBio || "Talentos, identidade e desenvolvimento artístico."}</p></div>
      </div>
    </div>
  </PageShell>;
}

function ContactPage({
  settings,
  section,
  pageNumber,
  real,
}: {
  settings: PreviewSettings;
  section: PreviewSection;
  pageNumber: number;
  real: RealData;
}) {
  const contacts=visibleByPosition(section.items)
    .map((item)=>({item,value:publishableValue(item,real)}))
    .filter(({value})=>value!=="")
    .slice(0,5);

  return <PageShell settings={settings} section={section} pageNumber={pageNumber} forceLight>
    <div className={styles.contact} data-reference-slot="contact-grid">
      <section className={styles.contactMain}>
        <SectionHeading section={section} fallbackTitle="VAMOS CONSTRUIR ALGO GRANDE JUNTOS?"/>
        {section.ctaLabel && section.ctaUrl ? <a className={styles.contactCta} href={section.ctaUrl}>{section.ctaLabel}<span>→</span></a> : null}
        <div className={styles.contactList}>
          {contacts.map(({item,value})=><p key={item.id}><AdminIcon name={iconName(item.icon)} size={14}/><span>{String(value)}</span></p>)}
        </div>
      </section>
      <aside className={styles.nextSteps}>
        {section.mediaUrl ? <img src={section.mediaUrl} alt="" style={imageStyle(section)}/> : null}
        <div className={styles.nextStepsShade}/>
        <div className={styles.nextStepsCopy}>
          <strong>{recordText(section.settings,"nextStepsTitle","PRÓXIMOS PASSOS")}</strong>
          <i/>
          <p>{recordText(section.settings,"nextStepsBody","Briefing, alinhamento de objetivos, proposta e plano de execução.")}</p>
          <Brand dark/>
          <small>{recordText(section.settings,"closingSlogan","MÚSICA QUE APROXIMA PESSOAS.")}</small>
        </div>
      </aside>
    </div>
  </PageShell>;
}

function GenericPage({
  settings,
  section,
  pageNumber,
  real,
}: {
  settings: PreviewSettings;
  section: PreviewSection;
  pageNumber: number;
  real: RealData;
}) {
  const items=visibleByPosition(section.items).filter((item)=>meaningfulItem(item,real)).slice(0,6);
  return <PageShell settings={settings} section={section} pageNumber={pageNumber}>
    <div className={styles.generic}>
      <SectionHeading section={section} fallbackTitle="CONTEÚDO" compact/>
      <div className={styles.genericGrid}>
        {items.map((item)=><article key={item.id}>
          {item.mediaUrl ? <img src={item.mediaUrl} alt={item.title || item.label}/> : null}
          <AdminIcon name={iconName(item.icon)} size={16}/>
          <strong>{item.title || item.label}</strong>
          {item.body ? <p>{item.body}</p> : null}
        </article>)}
      </div>
    </div>
  </PageShell>;
}

function DynamicPage({
  settings,
  section,
  pageNumber,
  real,
}: {
  settings: PreviewSettings;
  section: PreviewSection;
  pageNumber: number;
  real: RealData;
}) {
  if(section.type==="cover") return <CoverPage settings={settings} section={section} pageNumber={pageNumber} real={real}/>;
  if(section.type==="editorial"||section.type==="metrics") return <AboutPage settings={settings} section={section} pageNumber={pageNumber} real={real}/>;
  if(section.type==="audience") return <AudiencePage settings={settings} section={section} pageNumber={pageNumber}/>;
  if(section.type==="cards") return <AdvertisingPage settings={settings} section={section} pageNumber={pageNumber} real={real}/>;
  if(section.type==="application") return <ApplicationPage settings={settings} section={section} pageNumber={pageNumber} real={real}/>;
  if(section.type==="artists") return <ArtistsPage settings={settings} section={section} pageNumber={pageNumber} real={real}/>;
  if(section.type==="contact") return <ContactPage settings={settings} section={section} pageNumber={pageNumber} real={real}/>;
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
  const visibleSections=visibleByPosition(sections);
  if(!visibleSections.length) return <div className={styles.empty}><AdminIcon name="document" size={28}/><strong>Nenhuma seção visível</strong><span>Adicione ou ative uma seção no editor para montar o Mídia Kit.</span></div>;
  return <div className={styles.deck} data-testid="media-kit-preview-deck">
    {visibleSections.map((section,index)=><DynamicPage key={section.id} settings={settings} section={section} pageNumber={index+1} real={real}/>)}
  </div>;
}
