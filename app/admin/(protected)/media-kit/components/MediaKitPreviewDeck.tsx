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

const allowedIcons = new Set<IconName>(["activity","artists","calendar","chart","document","external","mail","media","pages","plus","posts","smartphone","target","users"]);

function iconName(value: string): IconName {
  return allowedIcons.has(value as IconName) ? value as IconName : "document";
}

function textValue(record: Record<string, unknown> | undefined, key: string, fallback = "") {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function numberValue(record: Record<string, unknown> | undefined, key: string) {
  const value = record?.[key];
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
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
  return <div className={styles.refBrand}>
    <span className={styles.refBrandMark} aria-hidden="true"><i/><i/><i/><i/><i/></span>
    <div><strong>LANDER <b>RECORDS</b></strong><small className={dark ? styles.refMutedDark : undefined}>MÚSICA · ARTISTAS · CULTURA · OPORTUNIDADES</small></div>
  </div>;
}

function PageShell({
  settings,
  section,
  pageNumber,
  children,
  forceDark = false,
}: {
  settings: PreviewSettings;
  section: PreviewSection;
  pageNumber: number;
  children: React.ReactNode;
  forceDark?: boolean;
}) {
  const dark = forceDark || section.theme === "dark";
  const footerNote = textValue(section.settings, "footerNote", section.eyebrow || "LANDER RECORDS");
  return <article className={[styles.mkPage, dark ? styles.mkPageDark : styles.mkPageLight].join(" ")} data-section-type={section.type}>
    <header className={styles.refPageHeader}>
      <Brand dark={dark}/>
      <div className={styles.refPageMeta}><span>{settings.documentTitle.toUpperCase()} {settings.edition}</span>{settings.showPageNumbers ? <strong>{String(pageNumber).padStart(2,"0")}</strong> : null}</div>
    </header>
    {children}
    <footer className={styles.refPageFooter}><span>{settings.footerWebsite.toUpperCase()}</span><span className={dark ? styles.refMutedDark : undefined}>{footerNote}</span></footer>
  </article>;
}

function SectionHeading({ section }: { section: PreviewSection }) {
  return <div className={styles.refSectionHeading}>
    {section.eyebrow ? <span>{section.eyebrow}</span> : null}
    <h3>{section.title || "Seção sem título"}</h3>
    <i/>
    {section.subtitle ? <strong>{section.subtitle}</strong> : null}
    {section.body ? <div>{section.body.split(/\n{2,}/).map((paragraph)=><p key={paragraph}>{paragraph}</p>)}</div> : null}
  </div>;
}

function FallbackDevice({ label }: { label: string }) {
  return <div className={styles.refDevice}>
    <div className={styles.refDeviceBar}><span>LANDER RECORDS</span><small>ARTISTAS · LANÇAMENTOS · NOTÍCIAS</small></div>
    <div className={styles.refDeviceHero}><strong>{label}</strong><span>▶</span></div>
    <div className={styles.refDeviceTiles}><i/><i/><i/><i/></div>
  </div>;
}

function CoverPage({ settings, section, pageNumber, real }: { settings: PreviewSettings; section: PreviewSection; pageNumber: number; real: RealData }) {
  const items = section.items.filter((item)=>item.enabled).sort((a,b)=>a.position-b.position);
  const visualItem = items.find((item)=>item.mediaUrl);
  const highlights = items.slice(0,4);
  const background = section.mediaUrl ? { backgroundImage: `linear-gradient(90deg,rgba(5,6,8,.94),rgba(5,6,8,.38)),url("${section.mediaUrl}")` } : undefined;
  return <PageShell settings={settings} section={section} pageNumber={pageNumber} forceDark>
    <div className={styles.refCover} style={background}>
      <div className={styles.refCoverCopy}>
        <span className={styles.refKicker}>{section.eyebrow || "LANDER RECORDS · "+settings.edition}</span>
        <h3>{section.title || "CONECTANDO ARTISTAS, MÚSICA E OPORTUNIDADES."}</h3>
        <i className={styles.refRedRule}/>
        {section.subtitle ? <strong>{section.subtitle}</strong> : null}
        {section.body ? <p>{section.body}</p> : null}
        {section.ctaLabel && section.ctaUrl ? <a href={section.ctaUrl}>{section.ctaLabel}<span>→</span></a> : null}
      </div>
      <div className={styles.refCoverVisual}>
        <small>{textValue(section.settings,"coverSideNote","O SOM DE NOVAS POSSIBILIDADES.")}</small>
        {visualItem ? <div className={styles.refUploadedDevice}><img src={visualItem.mediaUrl} alt={visualItem.title || "Imagem do Mídia Kit"}/></div> : <FallbackDevice label={textValue(section.settings,"mockupLabel","MÚSICA MOVE PESSOAS.")}/>}
      </div>
    </div>
    <div className={styles.refCoverHighlights}>
      {highlights.map((item)=><div key={item.id}><AdminIcon name={iconName(item.icon)} size={18}/><strong>{item.title || item.label}</strong><span>{String(resolveValue(item,real) || "")}</span><small>{item.subtitle}</small></div>)}
    </div>
  </PageShell>;
}

function AboutPage({ settings, section, pageNumber, real }: { settings: PreviewSettings; section: PreviewSection; pageNumber: number; real: RealData }) {
  const metrics = section.items.filter((item)=>item.enabled).sort((a,b)=>a.position-b.position).slice(0,5);
  const sideTitle = textValue(section.settings,"sideTitle","MÚSICA, NEGÓCIOS, TENDÊNCIAS E OPORTUNIDADES EM UM SÓ LUGAR.");
  const sideCaption = textValue(section.settings,"sideCaption","TALENTOS HOJE. GRANDES AMANHÃ.");
  const bannerTitle = textValue(section.settings,"bannerTitle","VISIBILIDADE, CREDIBILIDADE E RELEVÂNCIA PARA ARTISTAS E MARCAS.");
  const bannerNote = textValue(section.settings,"bannerNote","MÚSICA · CULTURA · OPORTUNIDADES");
  const visualStyle = section.mediaUrl ? { backgroundImage:`linear-gradient(180deg,#1112,#111d),url("${section.mediaUrl}")` } : undefined;
  return <PageShell settings={settings} section={section} pageNumber={pageNumber}>
    <div className={styles.refAboutBody}>
      <div className={styles.refAboutTop}>
        <SectionHeading section={section}/>
        <aside className={styles.refAboutVisual} style={visualStyle}><strong>{sideTitle}</strong><i className={styles.refRedRule}/><small>{sideCaption}</small></aside>
      </div>
      <div className={styles.refKpis}>{metrics.map((item)=><div key={item.id}><AdminIcon name={iconName(item.icon)} size={18}/><strong>{String(resolveValue(item,real) || "—")}</strong><span>{item.title || item.label}</span><small>{item.subtitle}</small></div>)}</div>
      <div className={styles.refAboutBanner} style={visualStyle}><strong>{bannerTitle}</strong><span>{bannerNote}</span></div>
    </div>
  </PageShell>;
}

function AudiencePage({ settings, section, pageNumber }: { settings: PreviewSettings; section: PreviewSection; pageNumber: number }) {
  const items = section.items.filter((item)=>item.enabled).sort((a,b)=>a.position-b.position);
  const group = (name: string) => items.filter((item)=>textValue(item.metadata,"group")===name);
  const genders = group("gender");
  const ages = group("age");
  const interests = group("interest");
  const cities = group("city");
  const firstGender = numberValue(genders[0]?.metadata,"percentage");
  const totalGender = genders.reduce((sum,item)=>sum+numberValue(item.metadata,"percentage"),0);
  const donutStyle = totalGender > 0 ? { background:`conic-gradient(#ed1c24 0 ${firstGender}%,#17191d ${firstGender}% 100%)` } : undefined;
  const displayPercent = (item: PreviewItem) => {
    const percentage=numberValue(item.metadata,"percentage");
    return percentage > 0 ? percentage+"%" : "—";
  };
  return <PageShell settings={settings} section={section} pageNumber={pageNumber}>
    <div className={styles.refAudienceBody}>
      <SectionHeading section={section}/>
      <div className={styles.refAudienceGrid}>
        <section className={styles.refAudiencePanel}><h4>PERFIL DO PÚBLICO</h4><div className={[styles.refDonut,totalGender===0?styles.refDonutEmpty:""].join(" ")} style={donutStyle}><div><strong>{totalGender>0?displayPercent(genders[0]):"—"}</strong><small>{totalGender>0?(genders[0]?.title||"Perfil"):"A INTEGRAR"}</small></div></div><div className={styles.refLegend}>{genders.slice(0,2).map((item,index)=><span key={item.id}><i className={index===0?styles.refLegendRed:styles.refLegendBlack}/>{item.title}<b>{displayPercent(item)}</b></span>)}</div></section>
        <section className={styles.refAudiencePanel}><h4>FAIXA ETÁRIA</h4><div className={styles.refBarList}>{ages.map((item)=><div key={item.id}><span>{item.title}</span><i><b style={{width:numberValue(item.metadata,"percentage")+"%"}}/></i><strong>{displayPercent(item)}</strong></div>)}</div></section>
        <section className={styles.refAudiencePanel}><h4>PRINCIPAIS INTERESSES</h4><div className={styles.refInterestList}>{interests.map((item)=><div key={item.id}><AdminIcon name={iconName(item.icon)} size={14}/><span>{item.title}</span><strong>{displayPercent(item)}</strong></div>)}</div></section>
        <section className={styles.refAudiencePanel}><h4>PRINCIPAIS CIDADES</h4><div className={styles.refBarList}>{cities.map((item)=><div key={item.id}><span>{item.title}</span><i><b style={{width:numberValue(item.metadata,"percentage")+"%"}}/></i><strong>{displayPercent(item)}</strong></div>)}</div></section>
      </div>
      <div className={styles.refAudienceNote}>{textValue(section.settings,"dataNote","PREENCHA APENAS MÉTRICAS VERIFICADAS")}</div>
    </div>
  </PageShell>;
}

function PartnershipPage({ settings, section, pageNumber }: { settings: PreviewSettings; section: PreviewSection; pageNumber: number }) {
  const items=section.items.filter((item)=>item.enabled).sort((a,b)=>a.position-b.position);
  return <PageShell settings={settings} section={section} pageNumber={pageNumber}>
    <div className={styles.refPartnershipBody}>
      <SectionHeading section={section}/>
      <div className={styles.refPartnerGrid}>{items.map((item)=><article key={item.id}>
        <div className={styles.refPartnerVisual} style={item.mediaUrl?{backgroundImage:`linear-gradient(#1112,#1119),url("${item.mediaUrl}")`}:undefined}><AdminIcon name={iconName(item.icon)} size={20}/><span>LANDER RECORDS</span></div>
        <h4>{item.title || item.label}</h4>{item.body?<p>{item.body}</p>:null}{item.url?<a href={item.url}>Saiba mais →</a>:null}
      </article>)}</div>
    </div>
  </PageShell>;
}

function ArtistsPage({ settings, section, pageNumber, real }: { settings: PreviewSettings; section: PreviewSection; pageNumber: number; real: RealData }) {
  const opportunities=section.items.filter((item)=>item.enabled).sort((a,b)=>a.position-b.position);
  const featured=real.artists[0];
  const featuredStyle=section.mediaUrl?{backgroundImage:`linear-gradient(0deg,#090a0ef0,#090a0e20),url("${section.mediaUrl}")`}:undefined;
  return <PageShell settings={settings} section={section} pageNumber={pageNumber}>
    <div className={styles.refArtistsBody}>
      <SectionHeading section={section}/>
      <div className={styles.refArtistsGrid}>
        <section className={styles.refReleaseColumn}><h4>LANÇAMENTOS RECENTES</h4>{real.releases.length?real.releases.slice(0,4).map((release)=><div key={release.artistName+"-"+release.title}><i/><p><strong>{release.artistName}</strong><b>{release.title}</b><small>{release.releaseType}{releaseYear(release.releaseDate)?" · "+releaseYear(release.releaseDate):""}</small></p></div>):<p className={styles.refEmpty}>Nenhum lançamento ativo.</p>}</section>
        <section className={styles.refFeaturedArtist} style={featuredStyle}><span>{textValue(section.settings,"featuredLabel","ARTISTA EM DESTAQUE")}</span><strong>{featured?.name || "Destaque a definir"}</strong><p>{featured?.shortBio || featured?.eyebrow || "Selecione artistas publicados para alimentar automaticamente este espaço."}</p><div><i/><i/><i/><i/></div></section>
        <section className={styles.refOpportunityColumn}><h4>OPORTUNIDADES DE EXPOSIÇÃO</h4>{opportunities.map((item)=><div key={item.id}><span>+</span><p><strong>{item.title}</strong>{item.body?<small>{item.body}</small>:null}</p></div>)}</section>
      </div>
      <blockquote className={styles.refQuote}>“{textValue(section.settings,"quote","Mais que uma gravadora, é uma parceira de verdade.")}” <strong>— {textValue(section.settings,"quoteAuthor","Crédito a definir")}</strong></blockquote>
    </div>
  </PageShell>;
}

function ContactPage({ settings, section, pageNumber, real }: { settings: PreviewSettings; section: PreviewSection; pageNumber: number; real: RealData }) {
  const contacts=section.items.filter((item)=>item.enabled).sort((a,b)=>a.position-b.position);
  const panelStyle=section.mediaUrl?{backgroundImage:`linear-gradient(180deg,#090a0dbe,#090a0df3),url("${section.mediaUrl}")`}:undefined;
  return <PageShell settings={settings} section={section} pageNumber={pageNumber}>
    <div className={styles.refContactBody}>
      <section className={styles.refContactMain}>
        <SectionHeading section={section}/>
        {section.ctaLabel&&section.ctaUrl?<a className={styles.refContactCta} href={section.ctaUrl}>{section.ctaLabel}<span>→</span></a>:null}
        <div className={styles.refContactList}>{contacts.map((item)=><p key={item.id}><AdminIcon name={iconName(item.icon)} size={14}/><span>{String(resolveValue(item,real) || item.value || "Não configurado")}</span></p>)}</div>
      </section>
      <aside className={styles.refNextSteps} style={panelStyle}><div><span>{textValue(section.settings,"nextStepsTitle","PRÓXIMOS PASSOS")}</span><i className={styles.refRedRule}/><p>{textValue(section.settings,"nextStepsBody","Seguimos evoluindo para criar novas oportunidades, conectar talentos e levar a música ainda mais longe.")}</p></div><div><strong>LANDER <b>RECORDS</b></strong><small>{textValue(section.settings,"closingSlogan","MÚSICA QUE APROXIMA PESSOAS.")}</small></div></aside>
    </div>
  </PageShell>;
}

function GenericPage({ settings, section, pageNumber, real }: { settings: PreviewSettings; section: PreviewSection; pageNumber: number; real: RealData }) {
  const items=section.items.filter((item)=>item.enabled).sort((a,b)=>a.position-b.position);
  return <PageShell settings={settings} section={section} pageNumber={pageNumber}>
    <div className={styles.refGenericBody}><SectionHeading section={section}/><div className={styles.refGenericGrid}>{items.map((item)=><article key={item.id}>{item.mediaUrl?<img src={item.mediaUrl} alt={item.title||item.label}/>:null}<AdminIcon name={iconName(item.icon)} size={17}/><h4>{item.title||item.label}</h4>{resolveValue(item,real)?<strong>{String(resolveValue(item,real))}</strong>:null}{item.subtitle?<span>{item.subtitle}</span>:null}{item.body?<p>{item.body}</p>:null}</article>)}</div></div>
  </PageShell>;
}

function DynamicPage({ settings, section, pageNumber, real }: { settings: PreviewSettings; section: PreviewSection; pageNumber: number; real: RealData }) {
  if (section.type === "cover") return <CoverPage settings={settings} section={section} pageNumber={pageNumber} real={real}/>;
  if (section.type === "editorial" || section.type === "metrics") return <AboutPage settings={settings} section={section} pageNumber={pageNumber} real={real}/>;
  if (section.type === "audience") return <AudiencePage settings={settings} section={section} pageNumber={pageNumber}/>;
  if (section.type === "cards") return <PartnershipPage settings={settings} section={section} pageNumber={pageNumber}/>;
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
  const visibleSections=sections.filter((section)=>section.enabled).sort((a,b)=>a.position-b.position);
  if (!visibleSections.length) return <div className={styles.mkPreviewEmpty}><AdminIcon name="document" size={28}/><strong>Nenhuma seção visível</strong><span>Adicione ou ative uma seção no editor para montar o Mídia Kit.</span></div>;
  return <div className={styles.mkDeck} data-testid="media-kit-preview-deck">
    {visibleSections.map((section,index)=><DynamicPage key={section.id} settings={settings} section={section} pageNumber={index+1} real={real}/>)}
  </div>;
}
