export type PageClassification = "Estrutural" | "Institucional" | "Módulo de domínio" | "Funcional" | "Legal" | "Estrutura administrativa";
export type SectionFieldName = "eyebrow" | "title" | "subtitle" | "body";
export type ItemFieldName = "title" | "subtitle" | "body" | "label" | "url";

export type SiteSectionContract = {
  label: string;
  description: string;
  fields: readonly SectionFieldName[];
  itemFields: readonly ItemFieldName[];
  allowAddItems?: boolean;
  maxItems?: number;
  media?: "item-image" | "section-image-video";
  mediaLabel?: string;
  source: string;
  sourceHref?: string;
};

export type SitePageContract = {
  label: string;
  route: string;
  classification: PageClassification;
  scope: string;
  sections: Record<string, SiteSectionContract>;
  sectionOrder: readonly string[];
};

const section = (
  label: string,
  description: string,
  fields: readonly SectionFieldName[],
  itemFields: readonly ItemFieldName[],
  source: string,
  extra: Partial<SiteSectionContract> = {},
): SiteSectionContract => ({ label, description, fields, itemFields, source, ...extra });

/**
 * Canonical CMS contract derived from the public Lander Records implementation.
 * Portal Lander can inform admin UX only; it must never define these pages,
 * section names, fields, content sources or public behavior.
 */
export const SITE_PAGE_CONTRACTS: Record<string, SitePageContract> = {
  home: {
    label: "Página inicial",
    route: "/",
    classification: "Estrutural",
    scope: "Home institucional da Lander Records",
    sectionOrder: ["hero", "intro", "shortcuts", "artists", "releases", "advertise_banner", "news"],
    sections: {
      hero: section(
        "Hero Section",
        "Headline institucional, subtítulo, mídia de fundo e CTAs exibidos no topo da Home da Lander Records.",
        ["title", "subtitle"],
        ["label", "url"],
        "app/(public)/page.tsx · .homeHero",
        { allowAddItems: true, maxItems: 2, media: "section-image-video", mediaLabel: "Imagem ou vídeo do Hero" },
      ),
      intro: section(
        "Apresentação institucional",
        "Bloco de apresentação da gravadora. As métricas de Instagram e YouTube são alimentadas pelas integrações sociais.",
        ["title", "body"],
        ["label", "url"],
        "app/(public)/page.tsx · .homeIntroCard",
        { maxItems: 1 },
      ),
      shortcuts: section(
        "Atalhos de serviços",
        "Atalhos circulares da Home. Cada item gera um destino público real.",
        [],
        ["label", "url"],
        "app/(public)/page.tsx · .homeShortcutRow",
        { allowAddItems: true },
      ),
      artists: section(
        "Artistas em destaque",
        "Título e apoio da vitrine. Os cards vêm do módulo Artistas usando os artistas publicados e destacados na Home.",
        ["title", "subtitle"],
        [],
        "modules/artists + app/(public)/page.tsx · .homeArtistGrid",
        { sourceHref: "/admin/artists" },
      ),
      releases: section(
        "Últimos Lançamentos",
        "Feed automático com no máximo 5 faixas da playlist Spotify exclusiva da seção. Capa, título, artista, data e destino são obtidos do Spotify; nenhum lançamento é cadastrado manualmente no CMS.",
        ["title", "subtitle"],
        [],
        "Spotify playlist → lib/integrations/sync + app/(public)/page.tsx · .releaseGrid",
        { sourceHref: "/admin/settings/lander-records" },
      ),
      advertise_banner: section(
        "Anuncie com a Lander",
        "Banner comercial exibido entre Lançamentos e Últimas novidades.",
        [],
        [],
        "app/(public)/page.tsx · banner institucional",
        { maxItems: 1, media: "item-image", mediaLabel: "Arte do banner" },
      ),
      news: section(
        "Últimas novidades",
        "Chamada editorial da Home. As matérias vêm do módulo Conteúdos usando publicações destacadas.",
        ["eyebrow", "title"],
        [],
        "modules/posts + app/(public)/page.tsx · .homeNewsEditorial",
        { sourceHref: "/admin/posts" },
      ),
    },
  },
  about: {
    label: "Sobre Nós",
    route: "/sobre-nos",
    classification: "Institucional",
    scope: "Página institucional da Lander Records",
    sectionOrder: ["hero", "history", "identity", "methodology", "companies"],
    sections: {
      hero: section("Hero institucional", "Apresentação principal da página Sobre Nós.", ["eyebrow", "title", "subtitle"], [], "app/(public)/sobre-nos/page.tsx · .pageHero"),
      history: section("Nossa História", "História institucional e identificação visual do bloco de origem da Lander Records.", ["eyebrow", "title", "subtitle", "body"], [], "app/(public)/sobre-nos/page.tsx · .splitFeature"),
      identity: section("Missão, visão e valores", "Cards institucionais de missão, visão e valores.", ["eyebrow", "title"], ["title", "body"], "app/(public)/sobre-nos/page.tsx · .detailGrid", { allowAddItems: true }),
      methodology: section("Gestão Artística 360°", "Etapas da metodologia e resumo estratégico da operação artística.", ["eyebrow", "title", "subtitle"], ["title", "body"], "app/(public)/sobre-nos/page.tsx · .methodologyGrid", { allowAddItems: true }),
      companies: section("Empresas do Grupo Lander", "Tabs do ecossistema Lander e descrição de cada frente do grupo.", ["eyebrow", "title", "subtitle"], ["label", "subtitle", "body"], "app/(public)/sobre-nos/page.tsx + GroupCompaniesTabs.tsx", { allowAddItems: true }),
    },
  },
  artists: {
    label: "Artistas",
    route: "/artistas",
    classification: "Módulo de domínio",
    scope: "Apresentação do casting; dados dos artistas ficam no módulo Artistas",
    sectionOrder: ["hero", "artist_filters", "artist_list"],
    sections: {
      hero: section("Hero do casting", "Título, chamada e subtítulo da página geral de artistas.", ["eyebrow", "title", "subtitle"], [], "app/(public)/artistas/page.tsx · .pageHero"),
      artist_filters: section("Filtros de artistas", "Exibe as categorias públicas configuradas no módulo Artistas.", [], [], "ArtistFilterGrid.tsx + categorias de artistas", { sourceHref: "/admin/artists" }),
      artist_list: section("Catálogo de artistas", "Exibe os artistas publicados com imagem, nome, identificação e link de perfil.", [], [], "ArtistFilterGrid.tsx + modules/artists", { sourceHref: "/admin/artists" }),
    },
  },
  news: {
    label: "Notícias",
    route: "/noticias",
    classification: "Módulo de domínio",
    scope: "Apresentação editorial; matérias ficam no módulo Conteúdos",
    sectionOrder: ["hero", "news_categories", "news_list"],
    sections: {
      hero: section("Hero de notícias", "Título, chamada e subtítulo da página geral de notícias da Lander Records.", ["eyebrow", "title", "subtitle"], [], "app/(public)/noticias/page.tsx · .portalHero"),
      news_categories: section("Categorias de notícias", "Exibe os filtros das categorias editoriais ativas.", [], [], "NewsFilterGrid.tsx + categorias de posts", { sourceHref: "/admin/posts" }),
      news_list: section("Lista de notícias", "Exibe as publicações reais do módulo Conteúdos.", [], [], "NewsFilterGrid.tsx + modules/posts", { sourceHref: "/admin/posts" }),
    },
  },
  contact: {
    label: "Contato",
    route: "/contato",
    classification: "Funcional",
    scope: "Conteúdo da página e formulário de contato da Lander Records",
    sectionOrder: ["hero", "intro"],
    sections: {
      hero: section("Hero de contato", "Headline e chamada principal da página de contato.", ["eyebrow", "title", "subtitle"], [], "app/(public)/contato/page.tsx · .pageHero"),
      intro: section("Apresentação de contato", "Texto de apoio ao formulário. E-mail e localização vêm das Configurações do site; assuntos vêm dos tópicos de contato.", ["eyebrow", "title", "body"], [], "app/(public)/contato/page.tsx · .contactSection", { sourceHref: "/admin/settings" }),
    },
  },
  privacy: {
    label: "Política de Privacidade",
    route: "/politica-de-privacidade",
    classification: "Legal",
    scope: "Documento público de privacidade",
    sectionOrder: ["hero", "legal_body"],
    sections: {
      hero: section("Cabeçalho da política", "Título, identificação e data de atualização da Política de Privacidade.", ["eyebrow", "title", "subtitle"], [], "app/(public)/politica-de-privacidade/page.tsx · .pageHero"),
      legal_body: section("Conteúdo da política", "Cláusulas publicadas na Política de Privacidade, na ordem exibida ao público.", [], ["title", "body"], "app/(public)/politica-de-privacidade/page.tsx · .detailCard", { allowAddItems: true }),
    },
  },
  terms: {
    label: "Termos e Condições",
    route: "/termos-e-condicoes",
    classification: "Legal",
    scope: "Documento público de termos de uso",
    sectionOrder: ["hero", "legal_body"],
    sections: {
      hero: section("Cabeçalho dos termos", "Título, identificação e data de atualização dos Termos e Condições.", ["eyebrow", "title", "subtitle"], [], "app/(public)/termos-e-condicoes/page.tsx · .pageHero"),
      legal_body: section("Conteúdo dos termos", "Cláusulas publicadas nos Termos e Condições, na ordem exibida ao público.", [], ["title", "body"], "app/(public)/termos-e-condicoes/page.tsx · .detailCard", { allowAddItems: true }),
    },
  },
};

export function sitePageContract(key: string): SitePageContract | null {
  return SITE_PAGE_CONTRACTS[key] || null;
}

export function siteSectionContract(pageKey: string, sectionKey: string): SiteSectionContract | null {
  return SITE_PAGE_CONTRACTS[pageKey]?.sections[sectionKey] || null;
}

export function siteSectionOrder(pageKey: string, sectionKey: string): number | null {
  const index = SITE_PAGE_CONTRACTS[pageKey]?.sectionOrder.indexOf(sectionKey) ?? -1;
  return index >= 0 ? index + 1 : null;
}
