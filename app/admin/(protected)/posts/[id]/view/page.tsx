import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { loadPostEditor, loadPostOptions } from "../../editor-data";
import styles from "../../../artists/ArtistView.module.css";

export const dynamic = "force-dynamic";

export default async function PostViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, options] = await Promise.all([loadPostEditor(id), loadPostOptions()]);
  if (!post) notFound();

  const category = options.categories.find((item) => item.id === post.categoryId)?.name || "Sem categoria";
  const statusLabel = post.status === "published" ? "Publicado" : post.status === "archived" ? "Arquivado" : "Rascunho";
  const statusClass = post.status === "published" ? "adminBadge live" : post.status === "archived" ? "adminBadge archived" : "adminBadge draft";

  return (
    <div className="adminPage">
      <header className="adminPageHeader">
        <div><p className="adminEyebrow">CONSULTA DA NOTÍCIA</p><h1>{post.title}</h1><p>Visão consolidada da publicação sem transformar o formulário em modo somente leitura.</p></div>
        <div className="adminActions"><Link className="adminButton primary" href={`/admin/posts/${id}`}>Editar notícia</Link><Link className="adminButton" href="/admin/posts">Voltar</Link></div>
      </header>

      <section className={styles.hero}>
        {post.coverImage ? <img className={styles.portrait} src={post.coverImage} alt={`Imagem principal de ${post.title}`} /> : <div className={styles.portrait}>NT</div>}
        <div><span className={statusClass}>{statusLabel}</span><h1>{post.title}</h1><p>{post.excerpt || "Sem texto curto cadastrado."}</p><div className={styles.chips}><span className={styles.chip}>{category}</span><span className={styles.chip}>{post.authorName}</span></div></div>
      </section>

      <div className={styles.grid}>
        <section className={styles.card}><h2>Publicação</h2><div className={styles.row}><span>Status</span><strong>{statusLabel}</strong></div><div className={styles.row}><span>Categoria</span><strong>{category}</strong></div><div className={styles.row}><span>Data</span><strong>{post.publishedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date(post.publishedAt)) : "Não definida"}</strong></div><div className={styles.row}><span>Slug</span><strong>{post.slug}</strong></div><div className={styles.row}><span>Link</span><strong>{post.publicationLink || `/noticias/${post.slug}`}</strong></div></section>
        <section className={styles.card}><h2>Autor</h2>{post.authorImage ? <img className={styles.banner} src={post.authorImage} alt={post.authorName} /> : <p className={styles.empty}>Imagem do autor não cadastrada.</p>}<div className={styles.row}><span>Nome</span><strong>{post.authorName}</strong></div></section>
      </div>

      <section className={styles.card}><h2>Imagem principal</h2>{post.coverImage ? <img className={styles.banner} src={post.coverImage} alt={`Imagem principal de ${post.title}`} /> : <p className={styles.empty}>Imagem principal não cadastrada.</p>}<p className={styles.empty}>A mesma imagem é usada na Home, na página geral de Notícias e no banner da página individual.</p></section>

      <div className={styles.grid}>
        <section className={styles.card}><h2>Links da publicação</h2>{Object.entries(post.links || {}).length ? Object.entries(post.links || {}).map(([platform, url]) => <div className={styles.row} key={platform}><span>{platform}</span><a href={url} target="_blank" rel="noreferrer">Abrir ↗</a></div>) : <p className={styles.empty}>Nenhum link social cadastrado.</p>}</section>
        <section className={styles.card}><h2>Exibição</h2><div className={styles.row}><span>Home / Notícias</span><strong>{post.featuredOnHome ? "Exibir" : "Não exibir"}</strong></div><div className={styles.row}><span>Ordem na Home</span><strong>{post.homePosition}</strong></div></section>
      </div>

      <section className={styles.card}><h2>Texto</h2><div className={styles.bio}>{post.excerpt || "Texto curto não cadastrado."}</div></section>
      <section className={styles.card}><h2>Conteúdo</h2><div className="markdownContent"><ReactMarkdown remarkPlugins={[remarkGfm]}>{post.contentMarkdown}</ReactMarkdown></div></section>
    </div>
  );
}
