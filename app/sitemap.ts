import type { MetadataRoute } from "next";
import { getPublishedArtists, getPublishedPosts } from "../lib/content";
import { absoluteUrl } from "../lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [artists, posts] = await Promise.all([getPublishedArtists(), getPublishedPosts()]);
  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/sobre-nos"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/artistas"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/noticias"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/contato"), changeFrequency: "monthly", priority: 0.5 },
    ...artists.map((artist) => ({ url: absoluteUrl(`/artistas/${artist.slug}`), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...posts.map((post) => ({ url: absoluteUrl(`/noticias/${post.slug}`), lastModified: post.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
