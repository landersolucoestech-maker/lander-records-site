import Image from "next/image";
import { desc } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { mediaAssets } from "../../../../lib/db/schema";
import { archiveMedia, uploadMedia } from "../../actions";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const rows = await getDb().select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt));
  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">ASSETS</p><h1>Biblioteca de mídia</h1><p>Listagem central de arquivos, metadados, dimensões, alt text, status e ciclo de vida.</p></div></header>
      <section className="adminPanel"><h2>Upload</h2><form action={uploadMedia} className="adminForm"><div className="adminFormGrid"><label>Imagem<input name="file" type="file" accept="image/*" required /></label><label>Texto alternativo<input name="altText" maxLength={500} required /></label></div><p>Imagens são rotacionadas corretamente, limitadas a 2400px, convertidas para WebP e armazenadas em public/uploads.</p><button className="adminButton primary" type="submit">Enviar imagem</button></form></section>
      <section className="adminPanel">
        {rows.length ? <table className="adminTable"><thead><tr><th>Arquivo</th><th>Tipo</th><th>Dimensões</th><th>Tamanho</th><th>Alt text</th><th>Status</th><th>Ações</th></tr></thead><tbody>{rows.map((media) => <tr key={media.id}><td><div style={{display:"flex",alignItems:"center",gap:10}}><Image src={media.url} alt="" width={46} height={46} unoptimized style={{objectFit:"cover",borderRadius:7,background:"#eceef1"}}/><div><strong>{media.originalFilename}</strong><br/><small>{media.storageProvider}</small></div></div></td><td>{media.mimeType}</td><td>{media.width && media.height ? `${media.width}×${media.height}` : "—"}</td><td>{Math.round(media.byteSize/1024)} KB</td><td>{media.altText || "—"}</td><td><span className={`adminBadge ${media.status === "active" ? "live" : "archived"}`}>{media.status === "active" ? "Ativo" : "Arquivado"}</span></td><td>{media.status === "active" ? <form action={archiveMedia}><input type="hidden" name="id" value={media.id}/><button className="adminButton danger" type="submit">Arquivar</button></form> : "—"}</td></tr>)}</tbody></table> : <div className="adminEmpty">Nenhuma mídia cadastrada.</div>}
      </section>
    </div>
  );
}
