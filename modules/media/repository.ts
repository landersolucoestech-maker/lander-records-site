import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { mediaAssets, releases } from "@/lib/db/schema";
export async function getFeaturedReleases() {
  return getDb().select({ release: releases, coverUrl: mediaAssets.url }).from(releases).leftJoin(mediaAssets, eq(releases.coverMediaId, mediaAssets.id)).where(and(eq(releases.active, true), eq(releases.featuredOnHome, true))).orderBy(asc(releases.position), desc(releases.releaseDate));
}
