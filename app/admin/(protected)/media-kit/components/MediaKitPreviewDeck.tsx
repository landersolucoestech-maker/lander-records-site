import { AdminIcon, type IconName } from "../../../components/AdminIcon";
import styles from "../MediaKit.module.css";

type SocialItem = { platform: string; label: string; url: string };
type ArtistItem = { name: string; eyebrow: string; shortBio: string };
type ReleaseItem = { title: string; artistName: string; releaseType: string; releaseDate: string | Date | null };

export type MediaKitPreviewDeckProps = {
  brand: string;
  tagline: string;
  contact: string;
  phone: string;
  location: string;
  website: string;
  pagesTotal: number;
  postsTotal: number;
  mediaTotal: number;
  artistsTotal: number;
  releasesTotal: number;
  artists: ArtistItem[];
  releases: ReleaseItem[];
  socials: SocialItem[];
};

type FormatVisual = "mkVisualShow" | "mkVisualEditorial" | "mkVisualDigital" | "mkVisualSocial" | "mkVisualEvent" | "mkVisualNewsletter";\n\nconst formatItems: { icon: IconName; title: string; copy: string; visualClass: FormatVisual }[] = [
  { icon: "target", title: "Patrocínio", copy: "Presença de marca em projetos, lançamentos e iniciativas especiais.", visualClass: "mkVisualShow" },
  { icon: "posts", title: "Publieditorial", copy: "Conteúdo editorial integrado ao ecossistema da Lander Records.", visualClass: "mkVisualEditorial" },
  { icon: "chart", title: "Campanhas digitais", copy: "Campanhas multiplataforma pensadas para música, cultura e comunidade.", visualClass: "mkVisualDigital" },
  { icon: "smartphone", title: "Redes sociais", copy: "Conteúdo nativo, menções e ativações nos canais oficiais.", visualClass: "mkVisualSocial" },
  { icon: "artists", title: "Eventos", copy: "Shows, showcases, listening parties e experiências de marca.", visualClass: "mkVisualEvent" },
  { icon: "mail", title: "Newsletter", copy: "Comunicação direta com uma base qualificada quando o canal estiver conectado.", visualClass: "mkVisualNewsletter" },
];

const opportunities = ["Sua marca no projeto", "Citação em redes sociais", "Branding em shows", "Ações com fãs", "Conteúdo exclusivo", "Projetos especiais"];\n\nfunction releaseYear(value: string | Date | null) {\n  if (!value) return "";\n  if (value instanceof Date) return String(value.getUTCFullYear());\n  return value.slice(0, 4);\n}

function Brand({ dark = false }: { dark?: boolean }) {
  return <div className={styles.mkBrand}><span className={styles.mkBrandMark} aria-hidden="true"><i/><i/><i/><i/></span><div><strong>LANDER <b>RECORDS</b></strong><small className={dark ? styles.mkMutedDark : undefined}>MÚSICA · ARTISTAS · CULTURA · OPORTUNIDADES</small></div></div>;
}

function PageHeader({ page, dark = false }: { page: string; dark?: boolean }) {
  return <header className={styles.mkPageHeader}><Brand dark={dark}/><div className={styles.mkPageMeta}><span>MÍDIA KIT 2026</span><strong>{page}</strong></div></header>;
}

function PageFooter({ label, dark = false }: { label: string; dark?: boolean }) {
  return <footer className={styles.mkPageFooter}><span>LANDERRECORDS.COM</span><span className={dark ? styles.mkMutedDark : undefined}>{label}</span></footer>;
}

function MetricStrip({ data }: { data: MediaKitPreviewDeckProps }) {
  const metrics = [
    { icon: "artists" as IconName, value: data.artistsTotal, label: "ARTISTAS NO CAST", source: "Dado real" },
    { icon: "media" as IconName, value: data.releasesTotal, label: "LANÇAMENTOS", source: "Dado real" },
    { icon: "posts" as IconName, value: data.postsTotal, label: "PUBLICAÇÕES", source: "Dado real" },
    { icon: "chart" as IconName, value: "—", label: "ALCANCE MENSAL", source: "A integrar" },
    { icon: "users" as IconName, value: "—", label: "SEGUIDORES", source: "A integrar" },
  ];
  return <div className={styles.mkMetricStrip}>{metrics.map((item) => <div className={styles.mkMetricTile} key={item.label}><AdminIcon name={item.icon} size={18}/><strong>{item.value}</strong><span>{item.label}</span><small>{item.source}</small></div>)}</div>;
}

function CoverPage({ data }: { data: MediaKitPreviewDeckProps }) {
  const highlights: [IconName,string,string][] = [["artists","ARTISTAS","Talentos reais"],["media","LANÇAMENTOS","Novos sons"],["users","PARCERIAS","Marcas e projetos"],["chart","PRESENÇA DIGITAL","Audiência em crescimento"]];
  return <article className={[styles.mkPage,styles.mkPageDark,styles.mkCover].join(" ")}>
    <PageHeader page="01" dark/>
    <div className={styles.mkCoverBody}>
      <div className={styles.mkCoverCopy}><span className={styles.mkKicker}>LANDER RECORDS · 2026</span><h3>CONECTANDO<br/>ARTISTAS,<br/>MÚSICA E<br/><em>OPORTUNIDADES.</em></h3><i className={styles.mkRedRule}/><p>{data.tagline}</p></div>
      <div className={styles.mkCoverVisual}><div className={styles.mkLaptopMock}><div className={styles.mkLaptopBar}><span>LANDER RECORDS</span><small>ARTISTAS &nbsp; LANÇAMENTOS &nbsp; NOTÍCIAS</small></div><div className={styles.mkLaptopHero}><strong>MÚSICA<br/>MOVE<br/>PESSOAS.</strong><span>▶</span></div><div className={styles.mkLaptopThumbs}><i/><i/><i/><i/></div></div></div>
    </div>
    <div className={styles.mkCoverHighlights}>{highlights.map(([icon,title,copy]) => <div key={title}><AdminIcon name={icon} size={20}/><strong>{title}</strong><small>{copy}</small></div>)}</div>
    <PageFooter label="O SOM DE NOVAS POSSIBILIDADES" dark/>
  </article>;
}

function AboutPage({ data }: { data: MediaKitPreviewDeckProps }) {
  return <article className={[styles.mkPage,styles.mkPageLight].join(" ")}>
    <PageHeader page="02"/>
    <div className={styles.mkPageBody}>
      <div className={styles.mkAboutTop}><section><span className={styles.mkSectionEyebrow}>INSTITUCIONAL</span><h3>SOBRE A<br/>{data.brand.toUpperCase()}</h3><i className={styles.mkRedRule}/><p>A {data.brand} atua como gravadora, produtora musical e estrutura de gestão artística 360°, conectando desenvolvimento de carreira, produção, conteúdo, posicionamento e oportunidades comerciais.</p><p>Nosso objetivo é transformar música em projetos consistentes, aproximando artistas, público e parceiros em experiências relevantes e sustentáveis.</p></section><aside className={styles.mkAboutStatement}><strong>MÚSICA,<br/>NEGÓCIOS,<br/>TENDÊNCIAS E<br/>OPORTUNIDADES<br/>EM UM SÓ LUGAR.</strong><i className={styles.mkRedRule}/><small>TALENTOS HOJE.<br/>GRANDES AMANHÃ.</small></aside></div>
      <MetricStrip data={data}/>
      <div className={styles.mkImpactBanner}><strong>VISIBILIDADE, CREDIBILIDADE E RELEVÂNCIA PARA ARTISTAS E MARCAS.</strong><span>MÚSICA · CULTURA · OPORTUNIDADES</span></div>
    </div>
    <PageFooter label="O SOM QUE CONECTA"/>
  </article>;
}

function AudiencePage({ data }: { data: MediaKitPreviewDeckProps }) {
  const interests: [IconName,string][]=[["media","Música e lançamentos"],["artists","Artistas e carreiras"],["activity","Entretenimento e cultura"],["calendar","Shows e experiências"],["posts","Conteúdo e tendências"]];
  const ages=[["13–17",30],["18–24",58],["25–34",76],["35–44",45],["45+",24]] as const;
  return <article className={[styles.mkPage,styles.mkPageLight].join(" ")}>
    <PageHeader page="03"/>
    <div className={styles.mkPageBody}>
      <section className={styles.mkIntro}><h3>NOSSA AUDIÊNCIA</h3><i className={styles.mkRedRule}/><p>A estrutura visual está pronta para receber métricas verificadas assim que uma fonte de audiência elegível estiver conectada.</p></section>
      <div className={styles.mkAudienceGrid}>
        <section><h4>PERFIL DO PÚBLICO</h4><div className={styles.mkDonut}><div><strong>—</strong><span>A INTEGRAR</span></div></div><div className={styles.mkLegend}><span><i/>Homens · a integrar</span><span><i/>Mulheres · a integrar</span></div></section>
        <section><h4>FAIXA ETÁRIA</h4><div className={styles.mkBars}>{ages.map(([age,width])=><div key={age}><span>{age}</span><i><b style={{width:String(width)+"%"}}/></i><small>A integrar</small></div>)}</div></section>
        <section><h4>PRINCIPAIS INTERESSES</h4><ul className={styles.mkInterestList}>{interests.map(([icon,item])=><li key={item}><AdminIcon name={icon} size={15}/><span>{item}</span></li>)}</ul></section>
        <section><h4>PRESENÇA GEOGRÁFICA</h4><div className={styles.mkLocationPanel}><AdminIcon name="target" size={22}/><strong>{data.location}</strong><span>Demais cidades e distribuição de audiência entram quando houver fonte conectada.</span></div></section>
      </div>
      <div className={styles.mkDataNotice}><strong>SEM NÚMEROS INVENTADOS.</strong><span>O template preserva a estrutura comercial e recebe somente métricas verificadas.</span></div>
    </div>
    <PageFooter label="DADOS DE AUDIÊNCIA · INTEGRAÇÃO PENDENTE"/>
  </article>;
}

function PartnershipPage() {
  return <article className={[styles.mkPage,styles.mkPageLight].join(" ")}>
    <PageHeader page="04"/>
    <div className={styles.mkPageBody}>
      <section className={styles.mkIntro}><h3>FORMATOS DE PARCERIA</h3><i className={styles.mkRedRule}/><p>Soluções para marcas que desejam se conectar com música, cultura e artistas dentro do ecossistema Lander Records.</p></section>
      <div className={styles.mkFormatGrid}>{formatItems.map(item=>{ const visualClass = { mkVisualShow: styles.mkVisualShow, mkVisualEditorial: styles.mkVisualEditorial, mkVisualDigital: styles.mkVisualDigital, mkVisualSocial: styles.mkVisualSocial, mkVisualEvent: styles.mkVisualEvent, mkVisualNewsletter: styles.mkVisualNewsletter }[item.visualClass]; return <article className={styles.mkFormatTile} key={item.title}><div className={[styles.mkFormatVisual,visualClass].join(" ")}><AdminIcon name={item.icon} size={24}/><span>LANDER RECORDS</span></div><h4>{item.title}</h4><p>{item.copy}</p></article>;})}</div>
    </div>
    <PageFooter label="PARCERIAS QUE AMPLIFICAM"/>
  </article>;
}

function ArtistsPage({ data }: { data: MediaKitPreviewDeckProps }) {
  const featured=data.artists[0];
  return <article className={[styles.mkPage,styles.mkPageLight].join(" ")}>
    <PageHeader page="05"/>
    <div className={styles.mkPageBody}>
      <section className={styles.mkIntro}><h3>ARTISTAS & DESTAQUES</h3><i className={styles.mkRedRule}/><p>Talentos, lançamentos e possibilidades de exposição reunidos em uma página editorial de alto impacto.</p></section>
      <div className={styles.mkArtistsLayout}>
        <section className={styles.mkReleaseList}><h4>LANÇAMENTOS RECENTES</h4>{data.releases.length?data.releases.slice(0,4).map(item=><div key={item.artistName+"-"+item.title}><span className={styles.mkReleaseThumb}/><p><strong>{item.artistName}</strong><b>{item.title}</b><small>{item.releaseType}{releaseYear(item.releaseDate)?" · "+releaseYear(item.releaseDate):""}</small></p></div>):<div className={styles.mkEmptyEditorial}>Nenhum lançamento ativo disponível.</div>}</section>
        <section className={styles.mkFeaturedArtist}><div className={styles.mkFeaturedPhoto}><span>ARTISTA EM DESTAQUE</span><strong>{featured?.name || "Destaque a definir"}</strong><p>{featured?.shortBio || featured?.eyebrow || "Selecione artistas publicados para compor esta área do Mídia Kit."}</p><i>▶</i></div><div className={styles.mkFeaturedThumbs}><span/><span/><span/><span/></div></section>
        <section className={styles.mkOpportunityList}><h4>OPORTUNIDADES DE EXPOSIÇÃO</h4>{opportunities.map(item=><div key={item}><span>+</span><p>{item}</p></div>)}</section>
      </div>
      <blockquote className={styles.mkQuote}>“Mais que uma apresentação institucional: um material comercial preparado para conectar artistas, marcas e oportunidades.”</blockquote>
    </div>
    <PageFooter label="TALENTOS QUE MOVEM O AMANHÃ"/>
  </article>;
}

function ContactPage({ data }: { data: MediaKitPreviewDeckProps }) {
  const instagram=data.socials.find(item=>item.platform.toLowerCase().includes("instagram"));
  return <article className={[styles.mkPage,styles.mkPageLight].join(" ")}>
    <PageHeader page="06"/>
    <div className={[styles.mkPageBody,styles.mkContactBody].join(" ")}>
      <section className={styles.mkContactCopy}><span className={styles.mkSectionEyebrow}>CONTATO COMERCIAL</span><h3>VAMOS<br/>CONSTRUIR ALGO<br/>GRANDE JUNTOS?</h3><i className={styles.mkRedRule}/><p>Seja para desenvolver uma campanha, apoiar um artista, patrocinar um projeto ou criar uma iniciativa especial, a estrutura comercial está pronta para a conversa.</p><a href={"mailto:"+data.contact}>ENTRE EM CONTATO <span>→</span></a><div className={styles.mkContactList}><span><AdminIcon name="mail" size={15}/>{data.contact}</span><span><AdminIcon name="smartphone" size={15}/>{data.phone}</span><span><AdminIcon name="users" size={15}/>{instagram?.label || "Instagram não configurado"}</span><span><AdminIcon name="external" size={15}/>{data.website}</span><span><AdminIcon name="target" size={15}/>{data.location}</span></div></section>
      <aside className={styles.mkNextSteps}><div><span>PRÓXIMOS PASSOS</span><i className={styles.mkRedRule}/><p>Conectar métricas verificadas, selecionar os principais artistas e lançamentos e transformar este deck em um material comercial exportável.</p></div><strong>LANDER <b>RECORDS</b></strong><small>MÚSICA QUE APROXIMA PESSOAS.</small></aside>
    </div>
    <PageFooter label="2026"/>
  </article>;
}

export function MediaKitPreviewDeck(data: MediaKitPreviewDeckProps) {
  return <div className={styles.mkDeck} data-testid="media-kit-preview-deck">
    <CoverPage data={data}/>
    <AboutPage data={data}/>
    <AudiencePage data={data}/>
    <PartnershipPage/>
    <ArtistsPage data={data}/>
    <ContactPage data={data}/>
  </div>;
}
