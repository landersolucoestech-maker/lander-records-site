import Link from "next/link";
import { createPost } from "../../../actions";

export default function NewPostPage() {
  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">EDITORIAL</p><h1>Nova publicação</h1><p>O registro começa como rascunho e só aparece publicamente quando for publicado.</p></div><Link className="adminButton" href="/admin/posts">Voltar</Link></header>
      <section className="adminPanel">
        <form action={createPost} className="adminForm">
          <label>Título<input name="title" required /></label>
          <label>Slug<input name="slug" placeholder="gerado pelo título se vazio" /></label>
          <button className="adminButton primary" type="submit">Criar rascunho</button>
        </form>
      </section>
    </div>
  );
}
