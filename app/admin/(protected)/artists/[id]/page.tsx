import Link from "next/link";
import { notFound } from "next/navigation";
import ArtistForm from "../ArtistForm";
import { loadArtistEditor, loadArtistOptions } from "../editor-data";

export const dynamic = "force-dynamic";

export default async function EditArtistPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const [{ saved }, initial, options] = await Promise.all([searchParams, loadArtistEditor(id), loadArtistOptions()]);
  if (!initial) notFound();

  return (
    <div className="adminPage">
      <header className="adminPageHeader">
        <div><p className="adminEyebrow">ARTISTA</p><h1>{initial.name}</h1><p>Edite identidade, publicação, métricas, plataformas, mídia e conteúdo público sem misturar responsabilidades.</p></div>
        <div className="adminActions"><Link className="adminButton" href={`/admin/artists/${id}/view`}>Visualizar</Link><Link className="adminButton" href="/admin/artists">Voltar</Link></div>
      </header>
      {saved ? <div className="adminAlert">Alterações salvas com sucesso.</div> : null}
      <ArtistForm initial={initial} {...options} />
    </div>
  );
}
