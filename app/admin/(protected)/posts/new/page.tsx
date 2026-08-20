import Link from "next/link";
import PostForm from "../PostForm";
import { loadPostOptions } from "../editor-data";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const options = await loadPostOptions();
  return (
    <div className="adminPage">
      <header className="adminPageHeader">
        <div><p className="adminEyebrow">NOTÍCIAS</p><h1>Nova notícia</h1><p>Cadastre publicação, imagem principal, autor, texto, links e conteúdo em um único fluxo.</p></div>
        <Link className="adminButton" href="/admin/posts">Voltar</Link>
      </header>
      <PostForm {...options} />
    </div>
  );
}
