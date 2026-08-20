import Link from "next/link";
import ArtistForm from "../ArtistForm";
import { loadArtistOptions } from "../editor-data";

export const dynamic = "force-dynamic";

export default async function NewArtistPage() {
  const options = await loadArtistOptions();
  return (
    <div className="adminPage">
      <header className="adminPageHeader">
        <div><p className="adminEyebrow">ARTISTAS</p><h1>Novo artista</h1><p>Cadastre identidade, funções, gênero, métricas, plataformas, mídia e destinos de publicação em um único fluxo.</p></div>
        <Link className="adminButton" href="/admin/artists">Voltar</Link>
      </header>
      <ArtistForm {...options} />
    </div>
  );
}
