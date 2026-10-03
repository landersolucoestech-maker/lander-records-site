import type { Metadata } from "next";

export function absoluteUrl(pathname: string) {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "https://landerrecords.com").trim();
  let base: URL;
  try { base = new URL(configured); } catch { throw new Error("NEXT_PUBLIC_SITE_URL inválida."); }
  const loopback = base.hostname === "localhost" || base.hostname === "127.0.0.1" || base.hostname === "[::1]";
  const previewHttp = loopback && base.protocol === "http:";
  if ((base.protocol !== "https:" && !previewHttp)
    || base.username || base.password || base.search || base.hash) throw new Error("NEXT_PUBLIC_SITE_URL inválida.");
  const origin = base.toString().replace(/\/$/, "");
  return `${origin}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function normalizeCanonicalOverride(value: string | null | undefined) {
  const candidate = value?.trim();
  if (!candidate) return "";
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("URL canônica inválida.");
  }
  if (url.protocol !== "https:" || url.username || url.password || !url.hostname) {
    throw new Error("URL canônica inválida.");
  }
  url.hash = "";
  return url.toString();
}

export function resolveCanonicalUrl(value: string | null | undefined, fallbackPath: string) {
  const fallback = absoluteUrl(fallbackPath);
  try {
    return normalizeCanonicalOverride(value) || fallback;
  } catch {
    return fallback;
  }
}

export async function buildMetadata(input: {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: "website" | "article";
}): Promise<Metadata> {
  const { getSiteChrome } = await import("./content");
  const { settings, socialImageUrl } = await getSiteChrome();
  const title = input.title || settings.defaultSeoTitle || settings.brandName;
  const description = input.description || settings.defaultSeoDescription || settings.tagline;
  const canonicalInput = input.canonical?.trim();
  const canonical = canonicalInput?.startsWith("/") ? absoluteUrl(canonicalInput) : canonicalInput ? resolveCanonicalUrl(canonicalInput, "/") : absoluteUrl("/");
  const socialImage = input.image || socialImageUrl || "";

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: settings.brandName,
      type: input.type || "website",
      images: socialImage ? [{ url: socialImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: socialImage ? [socialImage] : undefined,
    },
  };
}
