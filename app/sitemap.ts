import type { MetadataRoute } from "next";
import { getPublishedArtists, getPublishedPosts } from "../lib/content";
import { absolutePageUrl } from "../lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [artists, posts] = await Promise.all([getPublishedArtists(), getPublishedPosts()]);
  return [
    { url: absolutePageUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absolutePageUrl("/sobre-nos"), changeFrequency: "monthly", priority: 0.7 },
    { url: absolutePageUrl("/artistas"), changeFrequency: "weekly", priority: 0.8 },
    { url: absolutePageUrl("/noticias"), changeFrequency: "daily", priority: 0.8 },
    { url: absolutePageUrl("/contato"), changeFrequency: "monthly", priority: 0.5 },
    { url: absolutePageUrl("/politica-de-privacidade"), changeFrequency: "yearly", priority: 0.3 },
    { url: absolutePageUrl("/termos-e-condicoes"), changeFrequency: "yearly", priority: 0.3 },
    ...artists.map((artist) => ({ url: absolutePageUrl(`/artistas/${artist.slug}`), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...posts.map((post) => ({ url: absolutePageUrl(`/noticias/${post.slug}`), lastModified: post.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
