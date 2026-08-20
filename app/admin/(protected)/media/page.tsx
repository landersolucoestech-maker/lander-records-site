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
      <header className="adminPageHeader"><div><p className="adminEyebrow">ASSETS</p><h1>Biblioteca de mídia</h1><p>Listagem central de arquivos, metadados, dimensões, alt text, status e ciclo de vida.</p></div></header>
      {!storageConfigured ? <div className="adminAlert error">Storage ainda não provisionado. O painel não finge upload: o envio real só funciona quando BLOB_READ_WRITE_TOKEN existir no runtime.</div> : null}
      <section className="adminPanel"><h2>Upload</h2><form action={uploadMedia} className="adminForm"><div className="adminFormGrid"><label>Imagem<input name="file" type="file" accept="image/*" required /></label><label>Texto alternativo<input name="altText" maxLength={500} required /></label></div><p>Imagens são rotacionadas corretamente, limitadas a 2400px, convertidas para WebP e comprimidas antes do armazenamento.</p><button className="adminButton primary" type="submit" disabled={!storageConfigured}>Enviar imagem</button></form></section>
      <section className="adminPanel">
        {rows.length ? <table className="adminTable"><thead><tr><th>Arquivo</th><th>Tipo</th><th>Dimensões</th><th>Tamanho</th><th>Alt text</th><th>Status</th><th>Ações</th></tr></thead><tbody>{rows.map((media) => <tr key={media.id}><td><div style={{display:"flex",alignItems:"center",gap:10}}><img src={media.url} alt="" style={{width:46,height:46,objectFit:"cover",borderRadius:7,background:"#eceef1"}}/><div><strong>{media.originalFilename}</strong><br/><small>{media.storageProvider}</small></div></div></td><td>{media.mimeType}</td><td>{media.width && media.height ? `${media.width}×${media.height}` : "—"}</td><td>{Math.round(media.byteSize/1024)} KB</td><td>{media.altText || "—"}</td><td><span className={`adminBadge ${media.status === "active" ? "live" : "archived"}`}>{media.status === "active" ? "Ativo" : "Arquivado"}</span></td><td>{media.status === "active" ? <form action={archiveMedia}><input type="hidden" name="id" value={media.id}/><button className="adminButton danger" type="submit">Arquivar</button></form> : "—"}</td></tr>)}</tbody></table> : <div className="adminEmpty">Nenhuma mídia cadastrada.</div>}
      </section>
    </div>
  );
}
