export type PageClassification = "Estrutural" | "Institucional" | "Módulo de domínio" | "Funcional" | "Estrutura administrativa";

const contracts: Record<string, { route: string; classification: PageClassification; scope: string }> = {
  home: { route: "/", classification: "Estrutural", scope: "Composição gerenciada no módulo Home" },
  about: { route: "/sobre-nos", classification: "Institucional", scope: "Conteúdo estruturado por seções" },
  artists: { route: "/artistas", classification: "Módulo de domínio", scope: "Apresentação; catálogo no módulo Artistas" },
  news: { route: "/noticias", classification: "Módulo de domínio", scope: "Apresentação; publicações no módulo Notícias" },
  contact: { route: "/contato", classification: "Funcional", scope: "Conteúdo editorial; formulário separado" },
};

export const knownPageKeys = Object.keys(contracts);

export function pageContract(key: string) {
  return contracts[key] || { route: null, classification: "Estrutura administrativa" as const, scope: "Sem renderer público registrado" };
}
