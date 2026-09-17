import { redirect } from "next/navigation";
import { requireAdmin } from "../../../../../../lib/auth";
import ArtistForm from "../ArtistForm";
import { loadArtistOptions } from "../editor-data";

export const dynamic = "force-dynamic";

export default async function NewArtistPage() {
  const session = await requireAdmin("editor");
  if (session.source !== "session") redirect("/admin/artists");
  const options = await loadArtistOptions();
  return <div className="adminPage"><ArtistForm {...options} /></div>;
}
