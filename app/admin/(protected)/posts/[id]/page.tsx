import { notFound } from "next/navigation";
import PostForm from "../PostForm";
import { loadPostEditor, loadPostOptions } from "../editor-data";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const [{ saved }, initial, options] = await Promise.all([searchParams, loadPostEditor(id), loadPostOptions()]);
  if (!initial) notFound();

  return <div className="adminPage">
    {saved ? <div className="adminAlert">Alterações salvas com sucesso.</div> : null}
    <PostForm initial={initial} {...options} />
  </div>;
}
