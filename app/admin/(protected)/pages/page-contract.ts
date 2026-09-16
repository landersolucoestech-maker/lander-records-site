import { SITE_PAGE_CONTRACTS, sitePageContract } from "./site-page-contract";

export type { PageClassification } from "./site-page-contract";

export const knownPageKeys = Object.keys(SITE_PAGE_CONTRACTS);

export function pageContract(key: string) {
  const contract = sitePageContract(key);
  return contract
    ? { route: contract.route, classification: contract.classification, scope: contract.scope }
    : { route: null, classification: "Estrutura administrativa" as const, scope: "Sem renderer público registrado" };
}
