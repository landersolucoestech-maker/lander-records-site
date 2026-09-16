import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { mediaAssets, pageSectionItems, pageSections, pages } from "@/lib/db/schema";
export { getSiteChrome } from "@/modules/settings/repository";

export async function getPageContent(pageKey: string) {
  const db = getDb();
  const pageRows = await db.select().from(pages).where(and(eq(pages.key, pageKey), eq(pages.enabled, true))).limit(1);
  const page = pageRows[0];
  if (!page) return null;

  const ogRows = page.ogMediaId
    ? await db.select({ url: mediaAssets.url }).from(mediaAssets).where(and(eq(mediaAssets.id, page.ogMediaId), eq(mediaAssets.status, "active"))).limit(1)
    : [];
  const sections = await db.select().from(pageSections).where(and(eq(pageSections.pageId, page.id), eq(pageSections.enabled, true))).orderBy(asc(pageSections.position));
  const sectionIds = sections.map((section) => section.id);
  const allItems = sectionIds.length
    ? await db.select().from(pageSectionItems).where(and(eq(pageSectionItems.enabled, true), inArray(pageSectionItems.sectionId, sectionIds))).orderBy(asc(pageSectionItems.position))
    : [];
  const mediaIds = [...new Set(allItems.map((item) => item.mediaId).filter((id): id is string => Boolean(id)))];
  const itemMedia = mediaIds.length
    ? await db.select({ id: mediaAssets.id, url: mediaAssets.url, altText: mediaAssets.altText, mimeType: mediaAssets.mimeType }).from(mediaAssets).where(and(eq(mediaAssets.status, "active"), inArray(mediaAssets.id, mediaIds)))
    : [];
  const mediaById = new Map(itemMedia.map((media) => [media.id, media]));

  return {
    page,
    ogImageUrl: ogRows[0]?.url ?? "",
    sections: sections.map((section) => ({
      ...section,
      items: allItems
        .filter((item) => item.sectionId === section.id)
        .map((item) => {
          const media = item.mediaId ? mediaById.get(item.mediaId) : undefined;
          return {
            ...item,
            mediaUrl: media?.url ?? "",
            mediaAltText: media?.altText ?? "",
            mediaMimeType: media?.mimeType ?? "",
          };
        }),
    })),
  };
}
