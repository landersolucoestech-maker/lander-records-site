import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { mediaAssets, navigationItems, siteSettings, slugRedirects, socialLinks } from "@/lib/db/schema";
import { mockDataEnabled, mockNavigation, mockSiteSettings, mockSocialLinks } from "@/lib/mocks";
export async function getSiteChrome() {
  if (mockDataEnabled()) return { settings: mockSiteSettings, logoUrl: "/lander-records-logo.webp", socialImageUrl: "/lander-records-anuncie-banner.webp", navigation: mockNavigation, socials: mockSocialLinks };
  const db = getDb();
  const [settingsRows, nav, socials, mediaRows] = await Promise.all([
    db.select().from(siteSettings).limit(1),
    db.select().from(navigationItems).where(eq(navigationItems.enabled, true)).orderBy(asc(navigationItems.menuKey), asc(navigationItems.position)),
    db.select().from(socialLinks).where(eq(socialLinks.active, true)).orderBy(asc(socialLinks.position)),
    db.select().from(mediaAssets).where(eq(mediaAssets.status, "active")),
  ]);
  const resolvedSettings = settingsRows[0] ?? {
    id: "site", brandName: "Lander Records", tagline: "", contactEmail: "", contactPhone: "", location: "", address: "", hours: "",
    defaultSeoTitle: "Lander Records", defaultSeoDescription: "", logoMediaId: null, socialImageMediaId: null, updatedAt: new Date(),
  };
  const mediaMap = new Map(mediaRows.map((media) => [media.id, media.url]));
  return {
    settings: resolvedSettings,
    logoUrl: resolvedSettings.logoMediaId ? mediaMap.get(resolvedSettings.logoMediaId) ?? "" : "",
    socialImageUrl: resolvedSettings.socialImageMediaId ? mediaMap.get(resolvedSettings.socialImageMediaId) ?? "" : "",
    navigation: nav,
    socials,
  };
}

export async function getSlugRedirect(entityType: "artist" | "post", oldSlug: string) {
  if (mockDataEnabled()) return null;
  const rows = await getDb().select({ newSlug: slugRedirects.newSlug }).from(slugRedirects).where(and(eq(slugRedirects.entityType, entityType), eq(slugRedirects.oldSlug, oldSlug))).limit(1);
  return rows[0]?.newSlug ?? null;
}
