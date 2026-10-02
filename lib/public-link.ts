export type TrustedPublicLink = {
  href: string;
  external: boolean;
};

const INTERNAL_ORIGIN = "https://landerrecords.local";

export function trustedInternalHref(raw: string) {
  const value = raw.trim();
  if (!value || /[\u0000-\u001f\u007f\\]/.test(value) || !value.startsWith("/") || value.startsWith("//")) return "";
  try {
    const parsed = new URL(value, INTERNAL_ORIGIN);
    if (parsed.origin !== INTERNAL_ORIGIN) return "";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "";
  }
}

export function trustedExternalHref(raw: string) {
  const value = raw.trim();
  if (!value || /[\u0000-\u001f\u007f\\]/.test(value)) return "";
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return "";
    return parsed.href;
  } catch {
    return "";
  }
}

export function trustedPublicLink(raw: string): TrustedPublicLink | null {
  const internal = trustedInternalHref(raw);
  if (internal) return { href: internal, external: false };
  const external = trustedExternalHref(raw);
  return external ? { href: external, external: true } : null;
}
