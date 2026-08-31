import Image from "next/image";
import Link from "next/link";
import { AdminIcon } from "./AdminIcon";

type HomeSectionKind = "hero" | "intro" | "social" | "shortcuts" | "artists" | "advertising" | "releases" | "news";
type HomeSectionClass = "editable" | "configurable" | "automatic" | "structural";

export type HomeManagerSection = {
  key: HomeSectionKind;
  title: string;
  description: string;
  classification: HomeSectionClass;
  badge: string;
  detail: string;
  updatedAt?: string;
  actionHref?: string;
  actionLabel?: string;
  primaryText?: string;
  secondaryText?: string;
  itemLabels?: string[];
  imageUrls?: string[];
};

function SectionPreview({ section }: { section: HomeManagerSection }) {
  if (section.key === "advertising") return <div className="homeManagerPreview isImage"><Image alt="Banner atual da seção Anuncie Aqui" fill sizes="260px" src="/lander-records-anuncie-banner.webp" /></div>;
  if (section.key === "hero") return <div className="homeManagerPreview previewHero"><span>LANDER RECORDS</span><strong>{section.primaryText || "Hero da Home"}</strong><small>{section.secondaryText || "Conteúdo principal"}</small></div>;
  if (section.key === "intro") return <div className="homeManagerPreview previewIntro"><span aria-hidden="true" /><div><b>{section.primaryText || "Sobre Nós"}</b><i /><i /><i /></div></div>;
  if (section.key === "social") return <div className="homeManagerPreview previewSocial"><div><b>Instagram</b><strong>{section.itemLabels?.[0] || "—"}</strong></div><div><b>YouTube</b><strong>{section.itemLabels?.[1] || "—"}</strong></div></div>;
  if (section.key === "shortcuts") return <div className="homeManagerPreview previewShortcuts">{(section.itemLabels?.length ? section.itemLabels : ["Shows", "Música", "Distribuição", "Portal"]).slice(0, 4).map((label) => <span key={label}><i aria-hidden="true" />{label}</span>)}</div>;
  if (section.key === "artists" || section.key === "releases" || section.key === "news") return <div className={`homeManagerPreview previewCollection ${section.key}`}>{(section.imageUrls?.length ? section.imageUrls : ["", "", ""]).slice(0, section.key === "releases" ? 5 : 3).map((url, index) => <span key={`${url}-${index}`}>{url ? <Image alt="" fill sizes="90px" src={url} unoptimized /> : <i aria-hidden="true" />}</span>)}</div>;
  return <div className="homeManagerPreview"><span>Preview indisponível</span></div>;
}

function classNameForBadge(classification: HomeSectionClass) {
  return classification === "editable" ? "edit" : classification === "structural" ? "neutral" : "auto";
}

export function HomeManagerView({ canEdit = true, preview = false, sections }: { canEdit?: boolean; preview?: boolean; sections: HomeManagerSection[] }) {
  const resolveHref = (href: string) => {
    if (!preview) return href;
    if (href.includes("artists")) return "/cms-preview/artists";
    if (href.includes("posts")) return "/cms-preview/posts";
    if (href.includes("settings")) return "/cms-preview/integrations";
    return "/cms-preview/pages";
  };

  return <div className="homeManager" data-testid="home-manager">
    {preview ? <div className="adminPreviewNotice">BACKEND_ENVIRONMENT_DEFERRED · visão estrutural sem leitura ou escrita no banco.</div> : null}
    <header className="homeManagerHeader"><div><p>Home / Visão geral</p><h1>Home</h1><span>Gerencie o conteúdo e compreenda a ordem das seções exibidas na página inicial do site.</span></div><Link className="adminButton" href="/" target="_blank"><AdminIcon name="external" size={15} /> Ver site público<span className="srOnly"> (abre em nova aba)</span></Link></header>
    <nav className="homeManagerTabs" aria-label="Área atual do módulo Home"><span aria-current="page">Seções da Home</span></nav>
    <div className="homeManagerInfo"><span aria-hidden="true">i</span>A ordem abaixo acompanha a composição implementada no site público. A reordenação ainda não é suportada.</div>
    <div className="homeManagerList">
      {sections.map((section, index) => <article className="homeSectionCard" data-section-key={section.key} data-testid="home-section-card" key={section.key}>
        <span className="homeSectionPosition" aria-label={`Posição ${index + 1}`}>{index + 1}</span>
        <SectionPreview section={section} />
        <div className="homeSectionContent"><h2>{section.title}</h2><p>{section.description}</p><span className="homeSectionState"><i className={classNameForBadge(section.classification)} aria-hidden="true" />{section.detail}</span>{section.updatedAt ? <small>Última atualização: {section.updatedAt}</small> : null}</div>
        <div className="homeSectionActions"><span className={`adminStatusBadge ${classNameForBadge(section.classification)}`}>{section.badge}</span>{section.actionHref && section.actionLabel && (preview || canEdit) ? <Link className="adminButton" href={resolveHref(section.actionHref)}>{section.actionLabel === "Editar" ? <AdminIcon name="pages" size={15} /> : <AdminIcon name="settings" size={15} />}{section.actionLabel}</Link> : <span className="homeSectionUnavailable">{canEdit ? "Edição indisponível" : "Somente leitura"}</span>}</div>
      </article>)}
    </div>
  </div>;
}

export function createPreviewHomeSections(): HomeManagerSection[] {
  return [
    { key: "hero", title: "Hero / Banner principal", description: "Título, subtítulo e chamadas principais da abertura da Home.", classification: "editable", badge: "Editável", detail: "Conteúdo administrável", actionHref: "/admin/pages", actionLabel: "Editar", primaryText: "Música que conecta" },
    { key: "intro", title: "Sobre Nós", description: "Resumo institucional com conteúdo textual e acesso à página Sobre Nós.", classification: "editable", badge: "Editável", detail: "Conteúdo administrável", actionHref: "/admin/pages", actionLabel: "Editar" },
    { key: "social", title: "Redes Sociais (Instagram e YouTube)", description: "Métricas sociais exibidas dentro da apresentação institucional.", classification: "configurable", badge: "Automático / Configurável", detail: "Fonte: Soundcharts · não consultado", actionHref: "/admin/settings/lander-records", actionLabel: "Configurar", itemLabels: ["—", "—"] },
    { key: "shortcuts", title: "Nossas Ações", description: "Quatro atalhos editoriais com título e link de direcionamento.", classification: "editable", badge: "Editável", detail: "Conteúdo administrável", actionHref: "/admin/pages", actionLabel: "Editar", itemLabels: ["Shows", "Música", "Distribuição", "Portal"] },
    { key: "artists", title: "Artistas em destaque", description: "Seleção editorial de artistas exibidos na página inicial.", classification: "editable", badge: "Editável", detail: "Seleção não consultada no preview", actionHref: "/admin/artists", actionLabel: "Editar" },
    { key: "releases", title: "Últimos Lançamentos", description: "Lançamentos recentes carregados automaticamente do cache Spotify.", classification: "automatic", badge: "Automático", detail: "Fonte: Spotify · não consultado", actionHref: "/admin/settings/lander-records", actionLabel: "Configurar" },
    { key: "advertising", title: "Anuncie Aqui", description: "Banner promocional atualmente definido no frontend público.", classification: "structural", badge: "Estrutural", detail: "Edição requer evolução futura do modelo" },
    { key: "news", title: "Últimas Notícias", description: "Notícias internas selecionadas para destaque na Home.", classification: "configurable", badge: "Automático / Configurável", detail: "Fonte: Lander Records · não consultado", actionHref: "/admin/posts", actionLabel: "Configurar" },
  ];
}
