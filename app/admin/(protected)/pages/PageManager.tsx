"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

export default function PageManager({ pages }: { pages: PageSummary[]; deleted?: boolean }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [menuId, setMenuId] = useState<string | null>(null);

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
          <Link href={page.route} target="_blank" onClick={() => setMenuId(null)}>Ver página</Link>
          <Link href={`/admin/pages/${page.id}`} onClick={() => setMenuId(null)}>Editar conteúdo das seções</Link>
        </div> : null}
      </div>
    );
  }

  return (
    <>
      <section className="adminPanel adminStack">
        <div className={styles.toolbar}>
          <input className={styles.search} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por página, rota ou seção..." aria-label="Buscar páginas" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrar por status"><option value="all">Todos os status</option><option value="active">Ativas</option><option value="inactive">Inativas</option></select>
          <span className={styles.count}>{filtered.length} de {pages.length} páginas</span>
        </div>
      </section>

      {!filtered.length ? <div className={styles.empty}><strong>Nenhuma página detectada no projeto.</strong><span>As páginas e seções são definidas no código e aparecem aqui quando registradas no conteúdo do site.</span></div> : (
        <div className={styles.list}>{filtered.map((page) => <article className={styles.listCard} key={page.id}>
          <div className={styles.avatar}>PG</div>
          <div><div className={styles.statusLine}><strong>{page.title}</strong><span className={`adminBadge ${page.enabled ? "live" : "draft"}`}>{page.enabled ? "Ativa" : "Inativa"}</span></div><div className={styles.meta}>{page.route} · atualizada {page.updatedAt}</div><div className={styles.chips}>{page.sections.slice(0, 4).map((section) => <span className={styles.chip} key={section}>{section}</span>)}{page.sections.length > 4 ? <span className={styles.chip}>+{page.sections.length - 4}</span> : null}</div></div>
          <div className={styles.meta}><strong>Seções renderizadas</strong><br />{page.sections.length} detectada{page.sections.length === 1 ? "" : "s"}</div>
          <div className={styles.chips}><span className={styles.destination}>Estrutura via VS Code</span></div>
          {actions(page)}
        </article>)}</div>
      )}
    </>
  );
}
