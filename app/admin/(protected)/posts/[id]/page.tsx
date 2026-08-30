import Link from "next/link";
import { notFound } from "next/navigation";
import PostForm from "../PostForm";
import { loadPostEditor, loadPostOptions } from "../editor-data";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const [{ saved }, initial, options] = await Promise.all([searchParams, loadPostEditor(id), loadPostOptions()]);
  if (!initial) notFound();

  return (
    <div className="adminPage">
      <header className="adminPageHeader">
        <div><p className="adminEyebrow">NOTÍCIA</p><h1>{initial.title}</h1><p>Edite publicação, imagem principal, autor, links, conteúdo e SEO no mesmo fluxo.</p></div>
        <div className="adminActions"><Link className="adminButton" href={`/admin/posts/${id}/view`}>Visualizar</Link><Link className="adminButton" href="/admin/posts">Voltar</Link></div>
      </header>
      {saved ? <div className="adminAlert">Alterações salvas com sucesso.</div> : null}
      <PostForm initial={initial} {...options} />
    </div>
  );
}
