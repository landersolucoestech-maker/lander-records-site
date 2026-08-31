import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../../../lib/auth";
import { getDb } from "../../../../../../lib/db";
import { pageSectionBindings, sectionDefinitions } from "../../../../../../lib/db/page-management-schema";
import { pageSections, pages } from "../../../../../../lib/db/schema";
import styles from "../../../artists/ArtistView.module.css";
import { pageContract } from "../../page-contract";

export const dynamic = "force-dynamic";

export default async function PageView({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  const { id } = await params;
  const db = getDb();
  const [pageRows, sections] = await Promise.all([
    db.select().from(pages).where(eq(pages.id, id)).limit(1),
    db.select({ section: pageSections, definitionName: sectionDefinitions.name })
      .from(pageSections)
      .leftJoin(pageSectionBindings, eq(pageSections.id, pageSectionBindings.pageSectionId))
      .leftJoin(sectionDefinitions, eq(pageSectionBindings.definitionId, sectionDefinitions.id))
      .where(eq(pageSections.pageId, id))
      .orderBy(asc(pageSections.position)),
  ]);
  const page = pageRows[0];
  if (!page) notFound();
  const publicRoute = pageContract(page.key).route;

  return (
    <div className="adminPage">
      <header className="adminPageHeader">
        <div><p className="adminEyebrow">CONSULTA DA PÁGINA</p><h1>{page.title}</h1><p>Rota, seções identificadas, SEO e status da página.</p></div>
        <div className="adminActions">{session.user.role !== "viewer" ? <Link className="adminButton primary" href={`/admin/pages/${id}`}>Editar página</Link> : null}<Link className="adminButton" href="/admin/pages">Voltar</Link></div>
      </header>
      <div className={styles.grid}>
        <section className={styles.card}><h2>Página</h2><div className={styles.row}><span>Nome</span><strong>{page.title}</strong></div><div className={styles.row}><span>Rota pública</span><strong>{publicRoute || "Sem rota pública disponível"}</strong></div><div className={styles.row}><span>Slug cadastrado</span><strong>{page.slug ? `/${page.slug}` : "/"}</strong></div><div className={styles.row}><span>Chave permanente</span><strong>{page.key}</strong></div><div className={styles.row}><span>Estado do conteúdo</span><span className={`adminBadge ${page.enabled ? "live" : "draft"}`}>{page.enabled ? "Habilitado" : "Desabilitado"}</span></div></section>
        <section className={styles.card}><h2>SEO</h2><div className={styles.row}><span>Título</span><strong>{page.seoTitle || "Não definido"}</strong></div><div className={styles.row}><span>Descrição</span><strong>{page.seoDescription || "Não definida"}</strong></div><div className={styles.row}><span>Canonical</span><strong>{page.canonicalUrl || "Não definido (fallback global)"}</strong></div></section>
      </div>
      <section className={styles.card}><h2>Seções vinculadas</h2>{sections.length ? <div className={styles.publication}>{sections.map(({ section, definitionName }) => <div className={styles.publicationItem} key={section.id}><div><strong>{definitionName || section.title || "Seção de conteúdo"}</strong><div className={styles.empty}>{section.type} · posição {section.position}</div></div><span className={`adminBadge ${section.enabled ? "live" : "draft"}`}>{section.enabled ? "Ativa" : "Inativa"}</span></div>)}</div> : <p className={styles.empty}>Nenhuma seção vinculada.</p>}</section>
    </div>
  );
}
