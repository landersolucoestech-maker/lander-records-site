import Link from "next/link";
import { desc } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { posts } from "../../../../lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const rows = await getDb().select().from(posts).orderBy(desc(posts.createdAt));
  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">EDITORIAL</p><h1>Notícias / Posts</h1><p>Rascunho, publicação, agendamento, destaque, conteúdo e SEO.</p></div><Link className="adminButton primary" href="/admin/posts/new">Nova publicação</Link></header>
      <section className="adminPanel">
        <table className="adminTable"><thead><tr><th>Título</th><th>Slug</th><th>Status</th><th>Publicação</th><th>Home</th><th></th></tr></thead>
          <tbody>{rows.map((post) => <tr key={post.id}><td><strong>{post.title}</strong></td><td>{post.slug}</td><td><span className={`adminBadge ${post.status === "published" ? "live" : post.status === "archived" ? "archived" : "draft"}`}>{post.status}</span></td><td>{post.publishedAt ? new Intl.DateTimeFormat("pt-BR").format(post.publishedAt) : "—"}</td><td>{post.featuredOnHome ? "Sim" : "Não"}</td><td><Link href={`/admin/posts/${post.id}`}>Editar →</Link></td></tr>)}</tbody>
        </table>
      </section>
    </div>
  );
}
