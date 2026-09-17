import type { Metadata } from "next";
import { getSiteChrome } from "./content";

export function absoluteUrl(pathname: string) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://landerrecords.com").replace(/\/$/, "");
  return `${base}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function resolveCanonicalUrl(value: string | null | undefined, fallbackPath: string) {
  const fallback = absoluteUrl(fallbackPath);
  const candidate = value?.trim();
  if (!candidate) return fallback;
  try {
    const url = new URL(candidate);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password || !url.hostname) return fallback;
    url.hash = "";
    return url.toString();
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
  const { settings, socialImageUrl } = await getSiteChrome();
  const title = input.title || settings.defaultSeoTitle || settings.brandName;
  const description = input.description || settings.defaultSeoDescription || settings.tagline;
  const canonical = input.canonical || absoluteUrl("/");
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
