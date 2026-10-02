import type { ItemFieldName, SectionFieldName, SiteSectionContract } from "./(protected)/pages/site-page-contract";

export const ALL_SECTION_FIELDS: readonly SectionFieldName[] = ["eyebrow", "title", "subtitle", "body"];
export const ALL_ITEM_FIELDS: readonly ItemFieldName[] = ["title", "subtitle", "body", "label", "url"];

export function allowedSectionFields(contract: SiteSectionContract | null, canonicalPage: boolean): readonly SectionFieldName[] {
  return canonicalPage ? contract?.fields ?? [] : ALL_SECTION_FIELDS;
}

export function allowedItemFields(contract: SiteSectionContract | null, canonicalPage: boolean): readonly ItemFieldName[] {
  return canonicalPage ? contract?.itemFields ?? [] : ALL_ITEM_FIELDS;
}

export function canCreateOrDeleteItems(contract: SiteSectionContract | null, canonicalPage: boolean) {
  return canonicalPage ? contract?.allowAddItems === true : true;
}

export function canEditItem(contract: SiteSectionContract | null, canonicalPage: boolean) {
  if (!canonicalPage) return true;
  return Boolean(contract && (contract.itemFields.length > 0 || contract.media === "item-image"));
}

export function assertItemCapacity(contract: SiteSectionContract | null, canonicalPage: boolean, currentCount: number) {
  if (!canonicalPage) return;
  if (!contract?.allowAddItems) throw new Error("Esta seção não permite criação de itens pelo CMS.");
  if (contract.maxItems && currentCount >= contract.maxItems) {
    throw new Error(`Esta seção permite no máximo ${contract.maxItems} item(ns).`);
  }
}

export function normalizeCmsDestination(rawValue: string) {
  const value = rawValue.trim();
  if (!value) return "";
  if (/[\\\u0000-\u001f\u007f]/.test(value)) throw new Error("Destino inválido.");
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (/^(mailto:|tel:)/i.test(value)) return value;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Destino inválido.");
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new Error("Destino inválido.");
  return parsed.toString();
}
