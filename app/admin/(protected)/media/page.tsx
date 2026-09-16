import { desc } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { mediaAssets } from "../../../../lib/db/schema";
import { archiveMedia, uploadMedia } from "../../actions";
import { MediaLibrary, type MediaLibraryItem } from "./MediaLibrary";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
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

  return <MediaLibrary archiveAction={archiveMedia} items={items} uploadAction={uploadMedia} />;
}
