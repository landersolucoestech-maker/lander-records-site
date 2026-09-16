"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { createPageAction, createPageSectionAction, deletePageAction } from "../../page-actions";
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
function sectionTitle(page: PageSummary, section: PageSectionSummary) { return siteSectionContract(page.key, section.sectionKey)?.label || section.title.trim() || section.sectionKey.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "); }
function sectionDescription(page: PageSummary, section: PageSectionSummary) { return siteSectionContract(page.key, section.sectionKey)?.description || fallbackDescriptions[section.sectionKey] || `Seção ${section.type.replaceAll("_", " ")} configurada nesta página.`; }
function previewContractSections(page: PageSummary): PageSectionSummary[] {
  const contract = sitePageContract(page.key);
  if (!contract) return [];
  return contract.sectionOrder.map((sectionKey, index) => ({ id: `contract-${page.key}-${sectionKey}`, sectionKey, type: sectionKey, position: index + 1, enabled: true, title: "", subtitle: "" }));
}
function pageSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function PageManager({ canEdit = true, demoMode = false, pages, preview = false }: { canEdit?: boolean; demoMode?: boolean; pages: PageSummary[]; preview?: boolean }) {
  const defaultPage = pages.find((page) => page.key === "home") || pages[0];
  const [selectedId, setSelectedId] = useState(defaultPage?.id || "");
  const [createOpen, setCreateOpen] = useState(false);
  const [createSectionOpen, setCreateSectionOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSlug, setDraftSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [sectionName, setSectionName] = useState("");
  const [sectionIdentifier, setSectionIdentifier] = useState("");
  const [sectionIdentifierEdited, setSectionIdentifierEdited] = useState(false);
  const selected = pages.find((page) => page.id === selectedId) || defaultPage;

  const openCreate = useCallback(() => {
    setDraftTitle("");
    setDraftSlug("");
    setSlugEdited(false);
    setCreateOpen(true);
  }, []);
  const closeCreate = useCallback(() => setCreateOpen(false), []);
  const openCreateSection = useCallback(() => {
    setSectionName("");
    setSectionIdentifier("");
    setSectionIdentifierEdited(false);
    setCreateSectionOpen(true);
  }, []);
  const closeCreateSection = useCallback(() => setCreateSectionOpen(false), []);

  if (!selected) return <div className={styles.empty}>Nenhuma página administrável encontrada.</div>;

  const contract = sitePageContract(selected.key);
  const storedSections = selected.sections || [];
  const sections = [...(storedSections.length ? storedSections : preview ? previewContractSections(selected) : [])].sort((a, b) => (siteSectionOrder(selected.key, a.sectionKey) ?? a.position) - (siteSectionOrder(selected.key, b.sectionKey) ?? b.position));
  const title = displayTitle(selected);
  const kind = pageKind(selected);
  const editHref = preview ? "/cms-preview/pages" : `/admin/pages/${selected.id}`;
  const canonicalPage = Boolean(contract);
  const allowCreate = canEdit && !demoMode && !preview;
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
        <select aria-label="Selecionar página" onChange={(event) => { setSelectedId(event.target.value); setCreateSectionOpen(false); setDeleteOpen(false); }} value={selected.id}>
          {pages.map((page) => <option key={page.id} value={page.id}>{displayTitle(page)} · {pageKind(page)} · {page.enabled ? "publicada" : "não publicada"}</option>)}
        </select>
      </label>
      <div className={styles.pageActions}>
        <button className={styles.primaryButton} onClick={openCreate} type="button"><span aria-hidden="true">+</span><span>Criar página</span></button>
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
        <button className={styles.primaryButton} onClick={openCreateSection} type="button"><span aria-hidden="true">+</span><span>Criar seção</span></button>
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

    {createOpen ? <AdminDialog
      className={styles.createPageDialog}
      description="Novas páginas são criadas como rascunho no CMS da Lander Records e podem ser configuradas antes da publicação."
      footer={<>
        <button className={styles.modalButton} onClick={closeCreate} type="button">Cancelar</button>
        <button className={styles.modalPrimary} disabled={!allowCreate || !draftTitle.trim() || !draftSlug.trim()} form="create-page-form" title={!allowCreate ? "Criação indisponível neste modo de visualização" : undefined} type="submit"><span aria-hidden="true" className={styles.modalPlus}>+</span>Criar rascunho</button>
      </>}
      onClose={closeCreate}
      title="Criar página de conteúdo"
    >
      <form action={createPageAction} className={styles.createPageForm} id="create-page-form">
        <label className={styles.createPageField}>
          <span>Nome da página</span>
          <input autoComplete="off" maxLength={180} name="title" onChange={(event) => { const nextTitle = event.target.value; setDraftTitle(nextTitle); if (!slugEdited) setDraftSlug(pageSlug(nextTitle)); }} placeholder="Ex.: Música" required type="text" value={draftTitle} />
        </label>
        <label className={styles.createPageField}>
          <span>Slug</span>
          <input autoComplete="off" name="slug" onChange={(event) => { setSlugEdited(true); setDraftSlug(pageSlug(event.target.value)); }} placeholder="musica" required type="text" value={draftSlug} />
        </label>
        <label className={styles.createPageField}>
          <span>Modelo</span>
          <input aria-readonly="true" readOnly type="text" value="Editorial · estrutura CMS da Lander Records" />
        </label>
      </form>
    </AdminDialog> : null}

    {createSectionOpen ? <AdminDialog
      className={styles.createPageDialog}
      description="A seção pertence à página selecionada e será composta sobre a arquitetura global, sem criar um novo shell."
      footer={<>
        <button className={styles.modalButton} onClick={closeCreateSection} type="button">Cancelar</button>
        <button className={styles.modalPrimary} disabled={!allowCreate || !sectionName.trim() || !sectionIdentifier.trim()} form="create-section-form" title={!allowCreate ? "Criação indisponível neste modo de visualização" : undefined} type="submit"><AdminIcon name="edit" size={14} /><span>Salvar seção</span></button>
      </>}
      onClose={closeCreateSection}
      title="Criar seção"
    >
      <form action={createPageSectionAction} className={styles.createPageForm} id="create-section-form">
        <input name="pageId" type="hidden" value={selected.id} />
        <label className={styles.createPageField}>
          <span>Nome da seção</span>
          <input autoComplete="off" maxLength={180} name="name" onChange={(event) => { const nextName = event.target.value; setSectionName(nextName); if (!sectionIdentifierEdited) setSectionIdentifier(pageSlug(nextName)); }} placeholder="Ex.: Conteúdo principal" required type="text" value={sectionName} />
        </label>
        <label className={styles.createPageField}>
          <span>Identificador</span>
          <input autoComplete="off" maxLength={120} name="identifier" onChange={(event) => { setSectionIdentifierEdited(true); setSectionIdentifier(pageSlug(event.target.value)); }} placeholder="conteudo-principal" required type="text" value={sectionIdentifier} />
        </label>
      </form>
    </AdminDialog> : null}

    {deleteOpen ? <AdminDialog description="Esta ação usa o fluxo de exclusão já existente e não pode ser desfeita." footer={<><button className="adminButton" onClick={() => setDeleteOpen(false)} type="button">Cancelar</button><form action={deletePageAction}><input name="id" type="hidden" value={selected.id} /><button className="adminButton danger" type="submit">Excluir página</button></form></>} onClose={() => setDeleteOpen(false)} title={`Excluir ${title}?`}><p>Confirme a exclusão somente se esta página não for mais necessária. Rotas, seções e consumidores continuam sujeitos às regras atuais do projeto.</p></AdminDialog> : null}
  </div>;
}
