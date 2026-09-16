"use client";

import Link from "next/link";
import { useState } from "react";
import { deletePageAction } from "../../page-actions";
import { AdminDialog } from "../../components/AdminDialog";
import { AdminIcon } from "../../components/AdminIcon";
import styles from "./PagesManager.module.css";
import type { PageClassification } from "./page-contract";
import { sitePageContract, siteSectionContract, siteSectionOrder } from "./site-page-contract";

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

const fallbackDescriptions: Record<string, string> = {
  hero: "Seção principal da página.", intro: "Apresentação e conteúdo introdutório.", shortcuts: "Atalhos principais da página.", artists: "Vitrine de artistas destacados na Home.", releases: "Lançamentos sincronizados e apresentados na Home.", advertise_banner: "Banner comercial da Lander Records.", news: "Publicações destacadas na Home.", history: "Conteúdo institucional e histórico.", identity: "Identidade, missão, visão e valores.", companies: "Empresas e frentes do ecossistema Lander.", methodology: "Metodologia de Gestão Artística 360°.", artist_filters: "Filtros disponíveis para o catálogo de artistas.", artist_list: "Lista de artistas exibida ao público.", news_categories: "Filtros editoriais e categorias de notícias.", news_list: "Lista de publicações exibida ao público.", legal_body: "Conteúdo legal exibido nesta página.",
};

function displayTitle(page: PageSummary) { return sitePageContract(page.key)?.label || page.title; }
function pageKind(page: PageSummary) { return sitePageContract(page.key)?.classification || page.classification; }
function sectionTitle(page: PageSummary, section: PageSectionSummary) { return siteSectionContract(page.key, section.sectionKey)?.label || section.sectionKey.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "); }
function sectionDescription(page: PageSummary, section: PageSectionSummary) { return siteSectionContract(page.key, section.sectionKey)?.description || fallbackDescriptions[section.sectionKey] || `Seção ${section.type.replaceAll("_", " ")} configurada nesta página.`; }
function previewContractSections(page: PageSummary): PageSectionSummary[] {
  const contract = sitePageContract(page.key);
  if (!contract) return [];
  return contract.sectionOrder.map((sectionKey, index) => ({ id: `contract-${page.key}-${sectionKey}`, sectionKey, type: sectionKey, position: index + 1, enabled: true, title: "", subtitle: "" }));
}

export default function PageManager({ canEdit = true, demoMode = false, pages, preview = false }: { canEdit?: boolean; demoMode?: boolean; pages: PageSummary[]; preview?: boolean }) {
  const defaultPage = pages.find((page) => page.key === "home") || pages[0];
  const [selectedId, setSelectedId] = useState(defaultPage?.id || "");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const selected = pages.find((page) => page.id === selectedId) || defaultPage;
  if (!selected) return <div className={styles.empty}>Nenhuma página administrável encontrada.</div>;

  const contract = sitePageContract(selected.key);
  const storedSections = selected.sections || [];
  const sections = [...(storedSections.length ? storedSections : preview ? previewContractSections(selected) : [])].sort((a, b) => (siteSectionOrder(selected.key, a.sectionKey) ?? a.position) - (siteSectionOrder(selected.key, b.sectionKey) ?? b.position));
  const title = displayTitle(selected);
  const kind = pageKind(selected);
  const editHref = preview ? "/cms-preview/pages" : `/admin/pages/${selected.id}`;
  const createPageHref = preview ? "/cms-preview/pages" : "/admin/pages/new";
  const canonicalPage = Boolean(contract);
  const allowDelete = canEdit && !demoMode && !preview && !canonicalPage;

  return <div className={styles.manager} data-testid="pages-manager">
    <section className={styles.selectionCard} aria-label="Página selecionada">
      <div className={styles.selectedSummary}>
        <span className={styles.eyebrow}>Página selecionada</span>
        <strong>{title}</strong>
        <small>{selected.enabled ? "Publicada" : "Não publicada"} · {kind}</small>
      </div>
      <label className={styles.pageSelector}>
        <span>Página</span>
        <select aria-label="Selecionar página" onChange={(event) => { setSelectedId(event.target.value); setDeleteOpen(false); }} value={selected.id}>
          {pages.map((page) => <option key={page.id} value={page.id}>{displayTitle(page)} · {pageKind(page)} · {page.enabled ? "publicada" : "não publicada"}</option>)}
        </select>
      </label>
      <div className={styles.pageActions}>
        <Link className={styles.primaryButton} href={createPageHref}><span aria-hidden="true">+</span><span>Criar página</span></Link>
        {selected.publicRoute ? <Link className={styles.outlineButton} href={selected.publicRoute} rel="noopener noreferrer" target="_blank"><AdminIcon name="eye" size={17} /><span>Ver página pública</span></Link> : <button className={styles.outlineButton} disabled type="button"><AdminIcon name="eye" size={17} /><span>Ver página pública</span></button>}
        <Link className={styles.outlineButton} href={editHref}><AdminIcon name="edit" size={16} /><span>Editar</span></Link>
        {allowDelete ? <button className={`${styles.outlineButton} ${styles.dangerButton}`} onClick={() => setDeleteOpen(true)} type="button"><AdminIcon name="trash" size={16} /><span>Excluir</span></button> : <button aria-disabled="true" className={`${styles.outlineButton} ${styles.dangerButton}`} title={canonicalPage ? "Página estrutural do site público" : "Ação indisponível neste acesso"} type="button"><AdminIcon name="trash" size={16} /><span>Excluir</span></button>}
      </div>
    </section>

    <section className={`tableview-surface ${styles.structureCard}`} aria-label="Estrutura da página">
      <div className={styles.structureHeading}>
        <div>
          <span className={styles.eyebrow}>Estrutura da página</span>
          <strong>{title}</strong>
          <small>{sections.length} {sections.length === 1 ? "seção" : "seções"} · {kind}</small>
        </div>
        <Link className={styles.primaryButton} href={editHref}><span aria-hidden="true">+</span><span>Criar seção</span></Link>
      </div>
      {sections.length ? <div className={styles.tableWrap}><table>
        <thead><tr><th>Seção</th><th>Status</th><th className={styles.actionsColumn}>Ações</th></tr></thead>
        <tbody>{sections.map((section, index) => {
          const configureHref = preview ? editHref : `${editHref}?section=${encodeURIComponent(section.id)}`;
          return <tr key={section.id}>
            <td><div className={`table-primary ${styles.sectionIdentity}`}><span className={styles.position}>{String(index + 1).padStart(2, "0")}</span><span><strong>{sectionTitle(selected, section)}</strong><small>{sectionDescription(selected, section)}</small></span></div></td>
            <td><span className={`${styles.statusBadge} ${section.enabled ? styles.active : styles.inactive}`}><i aria-hidden="true" />{section.enabled ? "Ativo" : "Inativo"}</span></td>
            <td className={styles.actionsColumn}><div className={styles.sectionActions}><Link className={styles.configureButton} href={configureHref}><AdminIcon name="sliders" size={16} /><span>Configurar</span></Link></div></td>
          </tr>;
        })}</tbody>
      </table></div> : <div className={styles.noSections}>Nenhuma seção cadastrada nesta página.</div>}
    </section>

    {deleteOpen ? <AdminDialog description="Esta ação usa o fluxo de exclusão já existente e não pode ser desfeita." footer={<><button className="adminButton" onClick={() => setDeleteOpen(false)} type="button">Cancelar</button><form action={deletePageAction}><input name="id" type="hidden" value={selected.id} /><button className="adminButton danger" type="submit">Excluir página</button></form></>} onClose={() => setDeleteOpen(false)} title={`Excluir ${title}?`}><p>Confirme a exclusão somente se esta página não for mais necessária. Rotas, seções e consumidores continuam sujeitos às regras atuais do projeto.</p></AdminDialog> : null}
  </div>;
}
