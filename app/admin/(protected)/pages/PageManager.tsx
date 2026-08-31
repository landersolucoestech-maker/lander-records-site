"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdminIcon, type IconName } from "../../components/AdminIcon";
import styles from "./PagesManager.module.css";
import type { PageClassification } from "./page-contract";

export type PageSummary = {
  id: string; key: string; title: string; configuredRoute: string; publicRoute: string | null;
  classification: PageClassification; scope: string; routeWarning: boolean; enabled: boolean;
  seoConfigured: boolean; sectionCount: number; enabledSectionCount: number; updatedAt: string;
};
type Filters = { q?: string; status?: string; type?: string };
type Metrics = { total: number; enabled: number; disabled: number; seoIncomplete: number };
const typeValues: Record<PageClassification, string> = { Estrutural: "structural", Institucional: "institutional", "Módulo de domínio": "domain", Funcional: "functional", "Estrutura administrativa": "administrative" };

export default function PageManager({ canEdit = true, initialFilters = {}, metrics: metricCounts, pages, preview = false }: { canEdit?: boolean; initialFilters?: Filters; metrics?: Metrics; pages: PageSummary[]; preview?: boolean }) {
  const router = useRouter(); const pathname = usePathname();
  const [query, setQuery] = useState(initialFilters.q || ""); const [status, setStatus] = useState(initialFilters.status || "all"); const [type, setType] = useState(initialFilters.type || "all");
  useEffect(() => { if (preview) return; const params = new URLSearchParams(); if (query.trim()) params.set("q", query.trim()); if (status !== "all") params.set("status", status); if (type !== "all") params.set("type", type); const timer = window.setTimeout(() => router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false }), 180); return () => window.clearTimeout(timer); }, [pathname, preview, query, router, status, type]);
  const filtered = useMemo(() => { if (!preview) return pages; const needle = query.trim().toLocaleLowerCase("pt-BR"); return pages.filter((page) => (!needle || [page.title, page.key, page.configuredRoute].join(" ").toLocaleLowerCase("pt-BR").includes(needle)) && (status === "all" || (status === "enabled" ? page.enabled : !page.enabled)) && (type === "all" || typeValues[page.classification] === type)); }, [pages, preview, query, status, type]);
  const counts = metricCounts || { total: pages.length, enabled: pages.filter((page) => page.enabled).length, disabled: pages.filter((page) => !page.enabled).length, seoIncomplete: pages.filter((page) => !page.seoConfigured).length };
  const metrics: Array<[IconName, string, number, string]> = [["pages", "Total de páginas", counts.total, "Registradas no CMS"], ["home", "Conteúdo habilitado", counts.enabled, "Registros ativos no CMS"], ["calendar", "Conteúdo desabilitado", counts.disabled, "Registros inativos no CMS"], ["search", "SEO editorial incompleto", counts.seoIncomplete, "Título ou descrição ausente"]];
  const hasFilters = Boolean(query.trim() || status !== "all" || type !== "all");
  const clearFilters = () => { setQuery(""); setStatus("all"); setType("all"); };

  return <div className={styles.manager} data-testid="pages-manager">
    {preview ? <div className="adminPreviewNotice">BACKEND_ENVIRONMENT_DEFERRED · dados estruturais isolados e sem persistência.</div> : null}
    <header className={styles.header}><div><p>Páginas / Visão geral</p><h1>Páginas</h1><span>Gerencie as páginas e conteúdos estruturais do site.</span></div></header>
    <section aria-label="Resumo das páginas" className={styles.metrics}>{metrics.map(([icon, label, value, detail]) => <article data-testid="pages-metric-card" key={label}><span className={styles.metricIcon}><AdminIcon name={icon} /></span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>)}</section>
    <section className={styles.catalog}>
      <div className={styles.toolbar} role="search"><label className={styles.search}><span className="srOnly">Buscar páginas</span><AdminIcon name="search" size={17} /><input onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título, slug ou chave..." type="search" value={query} /></label><label><span>Estado do conteúdo</span><select onChange={(event) => setStatus(event.target.value)} value={status}><option value="all">Todos</option><option value="enabled">Habilitado</option><option value="disabled">Desabilitado</option></select></label><label><span>Classificação</span><select onChange={(event) => setType(event.target.value)} value={type}><option value="all">Todas</option><option value="structural">Estrutural</option><option value="institutional">Institucional</option><option value="domain">Módulo de domínio</option><option value="functional">Funcional</option><option value="administrative">Estrutura administrativa</option></select></label>{hasFilters && filtered.length ? <button className="adminButton" onClick={clearFilters} type="button">Limpar filtros</button> : null}</div>
      {filtered.length ? <div aria-label="Páginas administráveis" role="table">
        <div className={styles.tableHeader} role="row">{["Página", "Classificação", "Estado", "Seções", "Registro atualizado", "Ações"].map((label) => <span key={label} role="columnheader">{label}</span>)}</div>
        <div className={styles.rows} role="rowgroup">{filtered.map((page) => <div className={styles.row} data-testid="pages-row" key={page.id} role="row">
          <div className={styles.identity} role="cell"><span className={styles.pageIcon}><AdminIcon name="pages" /></span><span><strong>{page.title}</strong><p>{page.publicRoute || "Sem rota pública disponível"}</p><small>{page.routeWarning ? `Registro: ${page.configuredRoute}` : page.scope}</small></span></div>
          <div className={styles.classification} role="cell"><span>{page.classification}</span><small>{page.scope}</small></div>
          <div role="cell"><span className={`adminBadge ${page.enabled ? "live" : "draft"}`}><i aria-hidden="true" />{page.enabled ? "Conteúdo habilitado" : "Conteúdo desabilitado"}</span>{page.routeWarning ? <small className={styles.warning}>Rota não resolvida pelo frontend</small> : null}</div>
          <div className={styles.sections} role="cell"><strong>{page.enabledSectionCount}</strong><span>ativas de {page.sectionCount} registradas</span></div>
          <time className={styles.date} role="cell">{page.updatedAt}</time>
          <div aria-label={`Ações de ${page.title}`} className={styles.actions} role="cell">{canEdit && !preview ? <Link aria-label={`Editar conteúdo de ${page.title}`} href={`/admin/pages/${page.id}`}><AdminIcon name="pages" size={16} /></Link> : preview ? <button aria-label={`Editar conteúdo de ${page.title}`} disabled type="button"><AdminIcon name="pages" size={16} /></button> : null}{!preview ? <Link aria-label={`Consultar ${page.title} no CMS`} href={`/admin/pages/${page.id}/view`}><AdminIcon name="search" size={16} /></Link> : <button aria-label={`Consultar ${page.title} no CMS`} disabled type="button"><AdminIcon name="search" size={16} /></button>}{page.publicRoute && !preview ? <Link aria-label={`Abrir página pública ${page.title} (abre em nova aba)`} href={page.publicRoute} rel="noopener noreferrer" target="_blank"><AdminIcon name="external" size={16} /></Link> : null}</div>
        </div>)}</div><div className={styles.resultCount}>Mostrando {filtered.length} de {counts.total} páginas</div>
      </div> : <div className={styles.empty} data-testid="pages-empty"><strong>{pages.length ? "Nenhuma página encontrada para os filtros selecionados." : "Nenhuma página administrável encontrada."}</strong>{hasFilters ? <button className="adminButton" onClick={clearFilters} type="button">Limpar filtros</button> : null}</div>}
    </section>
    <section className={styles.guidance} aria-label="Limites do módulo Páginas"><article><AdminIcon name="navigation" /><div><h2>Navegação é gerenciada separadamente</h2><p>Para incluir ou ordenar links nos menus do site, utilize o módulo Navegação.</p>{preview ? null : <Link className="adminButton" href="/admin/navigation">Gerenciar navegação</Link>}</div></article><article><AdminIcon name="pages" /><div><h2>Criação pública ainda não disponível</h2><p>Novos registros não recebem automaticamente uma rota ou template no frontend.</p></div></article><article><AdminIcon name="pages" /><div><h2>Páginas legais permanecem no código</h2><p>Política de Privacidade e Termos ainda não são administráveis neste módulo.</p></div></article></section>
  </div>;
}
