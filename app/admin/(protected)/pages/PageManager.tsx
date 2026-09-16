"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { deletePageAction } from "../../page-actions";
import { AdminIcon } from "../../components/AdminIcon";
import styles from "./PagesManager.module.css";
import type { PageClassification } from "./page-contract";

export type PageSectionSummary = {
  id: string;
  sectionKey: string;
  type: string;
  position: number;
  enabled: boolean;
  title: string;
  subtitle: string;
};

export type PageSummary = {
  id: string;
  key: string;
  title: string;
  configuredRoute: string;
  publicRoute: string | null;
  classification: PageClassification;
  scope: string;
  routeWarning: boolean;
  enabled: boolean;
  seoConfigured: boolean;
  sectionCount: number;
  enabledSectionCount: number;
  updatedAt: string;
  sections?: PageSectionSummary[];
};

const referenceSections: PageSectionSummary[] = [
  { id: "reference-01", sectionKey: "hero", type: "hero", position: 1, enabled: true, title: "Hero Section", subtitle: "Hero oficial da Homepage, incluindo o Ticker integrado." },
  { id: "reference-02", sectionKey: "featured", type: "post_feed", position: 2, enabled: true, title: "Em Destaque", subtitle: "Grid principal de matérias em destaque da Homepage." },
  { id: "reference-03", sectionKey: "most_read", type: "post_ranking", position: 3, enabled: true, title: "Mais Lidas", subtitle: "Ranking das matérias mais acessadas." },
  { id: "reference-04", sectionKey: "latest_news", type: "post_feed", position: 4, enabled: true, title: "Últimas Notícias", subtitle: "Grid com as publicações mais recentes." },
  { id: "reference-05", sectionKey: "side_ad", type: "advertising", position: 5, enabled: true, title: "Publicidade Lateral", subtitle: "Bloco publicitário lateral configurável." },
  { id: "reference-06", sectionKey: "trending", type: "post_trending", position: 6, enabled: true, title: "Em Alta", subtitle: "Lista de assuntos e conteúdos em alta." },
  { id: "reference-07", sectionKey: "advertise", type: "cta", position: 7, enabled: true, title: "Anuncie Aqui", subtitle: "Chamada comercial para anunciantes." },
  { id: "reference-08", sectionKey: "releases", type: "release_feed", position: 8, enabled: true, title: "Lançamentos", subtitle: "Playlist Spotify sincronizada e apresentada na ordem configurada." },
  { id: "reference-09", sectionKey: "agenda", type: "events", position: 9, enabled: true, title: "Agenda", subtitle: "Agenda de eventos e destaques." },
  { id: "reference-10", sectionKey: "newsletter", type: "newsletter", position: 10, enabled: true, title: "Newsletter", subtitle: "Captação de leads e assinatura por e-mail." },
];

const referencePages: PageSummary[] = [
  { id: "50000000-0000-4000-8000-000000000001", key: "home", title: "Página inicial", configuredRoute: "/", publicRoute: "/", classification: "Estrutural", scope: "Especial", routeWarning: false, enabled: true, seoConfigured: true, sectionCount: 10, enabledSectionCount: 10, updatedAt: "", sections: referenceSections },
  { id: "50000000-0000-4000-8000-000000000004", key: "news", title: "Notícias", configuredRoute: "/noticias", publicRoute: "/noticias", classification: "Módulo de domínio", scope: "Editorial", routeWarning: false, enabled: true, seoConfigured: true, sectionCount: 3, enabledSectionCount: 3, updatedAt: "" },
  { id: "50000000-0000-4000-8000-000000000002", key: "about", title: "Sobre o Portal", configuredRoute: "/sobre-nos", publicRoute: "/sobre-nos", classification: "Institucional", scope: "Especial", routeWarning: false, enabled: true, seoConfigured: true, sectionCount: 6, enabledSectionCount: 6, updatedAt: "" },
  { id: "50000000-0000-4000-8000-000000000003", key: "artists", title: "Artistas", configuredRoute: "/artistas", publicRoute: "/artistas", classification: "Módulo de domínio", scope: "Especial", routeWarning: false, enabled: true, seoConfigured: true, sectionCount: 3, enabledSectionCount: 3, updatedAt: "" },
  { id: "50000000-0000-4000-8000-000000000005", key: "contact", title: "Contato", configuredRoute: "/contato", publicRoute: "/contato", classification: "Funcional", scope: "Especial", routeWarning: false, enabled: true, seoConfigured: true, sectionCount: 2, enabledSectionCount: 2, updatedAt: "" },
];

const fallbackDescriptions: Record<string, string> = {
  hero: "Seção principal da página.",
  intro: "Apresentação e conteúdo introdutório.",
  shortcuts: "Atalhos principais da página.",
  artists: "Conteúdo de artistas relacionado à página.",
  releases: "Conteúdo de lançamentos relacionado à página.",
  news: "Publicações e notícias relacionadas à página.",
  history: "Conteúdo institucional e histórico.",
  identity: "Identidade, missão, visão e valores.",
  pillars: "Pilares e frentes de atuação.",
  companies: "Empresas e frentes do ecossistema.",
  methodology: "Metodologia e processo de trabalho.",
  artist_filters: "Filtros disponíveis para o catálogo de artistas.",
  artist_list: "Lista de artistas exibida ao público.",
  news_categories: "Filtros editoriais e categorias de notícias.",
  news_list: "Lista de publicações exibida ao público.",
};

function displayTitle(page: PageSummary) {
  if (page.key === "home") return "Página inicial";
  if (page.key === "about") return "Sobre o Portal";
  if (page.key === "news") return "Notícias";
  return page.title;
}

function pageKind(page: PageSummary) {
  if (page.scope === "Editorial" || page.key === "news") return "Editorial";
  return "Especial";
}

function sectionTitle(section: PageSectionSummary) {
  if (section.title.trim()) return section.title;
  return section.sectionKey.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function sectionDescription(section: PageSectionSummary) {
  return section.subtitle.trim() || fallbackDescriptions[section.sectionKey] || `Seção ${section.type.replaceAll("_", " ")} configurada nesta página.`;
}

export default function PageManager({ canEdit = true, demoMode = false, pages, preview = false }: { canEdit?: boolean; demoMode?: boolean; pages: PageSummary[]; preview?: boolean }) {
  const effectivePages = useMemo(() => demoMode || preview ? referencePages : pages, [demoMode, pages, preview]);
  const defaultPage = effectivePages.find((page) => page.key === "home") || effectivePages[0];
  const [selectedId, setSelectedId] = useState(defaultPage?.id || "");
  const selected = effectivePages.find((page) => page.id === selectedId) || defaultPage;

  if (!selected) return <div className={styles.empty}>Nenhuma página administrável encontrada.</div>;

  const sections = [...(selected.sections || [])].sort((a, b) => a.position - b.position);
  const title = displayTitle(selected);
  const kind = pageKind(selected);
  const editHref = preview ? "/cms-preview/pages" : `/admin/pages/${selected.id}`;

  return <div className={styles.manager} data-testid="pages-manager">
    <section className={styles.selectionCard} aria-label="Página selecionada">
      <div className={styles.selectedSummary}>
        <span className={styles.eyebrow}>Página selecionada</span>
        <strong>{title}</strong>
        <small>{selected.enabled ? "Publicada" : "Não publicada"} · {kind}</small>
      </div>

      <label className={styles.pageSelector}>
        <span>Página</span>
        <select aria-label="Selecionar página" onChange={(event) => setSelectedId(event.target.value)} value={selected.id}>
          {effectivePages.map((page) => <option key={page.id} value={page.id}>{displayTitle(page)} · {pageKind(page)} · {page.enabled ? "publicada" : "não publicada"}</option>)}
        </select>
      </label>

      <div className={styles.pageActions}>
        {selected.publicRoute ? <Link className={styles.outlineButton} href={selected.publicRoute} rel="noopener noreferrer" target="_blank"><AdminIcon name="eye" size={18} /><span>Ver página pública</span></Link> : <button className={styles.outlineButton} disabled type="button"><AdminIcon name="eye" size={18} /><span>Ver página pública</span></button>}
        <Link className={styles.outlineButton} href={editHref}><AdminIcon name="edit" size={17} /><span>Editar</span></Link>
        {canEdit && !demoMode && !preview ? <form action={deletePageAction}><input name="id" type="hidden" value={selected.id} /><button className={`${styles.outlineButton} ${styles.dangerButton}`} type="submit"><AdminIcon name="trash" size={17} /><span>Excluir</span></button></form> : <button aria-disabled="true" className={`${styles.outlineButton} ${styles.dangerButton}`} type="button"><AdminIcon name="trash" size={17} /><span>Excluir</span></button>}
      </div>
    </section>

    <section className={styles.structureCard} aria-label="Estrutura da página">
      <div className={styles.structureHeading}>
        <div>
          <span className={styles.eyebrow}>Estrutura da página</span>
          <strong>{title}</strong>
          <small>{sections.length} {sections.length === 1 ? "seção" : "seções"} · {kind}</small>
        </div>
        <Link className={styles.primaryButton} href={editHref}><span aria-hidden="true">+</span> Criar seção</Link>
      </div>

      <div className={styles.table} role="table" aria-label={`Seções de ${title}`}>
        <div className={styles.tableHeader} role="row">
          <span role="columnheader">Seção</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Ações</span>
        </div>
        <div role="rowgroup">
          {sections.map((section, index) => <div className={styles.sectionRow} key={section.id} role="row">
            <div className={styles.sectionIdentity} role="cell">
              <span className={styles.position}>{String(index + 1).padStart(2, "0")}</span>
              <span><strong>{sectionTitle(section)}</strong><small>{sectionDescription(section)}</small></span>
            </div>
            <div role="cell"><span className={`${styles.statusBadge} ${section.enabled ? styles.active : styles.inactive}`}><i aria-hidden="true" />{section.enabled ? "Ativo" : "Inativo"}</span></div>
            <div className={styles.sectionActions} role="cell">
              <Link className={styles.configureButton} href={editHref}><AdminIcon name="sliders" size={17} /><span>Configurar</span></Link>
              <Link aria-label={`Mais ações para ${sectionTitle(section)}`} className={styles.moreButton} href={editHref}><AdminIcon name="more" size={18} /></Link>
            </div>
          </div>)}
          {!sections.length ? <div className={styles.noSections}>Nenhuma seção cadastrada nesta página.</div> : null}
        </div>
      </div>
    </section>
  </div>;
}
