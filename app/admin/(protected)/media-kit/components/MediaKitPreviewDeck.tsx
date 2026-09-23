import { AdminIcon, type IconName } from "../../../components/AdminIcon";
import {
  isPublishableValue,
  mediaFit,
  mediaPosition,
  recordText,
  visibleByPosition,
} from "../media-kit-contract";
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

function releaseYear(value: string | Date | null) {
  if (!value) return "";
  if (value instanceof Date) return String(value.getUTCFullYear());
  return value.slice(0, 4);
}

function coverHeadline(title: string) {
  const normalized = title.trim();
  const match = normalized.match(/^(.*?)([^\s]+[.!?]?)$/);
  if (!match) return normalized;
  return <>{match[1]}<em>{match[2]}</em></>;
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
  return {
    objectFit: mediaFit(section.settings),
    objectPosition: mediaPosition(section.settings),
  };
}

function backgroundStyle(section: PreviewSection, overlay: string): React.CSSProperties | undefined {
  if (!section.mediaUrl) return undefined;
  return {
    backgroundImage: overlay + ',url("' + section.mediaUrl + '")',
    backgroundSize: mediaFit(section.settings) === "contain" ? "contain" : "cover",
    backgroundPosition: mediaPosition(section.settings),
    backgroundRepeat: "no-repeat",
  };
}

function Brand({ dark = false }: { dark?: boolean }) {
  return <div className={styles.refBrand}>
    <span className={styles.refBrandMark} aria-hidden="true"><i/><i/><i/><i/><i/></span>
    <div>
      <strong>LANDER <b>RECORDS</b></strong>
      <small className={dark ? styles.refMutedDark : undefined}>MÚSICA · ARTISTAS · CULTURA · OPORTUNIDADES</small>
    </div>
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
  const footerNote = recordText(section.settings, "footerNote", section.eyebrow || "LANDER RECORDS");
  return <article
    className={[styles.mkPage, dark ? styles.mkPageDark : styles.mkPageLight].join(" ")}
    data-section-type={section.type}
  >
    <header className={styles.refPageHeader}>
      <Brand dark={dark}/>
      <div className={styles.refPageMeta}>
        <span>{settings.documentTitle.toUpperCase()} {settings.edition}</span>
        {settings.showPageNumbers ? <strong>{String(pageNumber).padStart(2,"0")}</strong> : null}
      </div>
    </header>
    {children}
    <footer className={styles.refPageFooter}>
      <span>{settings.footerWebsite.toUpperCase()}</span>
      <span className={dark ? styles.refMutedDark : undefined}>{footerNote}</span>
    </footer>
  </article>;
}

function SectionHeading({ section }: { section: PreviewSection }) {
  return <div className={styles.refSectionHeading}>
    {section.eyebrow ? <span>{section.eyebrow}</span> : null}
    {section.title ? <h3>{section.title}</h3> : null}
    <i/>
    {section.subtitle ? <strong>{section.subtitle}</strong> : null}
    {section.body ? <div>{section.body.split(/\n{2,}/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div> : null}
  </div>;
}

function LaptopMockup({
  imageUrl,
  label,
  alt,
}: {
  imageUrl?: string;
  label: string;
  alt: string;
}) {
  return <div className={styles.refLaptopMockup} data-testid="media-kit-cover-laptop">
    <div className={styles.refLaptopLid}>
      <div className={styles.refLaptopScreen}>
        {imageUrl
          ? <img src={imageUrl} alt={alt}/>
          : <div className={styles.refLaptopFallback}>
              <div className={styles.refLaptopNav}><strong>LANDER RECORDS</strong><span>ARTISTAS · LANÇAMENTOS · NOTÍCIAS</span></div>
              <div className={styles.refLaptopHero}><strong>{label}</strong><span>▶</span></div>
              <div className={styles.refLaptopTiles}><i/><i/><i/><i/></div>
            </div>}
      </div>
    </div>
    <div className={styles.refLaptopBase}><i/></div>
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
  const visualItem = items.find((item) => item.mediaUrl);
  const highlights = items.slice(0, 4);
  return <PageShell settings={settings} section={section} pageNumber={pageNumber} forceDark>
    <div className={styles.refCoverPageBody}>
      <div className={styles.refCover} style={backgroundStyle(section, "linear-gradient(90deg,rgba(5,6,8,.96),rgba(5,6,8,.48))")}>
        <div className={styles.refCoverCopy}>
          <span className={styles.refKicker}>{section.eyebrow || "LANDER RECORDS · " + settings.edition}</span>
          <h3>{coverHeadline(section.title || "CONECTANDO ARTISTAS, MÚSICA E OPORTUNIDADES.")}</h3>
          <i className={styles.refRedRule}/>
          {section.subtitle ? <strong>{section.subtitle}</strong> : null}
          {section.body ? <p>{section.body}</p> : null}
          {section.ctaLabel && section.ctaUrl ? <a href={section.ctaUrl}>{section.ctaLabel}<span>→</span></a> : null}
        </div>
        <div className={styles.refCoverVisual}>
          <small>{recordText(section.settings, "coverSideNote", "O SOM DE NOVAS POSSIBILIDADES.")}</small>
          <LaptopMockup
            imageUrl={visualItem?.mediaUrl}
            label={recordText(section.settings, "mockupLabel", "MÚSICA MOVE PESSOAS.")}
            alt={visualItem?.title || "Apresentação digital da Lander Records"}
          />
        </div>
      </div>
      {highlights.length ? <div className={styles.refCoverHighlights} data-reference-slot="cover-highlights">
        {highlights.map((item) => {
          const value = publishableValue(item, real);
          return <div key={item.id}>
            <AdminIcon name={iconName(item.icon)} size={18}/>
            <strong>{item.title || item.label}</strong>
            {value !== "" ? <span>{String(value)}</span> : null}
            {item.subtitle ? <small>{item.subtitle}</small> : null}
          </div>;
        })}
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
  const sideTitle = recordText(section.settings, "sideTitle", "MÚSICA, NEGÓCIOS, TENDÊNCIAS E OPORTUNIDADES EM UM SÓ LUGAR.");
  const sideCaption = recordText(section.settings, "sideCaption", "TALENTOS HOJE. GRANDES AMANHÃ.");
  const bannerTitle = recordText(section.settings, "bannerTitle", "VISIBILIDADE, CREDIBILIDADE E RELEVÂNCIA PARA ARTISTAS E MARCAS.");
  const bannerNote = recordText(section.settings, "bannerNote", "MÚSICA · CULTURA · OPORTUNIDADES");

  return <PageShell settings={settings} section={section} pageNumber={pageNumber}>
    <div className={styles.refAboutBody}>
      <div className={styles.refAboutTop}>
        <SectionHeading section={section}/>
        <aside className={styles.refAboutVisual}>
          {section.mediaUrl
            ? <img className={styles.refEditorialImage} src={section.mediaUrl} alt={sideCaption || section.title} style={imageStyle(section)}/>
            : <div className={styles.refEditorialFallback}><Brand dark/><span>LANDER RECORDS</span></div>}
          <div className={styles.refAboutVisualCopy}>
            <strong>{sideTitle}</strong>
            <i className={styles.refRedRule}/>
            <small>{sideCaption}</small>
          </div>
        </aside>
      </div>

      {metrics.length ? <div className={styles.refKpis} data-reference-slot="about-kpis">
        {metrics.map((item) => <div key={item.id}>
          <AdminIcon name={iconName(item.icon)} size={18}/>
          <strong>{String(publishableValue(item, real))}</strong>
          <span>{item.title || item.label}</span>
          {item.subtitle ? <small>{item.subtitle}</small> : null}
        </div>)}
      </div> : null}

      <div className={styles.refAboutBanner}>
        <strong>{bannerTitle}</strong>
        <span>{bannerNote}</span>
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
  const genders = measurable(group("gender"));
  const ages = measurable(group("age"));
  const interests = group("interest").filter((item) => item.title.trim());
  const cities = measurable(group("city"));
  const firstGender = numberValue(genders[0]?.metadata, "percentage");
  const totalGender = genders.reduce((sum, item) => sum + numberValue(item.metadata, "percentage"), 0);
  const donutStyle = totalGender > 0
    ? { background: "conic-gradient(#ed1c24 0 " + firstGender + "%,#17191d " + firstGender + "% 100%)" }
    : undefined;
  const displayPercent = (item: PreviewItem) => numberValue(item.metadata, "percentage") + "%";
  const hasVerifiedMetrics = Boolean(genders.length || ages.length || cities.length);

  return <PageShell settings={settings} section={section} pageNumber={pageNumber}>
    <div className={styles.refAudienceBody}>
      <SectionHeading section={section}/>
      <div className={styles.refAudienceGrid} data-reference-slot="audience-grid">
        {genders.length ? <section className={styles.refAudiencePanel}>
          <h4>PERFIL DO PÚBLICO</h4>
          <div className={styles.refDonut} style={donutStyle}>
            <div><strong>{displayPercent(genders[0])}</strong><small>{genders[0]?.title}</small></div>
          </div>
          <div className={styles.refLegend}>
            {genders.slice(0, 2).map((item, index) => <span key={item.id}>
              <i className={index === 0 ? styles.refLegendRed : styles.refLegendBlack}/>
              {item.title}<b>{displayPercent(item)}</b>
            </span>)}
          </div>
        </section> : null}

        {ages.length ? <section className={styles.refAudiencePanel}>
          <h4>FAIXA ETÁRIA</h4>
          <div className={styles.refBarList}>
            {ages.map((item) => <div key={item.id}>
              <span>{item.title}</span><i><b style={{width: displayPercent(item)}}/></i><strong>{displayPercent(item)}</strong>
            </div>)}
          </div>
        </section> : null}

        {interests.length ? <section className={styles.refAudiencePanel}>
          <h4>PRINCIPAIS INTERESSES</h4>
          <div className={styles.refInterestList}>
            {interests.map((item) => <div key={item.id}>
              <AdminIcon name={iconName(item.icon)} size={14}/>
              <span>{item.title}</span>
              {numberValue(item.metadata, "percentage") > 0 ? <strong>{displayPercent(item)}</strong> : <span/>}
            </div>)}
          </div>
        </section> : null}

        {cities.length ? <section className={styles.refAudiencePanel}>
          <h4>PRINCIPAIS CIDADES</h4>
          <div className={styles.refBarList}>
            {cities.map((item) => <div key={item.id}>
              <span>{item.title}</span><i><b style={{width: displayPercent(item)}}/></i><strong>{displayPercent(item)}</strong>
            </div>)}
          </div>
        </section> : null}

        {!hasVerifiedMetrics ? <section className={styles.refDataNotice}>
          <AdminIcon name="chart" size={20}/>
          <strong>Métricas quantitativas só entram quando estiverem verificadas.</strong>
          <span>O preview não publica números fictícios, placeholders ou indicadores sem fonte.</span>
        </section> : null}
      </div>
      {recordText(section.settings, "dataNote") ? <div className={styles.refAudienceNote}>{recordText(section.settings, "dataNote")}</div> : null}
    </div>
  </PageShell>;
}

function PartnershipPage({
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
  const items = visibleByPosition(section.items).filter((item) => meaningfulItem(item, real)).slice(0, 6);
  return <PageShell settings={settings} section={section} pageNumber={pageNumber}>
    <div className={styles.refPartnershipBody}>
      <SectionHeading section={section}/>
      <div className={styles.refPartnerGrid} data-reference-slot="partnership-grid">
        {items.map((item) => <article key={item.id}>
          <div className={[styles.refPartnerVisual, item.mediaUrl ? "" : styles.refPartnerVisualPlain].join(" ")}>
            {item.mediaUrl ? <img src={item.mediaUrl} alt={item.title || item.label} className={styles.refPartnerImage}/> : null}
            <span className={styles.refPartnerIcon}><AdminIcon name={iconName(item.icon)} size={20}/></span>
          </div>
          <h4>{item.title || item.label}</h4>
          {item.body ? <p>{item.body}</p> : null}
          {item.url ? <a href={item.url}>Saiba mais →</a> : null}
        </article>)}
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
  const opportunities = visibleByPosition(section.items).filter((item) => item.title.trim() || item.body.trim()).slice(0, 6);
  const featured = real.artists[0];
  return <PageShell settings={settings} section={section} pageNumber={pageNumber}>
    <div className={styles.refArtistsBody}>
      <SectionHeading section={section}/>
      <div className={styles.refArtistsGrid} data-reference-slot="artists-grid">
        <section className={styles.refReleaseColumn}>
          <h4>LANÇAMENTOS RECENTES</h4>
          {real.releases.length
            ? real.releases.slice(0,4).map((release) => <div key={release.artistName + "-" + release.title}>
                <i/><p><strong>{release.artistName}</strong><b>{release.title}</b><small>{release.releaseType}{releaseYear(release.releaseDate) ? " · " + releaseYear(release.releaseDate) : ""}</small></p>
              </div>)
            : <p className={styles.refEmpty}>Sem lançamentos publicados no momento.</p>}
        </section>

        <section className={styles.refFeaturedArtist}>
          {section.mediaUrl ? <img className={styles.refFeaturedArtistImage} src={section.mediaUrl} alt={featured?.name || "Artista em destaque"} style={imageStyle(section)}/> : null}
          <div className={styles.refFeaturedArtistOverlay}/>
          <div className={styles.refFeaturedArtistCopy}>
            <span>{recordText(section.settings, "featuredLabel", "ARTISTA EM DESTAQUE")}</span>
            <strong>{featured?.name || "LANDER RECORDS"}</strong>
            <p>{featured?.shortBio || featured?.eyebrow || "Talentos, identidade e desenvolvimento artístico em primeiro plano."}</p>
          </div>
        </section>

        <section className={styles.refOpportunityColumn}>
          <h4>OPORTUNIDADES DE EXPOSIÇÃO</h4>
          {opportunities.map((item) => <div key={item.id}>
            <span>+</span><p><strong>{item.title}</strong>{item.body ? <small>{item.body}</small> : null}</p>
          </div>)}
        </section>
      </div>
      {isPublishableValue(recordText(section.settings, "quote"))
        ? <blockquote className={styles.refQuote}>“{recordText(section.settings, "quote")}” {isPublishableValue(recordText(section.settings, "quoteAuthor")) ? <strong>— {recordText(section.settings, "quoteAuthor")}</strong> : null}</blockquote>
        : null}
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
  const contacts = visibleByPosition(section.items)
    .map((item) => ({ item, value: publishableValue(item, real) }))
    .filter(({ value }) => value !== "");

  return <PageShell settings={settings} section={section} pageNumber={pageNumber}>
    <div className={styles.refContactBody} data-reference-slot="contact-grid">
      <section className={styles.refContactMain}>
        <SectionHeading section={section}/>
        {section.ctaLabel && section.ctaUrl ? <a className={styles.refContactCta} href={section.ctaUrl}>{section.ctaLabel}<span>→</span></a> : null}
        {contacts.length ? <div className={styles.refContactList}>
          {contacts.map(({ item, value }) => <p key={item.id}><AdminIcon name={iconName(item.icon)} size={14}/><span>{String(value)}</span></p>)}
        </div> : null}
      </section>

      <aside className={styles.refNextSteps}>
        {section.mediaUrl ? <img className={styles.refNextStepsMedia} src={section.mediaUrl} alt={section.title || "Lander Records"} style={imageStyle(section)}/> : null}
        <div className={styles.refNextStepsCopy}>
          <span>{recordText(section.settings, "nextStepsTitle", "PRÓXIMOS PASSOS")}</span>
          <i className={styles.refRedRule}/>
          <p>{recordText(section.settings, "nextStepsBody", "Seguimos evoluindo para criar novas oportunidades, conectar talentos e levar a música ainda mais longe.")}</p>
        </div>
        <div className={styles.refNextStepsBrand}><strong>LANDER <b>RECORDS</b></strong><small>{recordText(section.settings, "closingSlogan", "MÚSICA QUE APROXIMA PESSOAS.")}</small></div>
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
  const items = visibleByPosition(section.items).filter((item) => meaningfulItem(item, real));
  return <PageShell settings={settings} section={section} pageNumber={pageNumber}>
    <div className={styles.refGenericBody}>
      <SectionHeading section={section}/>
      {items.length ? <div className={styles.refGenericGrid}>
        {items.map((item) => {
          const value = publishableValue(item, real);
          return <article key={item.id}>
            {item.mediaUrl ? <img src={item.mediaUrl} alt={item.title || item.label}/> : null}
            <AdminIcon name={iconName(item.icon)} size={17}/>
            {item.title || item.label ? <h4>{item.title || item.label}</h4> : null}
            {value !== "" ? <strong>{String(value)}</strong> : null}
            {item.subtitle ? <span>{item.subtitle}</span> : null}
            {item.body ? <p>{item.body}</p> : null}
          </article>;
        })}
      </div> : null}
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
  if (section.type === "cover") return <CoverPage settings={settings} section={section} pageNumber={pageNumber} real={real}/>;
  if (section.type === "editorial" || section.type === "metrics") return <AboutPage settings={settings} section={section} pageNumber={pageNumber} real={real}/>;
  if (section.type === "audience") return <AudiencePage settings={settings} section={section} pageNumber={pageNumber}/>;
  if (section.type === "cards") return <PartnershipPage settings={settings} section={section} pageNumber={pageNumber} real={real}/>;
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
  const visibleSections = visibleByPosition(sections);
  if (!visibleSections.length) {
    return <div className={styles.mkPreviewEmpty}>
      <AdminIcon name="document" size={28}/>
      <strong>Nenhuma seção visível</strong>
      <span>Adicione ou ative uma seção no editor para montar o Mídia Kit.</span>
    </div>;
  }

  return <div className={styles.mkDeck} data-testid="media-kit-preview-deck">
    {visibleSections.map((section, index) => <DynamicPage key={section.id} settings={settings} section={section} pageNumber={index + 1} real={real}/>)}
  </div>;
}
