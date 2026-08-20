"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { deletePageAction } from "../../page-actions";
import styles from "../artists/ArtistManager.module.css";

export type PageSummary = {
  id: string;
  title: string;
  route: string;
  enabled: boolean;
  sections: string[];
  seoConfigured: boolean;
  updatedAt: string;
};

function DeleteButton() {
  const { pending } = useFormStatus();
  return <button className={styles.dangerButton} type="submit" disabled={pending}>{pending ? "Excluindo..." : "Excluir página"}</button>;
}

export default function PageManager({ pages, deleted }: { pages: PageSummary[]; deleted?: boolean }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PageSummary | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pt-BR");
    return pages.filter((page) => {
      const matchesQuery = !needle || [page.title, page.route, ...page.sections].join(" ").toLocaleLowerCase("pt-BR").includes(needle);
      const matchesStatus = status === "all" || (status === "active" ? page.enabled : !page.enabled);
      return matchesQuery && matchesStatus;
    });
  }, [pages, query, status]);

  function actions(page: PageSummary) {
    return (
      <div className={styles.menuWrap}>
        <button className={styles.more} type="button" aria-label={`Ações de ${page.title}`} aria-expanded={menuId === page.id} onClick={() => setMenuId(menuId === page.id ? null : page.id)}>•••</button>
        {menuId === page.id ? <div className={styles.menu}>
          <Link href="/admin/pages/new" onClick={() => setMenuId(null)}>Criar página</Link>
          <Link href={`/admin/pages/${page.id}/view`} onClick={() => setMenuId(null)}>Ver</Link>
          <Link href={`/admin/pages/${page.id}`} onClick={() => setMenuId(null)}>Editar</Link>
          <button className={styles.danger} type="button" onClick={() => { setMenuId(null); setDeleteTarget(page); }}>Excluir</button>
        </div> : null}
      </div>
    );
  }

  return (
    <>
      {deleted ? <div className={styles.success}>Página excluída com sucesso.</div> : null}
      <section className="adminPanel adminStack"><div className={styles.toolbar}>
        <input className={styles.search} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por página, rota ou seção..." aria-label="Buscar páginas" />
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrar por status"><option value="all">Todos os status</option><option value="active">Ativas</option><option value="inactive">Inativas</option></select>
        <span className={styles.count}>{filtered.length} de {pages.length} páginas</span>
      </div></section>

      {!filtered.length ? <div className={styles.empty}><strong>Nenhuma página encontrada.</strong><Link href="/admin/pages/new">Criar a primeira página →</Link></div> : (
        <div className={styles.list}>{filtered.map((page) => <article className={styles.listCard} key={page.id}>
          <div className={styles.avatar}>PG</div>
          <div><div className={styles.statusLine}><strong>{page.title}</strong><span className={`adminBadge ${page.enabled ? "live" : "draft"}`}>{page.enabled ? "Ativa" : "Inativa"}</span></div><div className={styles.meta}>{page.route} · atualizado {page.updatedAt}</div><div className={styles.chips}>{page.sections.slice(0, 4).map((section) => <span className={styles.chip} key={section}>{section}</span>)}{page.sections.length > 4 ? <span className={styles.chip}>+{page.sections.length - 4}</span> : null}</div></div>
          <div className={styles.meta}><strong>Seções</strong><br />{page.sections.length} vinculada{page.sections.length === 1 ? "" : "s"}</div>
          <div className={styles.chips}><span className={`${styles.chip} ${page.seoConfigured ? styles.destination : ""}`}>SEO {page.seoConfigured ? "configurado" : "pendente"}</span></div>
          {actions(page)}
        </article>)}</div>
      )}

      {deleteTarget ? <div className={styles.confirmBackdrop} role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setDeleteTarget(null); }}><div className={styles.confirm} role="dialog" aria-modal="true" aria-labelledby="delete-page-title"><h2 id="delete-page-title">Excluir página</h2><p>Tem certeza que deseja excluir <strong>{deleteTarget.title}</strong>? As seções e itens vinculados a essa página também serão removidos.</p><form action={deletePageAction}><input type="hidden" name="id" value={deleteTarget.id}/><div className={styles.confirmActions}><button className="adminButton" type="button" onClick={() => setDeleteTarget(null)}>Cancelar</button><DeleteButton /></div></form></div></div> : null}
    </>
  );
}
