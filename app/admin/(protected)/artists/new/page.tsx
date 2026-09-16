import ArtistForm from "../ArtistForm";
import { loadArtistOptions } from "../editor-data";

export const dynamic = "force-dynamic";

export default async function NewArtistPage() {
  const options = await loadArtistOptions();
  return <div className="adminPage"><ArtistForm {...options} /></div>;
}
