import { desc } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { mediaAssets } from "../../../../lib/db/schema";
import { archiveMedia, uploadMedia } from "../../actions";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const rows = await getDb().select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt));
  const storageConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">ASSETS</p><h1>Biblioteca de mídia</h1><p>Arquivos ficam no storage; o banco armazena somente metadados, URL, dimensões e alt text.</p></div></header>
      {!storageConfigured ? <div className="adminAlert error">Storage ainda não provisionado. O painel não finge upload: o botão real só funcionará quando BLOB_READ_WRITE_TOKEN existir no runtime.</div> : null}
      <section className="adminPanel"><h2>Upload</h2><form action={uploadMedia} className="adminForm"><div className="adminFormGrid"><label>Imagem<input name="file" type="file" accept="image/*" required /></label><label>Texto alternativo<input name="altText" maxLength={500} required /></label></div><p>Imagens são rotacionadas corretamente, limitadas a 2400px, convertidas para WebP e comprimidas antes do armazenamento.</p><button className="adminButton primary" type="submit" disabled={!storageConfigured}>Enviar imagem</button></form></section>
      <section className="adminPanel"><div className="adminMediaGrid">{rows.map((media) => <article className="adminMediaCard" key={media.id}><img src={media.url} alt={media.altText}/><div><strong>{media.originalFilename}</strong><span>{media.width}×{media.height} · {Math.round(media.byteSize/1024)} KB</span><span>{media.altText}</span><span className={`adminBadge ${media.status === "active" ? "live" : "archived"}`}>{media.status}</span>{media.status === "active" ? <form action={archiveMedia}><input type="hidden" name="id" value={media.id}/><button className="adminButton danger" type="submit">Arquivar</button></form> : null}</div></article>)}</div></section>
    </div>
  );
}
