import { desc } from "drizzle-orm";
import { requireAdmin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { mediaAssets } from "../../../../lib/db/schema";
import { archiveMedia, uploadMedia } from "../../actions";
import { MediaLibrary, type MediaLibraryItem } from "./MediaLibrary";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const session = await requireAdmin();
  const rows = await getDb().select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt));
  const items: MediaLibraryItem[] = rows.map((media) => ({
    id: media.id,
    url: media.url,
    originalFilename: media.originalFilename,
    storageProvider: media.storageProvider,
    mimeType: media.mimeType,
    width: media.width,
    height: media.height,
    byteSize: media.byteSize,
    altText: media.altText || "",
    status: media.status,
    createdAt: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(media.createdAt),
  }));
  const persistent = session.source === "session";
  const canUpload = persistent && session.user.role !== "viewer";
  const canArchive = persistent && (session.user.role === "admin" || session.user.role === "owner");

  return <MediaLibrary archiveAction={archiveMedia} canArchive={canArchive} canUpload={canUpload} items={items} uploadAction={uploadMedia} />;
}
