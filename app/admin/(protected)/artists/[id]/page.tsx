import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "../../../../../lib/auth";
import { mockDataEnabled } from "../../../../../lib/mocks";
import ArtistForm from "../ArtistForm";
import { loadArtistEditor, loadArtistOptions } from "../editor-data";

export const dynamic = "force-dynamic";

export default async function EditArtistPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const session = await requireAdmin("editor");
  if (session.source !== "session" && !mockDataEnabled()) redirect("/admin/artists");
  const { id } = await params;
  const [{ saved }, initial, options] = await Promise.all([searchParams, loadArtistEditor(id), loadArtistOptions()]);
  if (!initial) notFound();

  return <div className="adminPage">
    {saved ? <div className="adminAlert">Alterações salvas com sucesso.</div> : null}
    <ArtistForm initial={initial} {...options} />
  </div>;
}
