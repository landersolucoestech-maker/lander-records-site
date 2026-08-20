import Link from "next/link";
import { createArtist } from "../../../actions";

export default function NewArtistPage() {
  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">ARTISTAS</p><h1>Novo artista</h1><p>Crie o registro; depois complete mídia, categorias, plataformas, publicação e SEO.</p></div><Link className="adminButton" href="/admin/artists">Voltar</Link></header>
      <section className="adminPanel">
        <form action={createArtist} className="adminForm">
          <div className="adminFormGrid">
            <label>Nome<input name="name" required maxLength={180} /></label>
            <label>Slug<input name="slug" maxLength={200} placeholder="gerado pelo nome se vazio" /></label>
            <label>Descrição curta / gênero<input name="eyebrow" maxLength={180} /></label>
            <label className="full">Resumo<textarea name="shortBio" /></label>
            <label className="full">Biografia<textarea name="biography" /></label>
          </div>
          <div className="adminActions"><button className="adminButton primary" type="submit">Criar artista</button></div>
        </form>
      </section>
    </div>
  );
}
