"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { updatePageSection, updatePageSectionItem } from "../../../actions";
import { AdminIcon } from "../../../components/AdminIcon";
import styles from "./PageContentWorkbench.module.css";

export type PageEditorSection = {
  id: string;
  sectionKey: string;
  type: string;
  position: number;
  enabled: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  body: string;
};

export type PageEditorItem = {
  id: string;
  sectionId: string;
  itemKey: string;
  position: number;
  enabled: boolean;
  mediaId: string | null;
  title: string;
  subtitle: string;
  body: string;
  label: string;
  url: string;
};

type SectionField = "eyebrow" | "title" | "subtitle" | "body";
type ItemField = "title" | "subtitle" | "body" | "label" | "url";
type Viewport = "desktop" | "tablet" | "mobile";
type Tab = "content" | "appearance" | "behavior";

type Props = {
  page: { id: string; key: string; title: string };
  publicRoute: string | null;
  sections: PageEditorSection[];
  items: PageEditorItem[];
  initialSectionId?: string;
};

const sectionNames: Record<string, string> = {
  hero: "Hero Section",
  featured: "Em Destaque",
  most_read: "Mais Lidas",
  latest_news: "Últimas Notícias",
  side_ad: "Publicidade Lateral",
  trending: "Em Alta",
  advertise: "Anuncie Aqui",
  releases: "Lançamentos",
  agenda: "Agenda",
  newsletter: "Newsletter",
  intro: "Apresentação",
  shortcuts: "Atalhos",
  artists: "Artistas em destaque",
  news: "Últimas notícias",
  history: "História",
  identity: "Identidade",
  companies: "Empresas do grupo",
  methodology: "Metodologia",
  artist_filters: "Filtros de artistas",
  artist_list: "Lista de artistas",
  news_categories: "Categorias de notícias",
  news_list: "Lista de notícias",
};

const sectionFields: Record<string, SectionField[]> = {
  hero: ["eyebrow", "title", "subtitle"],
  intro: ["eyebrow", "title", "body"],
  artists: ["title", "subtitle"],
  releases: ["title"],
  news: ["eyebrow", "title"],
  history: ["eyebrow", "title", "subtitle", "body"],
  identity: ["eyebrow", "title"],
  companies: ["eyebrow", "title", "subtitle"],
  methodology: ["eyebrow", "title", "subtitle"],
};

const itemFields: Record<string, ItemField[]> = {
  hero: ["title", "label", "url"],
  intro: ["title", "label", "url"],
  shortcuts: ["title", "label", "url"],
  releases: ["label", "url"],
  identity: ["title", "body"],
  methodology: ["title", "body"],
  companies: ["title", "subtitle", "body", "label"],
};

const fieldLabels: Record<SectionField | ItemField, string> = {
  eyebrow: "Chamada / kicker",
  title: "Título",
  subtitle: "Descrição / subtítulo",
  body: "Texto",
  label: "Texto do botão / link",
  url: "Destino",
};

function sectionLabel(section: PageEditorSection) {
  return sectionNames[section.sectionKey] || section.title || section.sectionKey.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function viewportLabel(viewport: Viewport) {
  return viewport === "desktop" ? "Desktop" : viewport === "tablet" ? "Tablet" : "Mobile";
}

function hiddenSectionFields(section: PageEditorSection, visible: SectionField[]) {
  return (["eyebrow", "title", "subtitle", "body"] as SectionField[]).filter((field) => !visible.includes(field)).map((field) => <input key={field} name={field} type="hidden" value={section[field]} />);
}

function hiddenItemFields(item: PageEditorItem, visible: ItemField[]) {
  return (["title", "subtitle", "body", "label", "url"] as ItemField[]).filter((field) => !visible.includes(field)).map((field) => <input key={field} name={field} type="hidden" value={item[field]} />);
}

export default function PageContentWorkbench({ page, publicRoute, sections, items, initialSectionId }: Props) {
  const ordered = useMemo(() => [...sections].sort((a, b) => a.position - b.position), [sections]);
  const firstId = ordered[0]?.id || "";
  const [selectedId, setSelectedId] = useState(initialSectionId && ordered.some((section) => section.id === initialSectionId) ? initialSectionId : firstId);
  const [tab, setTab] = useState<Tab>("content");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [sectionDrafts, setSectionDrafts] = useState<Record<string, PageEditorSection>>(() => Object.fromEntries(ordered.map((section) => [section.id, { ...section }])));
  const [itemDrafts, setItemDrafts] = useState<Record<string, PageEditorItem>>(() => Object.fromEntries(items.map((item) => [item.id, { ...item }])));
  const [selectedItemId, setSelectedItemId] = useState("");

  const selected = sectionDrafts[selectedId] || ordered[0];
  const selectedItems = useMemo(() => {
    if (!selected) return [];
    return items
      .filter((item) => item.sectionId === selected.id)
      .map((item) => itemDrafts[item.id] || item)
      .sort((a, b) => a.position - b.position);
  }, [itemDrafts, items, selected]);
  const selectedTitle = selected ? sectionLabel(selected) : "";

  useEffect(() => {
    if (!selectedItems.length) {
      setSelectedItemId("");
      return;
    }
    if (!selectedItems.some((item) => item.id === selectedItemId)) setSelectedItemId(selectedItems[0].id);
  }, [selectedId, selectedItemId, selectedItems]);

  useEffect(() => {
    if (!selectedTitle) return;
    const detail = {
      title: `Configurar seção: ${selectedTitle}`,
      description: `Configure ${selectedTitle} no painel rolável à esquerda e acompanhe a página completa no preview fixo à direita.`,
      back: { label: "Páginas", href: "/admin/pages" },
    };
    window.dispatchEvent(new CustomEvent("admin:context-header", { detail }));
    return () => {
      window.dispatchEvent(new CustomEvent("admin:context-header", { detail: null }));
    };
  }, [selectedTitle]);

  if (!selected) return <div className={styles.empty}>Nenhuma seção registrada para esta página.</div>;

  const visibleSectionFields = sectionFields[selected.sectionKey] || [];
  const visibleItemFields = itemFields[selected.sectionKey] || [];
  const selectedItem = selectedItems.find((item) => item.id === selectedItemId) || selectedItems[0];
  const title = selectedTitle;
  const hasLinkedMedia = selectedItems.some((item) => Boolean(item.mediaId));

  const patchSection = (field: SectionField, value: string) => setSectionDrafts((current) => ({ ...current, [selected.id]: { ...current[selected.id], [field]: value } }));
  const patchItem = (id: string, field: ItemField, value: string) => setItemDrafts((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));

  const chooseSection = (id: string) => {
    setSelectedId(id);
    setTab("content");
    setSelectedItemId("");
  };

  return <div className={styles.workbench} data-testid="page-section-workbench">
    <aside className={styles.editorRail} aria-label="Configuração da seção">
      <section className={styles.mediaCard}>
        <div className={styles.mediaHeading}>
          <div><span>{title.toUpperCase()}</span><h2>Imagem de Fundo</h2></div>
          <span className={styles.mediaState}>{hasLinkedMedia ? "Mídia vinculada" : "Sem imagem"}</span>
        </div>
        <p>A miniatura identifica apenas o asset. O resultado final é mostrado exclusivamente no preview oficial da página.</p>
        <div className={styles.mediaPreview}>{hasLinkedMedia ? <><AdminIcon name="image" size={30}/><strong>Mídia vinculada à seção</strong><small>O componente público decide como este asset é apresentado.</small></> : <><AdminIcon name="image" size={30}/><strong>Nenhuma imagem configurada</strong><small>A seção continuará funcionando com o fundo visual padrão.</small></>}</div>
        <Link className={styles.uploadButton} href="/admin/media"><AdminIcon name="upload" size={14}/><span>{hasLinkedMedia ? "Gerenciar imagem" : "Adicionar imagem"}</span></Link>
        <div className={styles.mediaFooter}><span>Imagem sincronizada</span><div><button disabled type="button">Descartar</button><Link href="/admin/media"><AdminIcon name="document" size={13}/>Salvar imagem</Link></div></div>
      </section>

      <div className={styles.tabs} role="tablist" aria-label="Configuração da seção">
        <button aria-selected={tab === "content"} className={tab === "content" ? styles.currentTab : ""} onClick={() => setTab("content")} role="tab" type="button">Conteúdo</button>
        <button aria-selected={tab === "appearance"} className={tab === "appearance" ? styles.currentTab : ""} onClick={() => setTab("appearance")} role="tab" type="button">Aparência</button>
        <button aria-selected={tab === "behavior"} className={tab === "behavior" ? styles.currentTab : ""} onClick={() => setTab("behavior")} role="tab" type="button">Comportamento</button>
      </div>

      {tab === "content" ? <>
        <section className={styles.sectionSelector}>
          <label><span>Seção</span><select value={selected.id} onChange={(event) => chooseSection(event.target.value)}>{ordered.map((section, index) => <option key={section.id} value={section.id}>{String(index + 1).padStart(2, "0")} · {sectionLabel(section)}</option>)}</select></label>
        </section>

        {selectedItems.length && visibleItemFields.length ? <section className={styles.highlightsCard}>
          <header><div><h3>{selected.sectionKey === "hero" ? "Destaques do Hero" : "Itens da seção"}</h3><p>Conteúdo editorial já persistido no projeto. Selecione um item para editar.</p></div></header>
          <div className={styles.highlightList}>{selectedItems.map((item, index) => <button className={item.id === selectedItem?.id ? styles.selectedHighlight : ""} key={item.id} onClick={() => setSelectedItemId(item.id)} type="button"><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.title || item.label || `Item ${index + 1}`}</strong><small>Ordem {item.position} · {item.enabled ? "Ativo" : "Inativo"}</small></div><span className={styles.dragMark}>⋮⋮</span></button>)}</div>
        </section> : null}

        {selectedItem && visibleItemFields.length ? <section className={styles.detailCard}>
          <header className={styles.editingHeader}><span>Editando destaque {String(selectedItems.findIndex((item) => item.id === selectedItem.id) + 1).padStart(2, "0")} — {selectedItem.title || selectedItem.label || "Item"}</span></header>
          <form action={updatePageSectionItem} className={styles.form}>
            <input type="hidden" name="id" value={selectedItem.id}/><input type="hidden" name="pageId" value={page.id}/><input type="hidden" name="itemKey" value={selectedItem.itemKey}/><input type="hidden" name="position" value={selectedItem.position}/><input type="hidden" name="enabled" value={selectedItem.enabled ? "true" : ""}/><input type="hidden" name="mediaId" value={selectedItem.mediaId || ""}/>{hiddenItemFields(selectedItem, visibleItemFields)}
            <div className={styles.innerSectionTitle}><strong>Conteúdo</strong><small>Conteúdo único + tipografia responsiva da headline</small></div>
            <div className={styles.fields}>{visibleItemFields.map((field) => <label key={field}><span>{fieldLabels[field]}</span>{field === "body" ? <textarea name={field} rows={5} value={selectedItem[field]} onChange={(event) => patchItem(selectedItem.id, field, event.target.value)}/> : <input name={field} value={selectedItem[field]} onChange={(event) => patchItem(selectedItem.id, field, event.target.value)}/>}</label>)}</div>
            <div className={styles.formActions}><button className={styles.primaryButton} type="submit"><AdminIcon name="document" size={14}/>Salvar item</button></div>
          </form>
        </section> : null}

        <section className={styles.detailCard}>
          <header><h3>Conteúdo da seção</h3><p>Campos funcionais ligados diretamente ao contrato atual desta seção.</p></header>
          {visibleSectionFields.length ? <form action={updatePageSection} className={styles.form}>
            <input type="hidden" name="id" value={selected.id}/><input type="hidden" name="pageId" value={page.id}/><input type="hidden" name="position" value={selected.position}/><input type="hidden" name="enabled" value={selected.enabled ? "true" : ""}/>{hiddenSectionFields(selected, visibleSectionFields)}
            <div className={styles.fields}>{visibleSectionFields.map((field) => <label key={field}><span>{fieldLabels[field]}</span>{field === "body" || field === "subtitle" ? <textarea name={field} rows={field === "body" ? 7 : 4} value={selected[field]} onChange={(event) => patchSection(field, event.target.value)}/> : <input name={field} value={selected[field]} onChange={(event) => patchSection(field, event.target.value)}/>}</label>)}</div>
            <div className={styles.formActions}><button className={styles.primaryButton} type="submit"><AdminIcon name="document" size={14}/>Salvar alterações</button></div>
          </form> : <div className={styles.emptyInline}>Esta seção não possui campos editoriais diretos neste contrato.</div>}
        </section>
      </> : null}

      {tab === "appearance" ? <section className={styles.detailCard}><header><h3>Aparência</h3><p>A renderização pública real é a fonte de verdade visual.</p></header><div className={styles.readonlyGrid}><div><span>Layout</span><strong>Componente público do projeto</strong></div><div><span>Preview</span><strong>{viewportLabel(viewport)}</strong></div><div><span>Tipo</span><strong>{selected.type.replaceAll("_", " ")}</strong></div></div></section> : null}

      {tab === "behavior" ? <section className={styles.detailCard}><header><h3>Comportamento</h3><p>Estado e ordem usam os mesmos campos persistidos atualmente.</p></header><form action={updatePageSection} className={styles.form}>
        <input type="hidden" name="id" value={selected.id}/><input type="hidden" name="pageId" value={page.id}/><input type="hidden" name="position" value={selected.position}/>{(["eyebrow", "title", "subtitle", "body"] as SectionField[]).map((field) => <input key={field} name={field} type="hidden" value={selected[field]}/>)}
        <label className={styles.toggle}><input checked={selected.enabled} name="enabled" type="checkbox" onChange={(event) => setSectionDrafts((current) => ({ ...current, [selected.id]: { ...current[selected.id], enabled: event.target.checked } }))}/><span><strong>Seção ativa</strong><small>Controla a disponibilidade desta seção no conteúdo CMS.</small></span></label>
        <div className={styles.rule}><span>Ordem</span><strong>{String(selected.position).padStart(2, "0")}</strong><small>A ordem continua sendo a registrada no banco.</small></div>
        <div className={styles.formActions}><button className={styles.primaryButton} type="submit">Salvar comportamento</button></div>
      </form></section> : null}
    </aside>

    <section className={styles.previewPanel} aria-label="Preview da página inteira">
      <header><div><h2>Preview da página inteira</h2><p>{viewportLabel(viewport)} · página pública real · o conteúdo salvo é carregado no mesmo destino do site.</p></div><div className={styles.devices}>
        <button aria-label="Desktop" aria-pressed={viewport === "desktop"} className={viewport === "desktop" ? styles.deviceActive : ""} onClick={() => setViewport("desktop")} type="button"><AdminIcon name="monitor" size={17}/></button>
        <button aria-label="Tablet" aria-pressed={viewport === "tablet"} className={viewport === "tablet" ? styles.deviceActive : ""} onClick={() => setViewport("tablet")} type="button"><AdminIcon name="tablet" size={17}/></button>
        <button aria-label="Mobile" aria-pressed={viewport === "mobile"} className={viewport === "mobile" ? styles.deviceActive : ""} onClick={() => setViewport("mobile")} type="button"><AdminIcon name="smartphone" size={17}/></button>
      </div></header>
      <div className={styles.previewStage}>
        <div className={`${styles.frameViewport} ${styles[viewport]}`}>
          {publicRoute ? <iframe className={styles.previewFrame} src={publicRoute} title={`Preview de ${page.title}`} /> : <div className={styles.noPreview}><AdminIcon name="eye" size={26}/><strong>Preview público indisponível</strong><p>Esta página não possui rota pública registrada.</p></div>}
        </div>
      </div>
    </section>
  </div>;
}
