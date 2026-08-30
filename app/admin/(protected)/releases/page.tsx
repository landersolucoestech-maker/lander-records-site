import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { mediaAssets, releases } from "../../../../lib/db/schema";
import { upsertRelease } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ReleasesPage() {
  const db = getDb();
  const [rows, media] = await Promise.all([
    db.select().from(releases).orderBy(asc(releases.position)),
    db.select().from(mediaAssets).where(eq(mediaAssets.status, "active")).orderBy(asc(mediaAssets.originalFilename)),
  ]);
  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">CATÁLOGO PÚBLICO</p><h1>Lançamentos</h1><p>Cards de lançamentos exibidos na home, sem depender de arrays ou fallback hardcoded.</p></div></header>
      <section className="adminPanel adminStack">
        {rows.map((release) => <form action={upsertRelease} className="adminForm adminSectionCard" key={release.id}>
          <input type="hidden" name="id" value={release.id}/>
          <div className="adminFormGrid">
            <label>Título<input name="title" defaultValue={release.title} required/></label><label>Slug<input name="slug" defaultValue={release.slug} required/></label>
            <label>Artista<input name="artistName" defaultValue={release.artistName} required/></label><label>Tipo<input name="releaseType" defaultValue={release.releaseType}/></label>
            <label>Data<input name="releaseDate" type="date" defaultValue={release.releaseDate || ""}/></label><label>Plataforma<input name="platform" defaultValue={release.platform}/></label>
            <label>URL<input name="platformUrl" type="url" defaultValue={release.platformUrl}/></label><label>ID externo<input name="externalId" defaultValue={release.externalId || ""}/></label>
            <label>Capa<select name="coverMediaId" defaultValue={release.coverMediaId || ""}><option value="">Sem capa</option>{media.map((item) => <option key={item.id} value={item.id}>{item.originalFilename}</option>)}</select></label><label>Ordem<input name="position" type="number" defaultValue={release.position}/></label>
            <label className="adminCheck"><input name="featuredOnHome" type="checkbox" defaultChecked={release.featuredOnHome}/> Destaque na home</label><label className="adminCheck"><input name="active" type="checkbox" defaultChecked={release.active}/> Ativo</label>
          </div><button className="adminButton" type="submit">Salvar lançamento</button>
        </form>)}
      </section>
      <section className="adminPanel"><h2>Novo lançamento</h2><form action={upsertRelease} className="adminForm"><div className="adminFormGrid"><label>Título<input name="title" required/></label><label>Slug<input name="slug"/></label><label>Artista<input name="artistName" required/></label><label>Tipo<input name="releaseType" defaultValue="Single"/></label><label>Data<input name="releaseDate" type="date"/></label><label>Plataforma<input name="platform" defaultValue="Spotify"/></label><label>URL<input name="platformUrl" type="url"/></label><label>ID externo<input name="externalId"/></label><label>Capa<select name="coverMediaId" defaultValue=""><option value="">Sem capa</option>{media.map((item) => <option key={item.id} value={item.id}>{item.originalFilename}</option>)}</select></label><label>Ordem<input name="position" type="number" defaultValue={0}/></label><label className="adminCheck"><input name="featuredOnHome" type="checkbox" defaultChecked/> Destaque na home</label><label className="adminCheck"><input name="active" type="checkbox" defaultChecked/> Ativo</label></div><button className="adminButton primary" type="submit">Criar lançamento</button></form></section>
    </div>
  );
}
