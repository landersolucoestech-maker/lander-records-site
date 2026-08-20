import Link from "next/link";
import { sql } from "drizzle-orm";
import { getDb } from "../../../lib/db";
import { artists, contactSubmissions, mediaAssets, posts } from "../../../lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const db = getDb();
  const [artistCount, postCount, contactCount, mediaCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(artists),
    db.select({ count: sql<number>`count(*)::int` }).from(posts),
    db.select({ count: sql<number>`count(*)::int` }).from(contactSubmissions),
    db.select({ count: sql<number>`count(*)::int` }).from(mediaAssets),
  ]);

  const cards = [
    ["Artistas", artistCount[0]?.count ?? 0, "/admin/artists"],
    ["Publicações", postCount[0]?.count ?? 0, "/admin/posts"],
    ["Contatos recebidos", contactCount[0]?.count ?? 0, "/admin/contacts"],
    ["Mídias", mediaCount[0]?.count ?? 0, "/admin/media"],
  ] as const;

  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">LANDER RECORDS</p><h1>Visão geral</h1><p>Operação de conteúdo, publicação e entradas do site público.</p></div></header>
      <div className="adminMetricGrid">{cards.map(([label, value, href]) => <Link className="adminMetricCard" href={href} key={label}><span>{label}</span><strong>{value}</strong><small>Abrir módulo →</small></Link>)}</div>
      <section className="adminPanel">
        <h2>Arquitetura operacional</h2>
        <p>Alterações publicadas aqui alimentam diretamente o site público. Conteúdo despublicado não é retornado pelas consultas públicas, e operações administrativas relevantes geram registro de auditoria.</p>
      </section>
    </div>
  );
}
