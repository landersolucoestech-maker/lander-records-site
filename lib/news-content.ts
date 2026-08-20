import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { postLinks, postProfiles } from "./db/news-management-schema";
import { mediaAssets } from "./db/schema";

export async function getPublicPostPresentation(postId: string) {
  const db = getDb();
  const [profileRows, links] = await Promise.all([
    db.select({ publicationLink: postProfiles.publicationLink, authorImage: mediaAssets.url })
      .from(postProfiles)
      .leftJoin(mediaAssets, eq(postProfiles.authorMediaId, mediaAssets.id))
      .where(eq(postProfiles.postId, postId))
      .limit(1),
    db.select().from(postLinks).where(eq(postLinks.postId, postId)),
  ]);
  return {
    publicationLink: profileRows[0]?.publicationLink || "",
    authorImage: profileRows[0]?.authorImage || "",
    links: Object.fromEntries(links.map((link) => [link.platform, link.url])),
  };
}
