import Link from "next/link";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../../../lib/db";
import { artistProfiles } from "../../../lib/db/artist-management-schema";
import { artistCategories, artists, auditLogs, pages, postCategories, posts } from "../../../lib/db/schema";

export const dynamic = "force-dynamic";

function countValue(rows: Array<{ count: number }>) {
  return rows[0]?.count ?? 0;
}

export default async function AdminDashboardPage() {
  const db = getDb();
  const [
    artistTotalRows,
    artistActiveRows,
    artistInactiveRows,
    artistPublishedRows,
    artistCategoryRows,
    postCategoryRows,
    publishedPostRows,
    draftArtistRows,
    draftPostRows,
    activePageRows,
    missingCardRows,
    missingHeroRows,
    recentAudits,
    recentArtists,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(artists).where(isNull(artists.archivedAt)),
    db.select({ count: sql<number>`count(*)::int` }).from(artistProfiles).where(eq(artistProfiles.isActive, true)),
    db.select({ count: sql<number>`count(*)::int` }).from(artistProfiles).where(eq(artistProfiles.isActive, false)),
    db.select({ count: sql<number>`count(*)::int` }).from(artists).where(and(eq(artists.isPublished, true), isNull(artists.archivedAt))),
    db.select({ count: sql<number>`count(*)::int` }).from(artistCategories),
    db.select({ count: sql<number>`count(*)::int` }).from(postCategories),
    db.select({ count: sql<number>`count(*)::int` }).from(posts).where(and(eq(posts.status, "published"), isNull(posts.archivedAt))),
    db.select({ count: sql<number>`count(*)::int` }).from(artists).where(and(eq(artists.isPublished, false), isNull(artists.archivedAt))),
    db.select({ count: sql<number>`count(*)::int` }).from(posts).where(and(eq(posts.status, "draft"), isNull(posts.archivedAt))),
    db.select({ count: sql<number>`count(*)::int` }).from(pages).where(eq(pages.enabled, true)),
    db.select({ count: sql<number>`count(*)::int` }).from(artists).where(and(isNull(artists.cardMediaId), isNull(artists.archivedAt))),
    db.select({ count: sql<number>`count(*)::int` }).from(artists).where(and(isNull(artists.heroMediaId), isNull(artists.archivedAt))),
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(6),
    db.select({ id: artists.id, name: artists.name, slug: artists.slug, isPublished: artists.isPublished, createdAt: artists.createdAt }).from(artists).where(isNull(artists.archivedAt)).orderBy(desc(artists.createdAt)).limit(5),
  ]);

  const artistTotal = countValue(artistTotalRows);
  const artistActive = countValue(artistActiveRows);
  const artistInactive = countValue(artistInactiveRows);
  const artistPublished = countValue(artistPublishedRows);
  const categoryTotal = countValue(artistCategoryRows) + countValue(postCategoryRows);
  const postPublished = countValue(publishedPostRows);
  const drafts = countValue(draftArtistRows) + countValue(draftPostRows);
  const activePages = countValue(activePageRows);
  const missingCard = countValue(missingCardRows);
  const missingHero = countValue(missingHeroRows);

  const cards = [
    ["Total de artistas", artistTotal, `${artistActive} ativos · ${artistInactive} inativos`, "/admin/artists"],
    ["Artistas publicados", artistPublished, `${Math.max(artistTotal - artistPublished, 0)} fora de publicação`, "/admin/artists"],
    ["Categorias", categoryTotal, `${countValue(artistCategoryRows)} artistas · ${countValue(postCategoryRows)} notícias`, "/admin/categories"],
    ["Notícias publicadas", postPublished, "Conteúdo editorial público", "/admin/posts"],
    ["Rascunhos", drafts, "Artistas + notícias aguardando publicação", "/admin/posts"],
    ["Páginas ativas", activePages, "Páginas administráveis do site", "/admin/pages"],
  ] as const;

  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">LANDER RECORDS</p><h1>Dashboard</h1><p>Painel operacional de conteúdo, publicação, manutenção e alterações do site.</p></div><Link className="adminButton" href="/admin/audit">Ver histórico completo</Link></header>

      <div className="adminMetricGrid">{cards.map(([label, value, detail, href]) => <Link className="adminMetricCard" href={href} key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></Link>)}</div>

      <div className="adminFormGrid">
        <section className="adminPanel adminStack">
          <h2>Conteúdos que precisam de manutenção</h2>
          {missingCard ? <Link className="adminSectionCard" href="/admin/artists"><strong>{missingCard} artista{missingCard > 1 ? "s" : ""} sem imagem principal</strong><span>Revisar cards e listagens →</span></Link> : null}
          {missingHero ? <Link className="adminSectionCard" href="/admin/artists"><strong>{missingHero} artista{missingHero > 1 ? "s" : ""} sem imagem Banner</strong><span>Revisar Hero das páginas individuais →</span></Link> : null}
          {drafts ? <Link className="adminSectionCard" href="/admin/posts"><strong>{drafts} conteúdo{drafts > 1 ? "s" : ""} em rascunho</strong><span>Revisar publicação →</span></Link> : null}
          {!missingCard && !missingHero && !drafts ? <div className="adminEmpty">Nenhuma pendência editorial crítica identificada.</div> : null}
        </section>

        <section className="adminPanel adminStack">
          <h2>Artistas adicionados recentemente</h2>
          {recentArtists.length ? recentArtists.map((artist) => <Link className="adminSectionCard" href={`/admin/artists/${artist.id}/view`} key={artist.id}><strong>{artist.name}</strong><span>{artist.isPublished ? "Publicado" : "Rascunho"} · /artistas/{artist.slug}</span></Link>) : <div className="adminEmpty">Nenhum artista cadastrado.</div>}
        </section>
      </div>

      <section className="adminPanel adminStack">
        <h2>Últimas alterações realizadas</h2>
        {recentAudits.length ? recentAudits.map((item) => <div className="adminSectionCard" key={item.id}><strong>{item.action}</strong><span>{item.entityType} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(item.createdAt)}</span></div>) : <div className="adminEmpty">Nenhuma atividade registrada.</div>}
      </section>
    </div>
  );
}
