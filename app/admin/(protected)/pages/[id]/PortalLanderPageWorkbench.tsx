"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { updatePageSection, updatePageSectionItem } from "../../../actions";
import { AdminIcon } from "../../../components/AdminIcon";
import type { PageEditorItem, PageEditorSection } from "./PageContentWorkbench";
import styles from "./PortalLanderPageWorkbench.module.css";

type Props = {
  page: { id: string; key: string; title: string };
  publicRoute: string | null;
  sections: PageEditorSection[];
  items: PageEditorItem[];
  initialSectionId?: string;
};

type Tab = "content" | "appearance" | "behavior";
type Viewport = "desktop" | "tablet" | "mobile";
type SectionField = "eyebrow" | "title" | "subtitle" | "body";
type ItemField = "title" | "subtitle" | "body" | "label" | "url";

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

function hiddenSectionFields(section: PageEditorSection, visible: SectionField[]) {
  return (["eyebrow", "title", "subtitle", "body"] as SectionField[])
    .filter((field) => !visible.includes(field))
    .map((field) => <input key={field} name={field} type="hidden" value={section[field]} />);
}

function hiddenItemFields(item: PageEditorItem, visible: ItemField[]) {
  return (["title", "subtitle", "body", "label", "url"] as ItemField[])
    .filter((field) => !visible.includes(field))
    .map((field) => <input key={field} name={field} type="hidden" value={item[field]} />);
}

function PortalPagePreview({ section, item, viewport }: { section: PageEditorSection; item?: PageEditorItem; viewport: Viewport }) {
  const headline = section.title || item?.title || "LANDER RECORDS";
  const description = section.subtitle || section.body || "Gravadora, produtora musical e portal de cultura.";
  const kicker = section.eyebrow || "LANDER RECORDS · EM DESTAQUE";
  const cta = item?.label || "VER AGORA";
  const secondCta = item?.title && item.title !== headline ? item.title : "EXPLORAR DESTAQUES";

  return <div className={`${styles.publicViewport} ${styles[viewport]}`}>
    <div className={styles.publicPage}>
      <header className={styles.publicHeader}>
        <strong>LANDER RECORDS</strong>
        <nav><span>NOTÍCIAS</span><span>ARTISTAS</span><span>LANÇAMENTOS</span><span>BASTIDORES</span><span>CONTATO</span></nav>
        <span className={styles.publicSearch}>⌕</span>
      </header>
      <section className={styles.publicHero}>
        <div className={styles.publicHeroGrid}>
          <div className={styles.publicHeroCopy}>
            <span className={styles.kicker}>{kicker}</span>
            <h1>{headline}</h1>
            <p>{description}</p>
            <div className={styles.heroButtons}><span>{cta} <b>→</b></span><span>{secondCta}</span></div>
          </div>
          <div className={styles.heroVisual} aria-hidden="true"><span>LANDER</span></div>
        </div>
      </section>
      <div className={styles.ticker}><strong>AGORA</strong><i/><span>Notícias, lançamentos, bastidores e assuntos que estão dominando a conversa.</span><b>•</b><span>Novos conteúdos da Lander Records em destaque.</span></div>
    </div>
  </div>;
}

export default function PortalLanderPageWorkbench({ page, publicRoute, sections, items, initialSectionId }: Props) {
  const ordered = useMemo(() => [...sections].sort((a, b) => a.position - b.position), [sections]);
  const [selectedId, setSelectedId] = useState(() => initialSectionId && ordered.some((section) => section.id === initialSectionId) ? initialSectionId : ordered[0]?.id || "");
  const [tab, setTab] = useState<Tab>("content");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [sectionDrafts, setSectionDrafts] = useState<Record<string, PageEditorSection>>(() => Object.fromEntries(ordered.map((section) => [section.id, { ...section }])));
  const [itemDrafts, setItemDrafts] = useState<Record<string, PageEditorItem>>(() => Object.fromEntries(items.map((item) => [item.id, { ...item }])));
  const [selectedItemId, setSelectedItemId] = useState("");

  const selected = sectionDrafts[selectedId] || ordered[0];
  const selectedItems = useMemo(() => selected ? items.filter((item) => item.sectionId === selected.id).map((item) => itemDrafts[item.id] || item).sort((a, b) => a.position - b.position) : [], [itemDrafts, items, selected]);
  const selectedItem = selectedItems.find((item) => item.id === selectedItemId) || selectedItems[0];
  const title = selected ? sectionLabel(selected) : "Página";

  useEffect(() => {
    if (!selectedItems.length) { setSelectedItemId(""); return; }
    if (!selectedItems.some((item) => item.id === selectedItemId)) setSelectedItemId(selectedItems[0].id);
  }, [selectedId, selectedItemId, selectedItems]);

  useEffect(() => {
    if (!selected) return;
    window.dispatchEvent(new CustomEvent("admin:context-header", { detail: { title: `Configurar seção: ${title}`, description: `Configure ${title} no painel rolável à esquerda e acompanhe a página completa no preview fixo à direita.` } }));
  }, [selected, title]);

  if (!selected) return <div className={styles.empty}>Nenhuma seção registrada para esta página.</div>;

  const visibleSectionFields = sectionFields[selected.sectionKey] || [];
  const visibleItemFields = itemFields[selected.sectionKey] || [];
  const hasLinkedMedia = selectedItems.some((item) => Boolean(item.mediaId));
  const patchSection = (field: SectionField, value: string) => setSectionDrafts((current) => ({ ...current, [selected.id]: { ...current[selected.id], [field]: value } }));
  const patchItem = (id: string, field: ItemField, value: string) => setItemDrafts((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));

  return <div className={styles.workbench} data-testid="page-section-workbench">
    <aside className={styles.rail} aria-label="Editor da seção">
      <section className={styles.backgroundCard}>
        <div className={styles.cardTop}><div><span>{title.toUpperCase()}</span><h2>Imagem de Fundo</h2></div><small>{hasLinkedMedia ? "Com imagem" : "Sem imagem"}</small></div>
        <p>A miniatura identifica apenas o asset. O resultado aplicado à seção é mostrado exclusivamente no preview oficial da página.</p>
        <div className={styles.imageState}><AdminIcon name="image" size={27}/><strong>{hasLinkedMedia ? "Mídia vinculada à seção" : "Nenhuma imagem configurada"}</strong><small>{hasLinkedMedia ? "Use a Biblioteca de Mídias para trocar o asset atual." : "A seção continuará funcionando com o fundo visual padrão."}</small></div>
        <Link className={styles.mediaButton} href="/admin/media"><AdminIcon name="upload" size={14}/>{hasLinkedMedia ? "Gerenciar imagem" : "Adicionar imagem"}</Link>
        <div className={styles.imageFooter}><span>Imagem sincronizada</span><div><button disabled type="button">Descartar</button><Link href="/admin/media"><AdminIcon name="document" size={13}/>Salvar imagem</Link></div></div>
      </section>

      <div className={styles.tabs} role="tablist" aria-label="Configuração da seção">
        <button aria-selected={tab === "content"} className={tab === "content" ? styles.activeTab : ""} onClick={() => setTab("content")} role="tab" type="button">Conteúdo</button>
        <button aria-selected={tab === "appearance"} className={tab === "appearance" ? styles.activeTab : ""} onClick={() => setTab("appearance")} role="tab" type="button">Aparência</button>
        <button aria-selected={tab === "behavior"} className={tab === "behavior" ? styles.activeTab : ""} onClick={() => setTab("behavior")} role="tab" type="button">Comportamento</button>
      </div>

      {tab === "content" ? <>
        <section className={styles.selectorCard}><label><span>Seção</span><select value={selected.id} onChange={(event) => { setSelectedId(event.target.value); setSelectedItemId(""); }}>{ordered.map((section, index) => <option key={section.id} value={section.id}>{String(index + 1).padStart(2, "0")} · {sectionLabel(section)}</option>)}</select></label></section>

        {selectedItems.length ? <section className={styles.highlightsCard}>
          <header><div><h3>{selected.sectionKey === "hero" ? "Destaques do Hero" : "Itens da seção"}</h3><p>Conteúdo editorial já persistido no projeto.</p></div><button disabled type="button"><span>+</span>Novo</button></header>
          <div className={styles.highlightList}>{selectedItems.map((item, index) => <button className={item.id === selectedItem?.id ? styles.selectedHighlight : ""} key={item.id} onClick={() => setSelectedItemId(item.id)} type="button"><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.title || item.label || `Item ${index + 1}`}</strong><small>Ordem {item.position} · {item.enabled ? "Ativo" : "Inativo"}</small></div><b>⋮⋮</b></button>)}</div>
        </section> : null}

        {selectedItem && visibleItemFields.length ? <section className={styles.editorCard}>
          <div className={styles.editing}>Editando destaque {String(selectedItems.findIndex((item) => item.id === selectedItem.id) + 1).padStart(2, "0")} — {selectedItem.title || selectedItem.label || "Item"}</div>
          <form action={updatePageSectionItem} className={styles.form}>
            <input type="hidden" name="id" value={selectedItem.id}/><input type="hidden" name="pageId" value={page.id}/><input type="hidden" name="itemKey" value={selectedItem.itemKey}/><input type="hidden" name="position" value={selectedItem.position}/><input type="hidden" name="enabled" value={selectedItem.enabled ? "true" : ""}/><input type="hidden" name="mediaId" value={selectedItem.mediaId || ""}/>{hiddenItemFields(selectedItem, visibleItemFields)}
            <div className={styles.formTitle}><strong>Conteúdo</strong><small>Conteúdo único + tipografia responsiva da headline</small></div>
            {visibleItemFields.map((field) => <label key={field}><span>{fieldLabels[field]}</span>{field === "body" ? <textarea name={field} rows={5} value={selectedItem[field]} onChange={(event) => patchItem(selectedItem.id, field, event.target.value)}/> : <input name={field} value={selectedItem[field]} onChange={(event) => patchItem(selectedItem.id, field, event.target.value)}/>}</label>)}
            <button className={styles.saveButton} type="submit"><AdminIcon name="document" size={14}/>Salvar item</button>
          </form>
        </section> : null}

        <section className={styles.editorCard}>
          <header><h3>Conteúdo da seção</h3><p>Campos funcionais ligados diretamente ao contrato atual desta seção.</p></header>
          {visibleSectionFields.length ? <form action={updatePageSection} className={styles.form}>
            <input type="hidden" name="id" value={selected.id}/><input type="hidden" name="pageId" value={page.id}/><input type="hidden" name="position" value={selected.position}/><input type="hidden" name="enabled" value={selected.enabled ? "true" : ""}/>{hiddenSectionFields(selected, visibleSectionFields)}
            {visibleSectionFields.map((field) => <label key={field}><span>{fieldLabels[field]}</span>{field === "body" || field === "subtitle" ? <textarea name={field} rows={field === "body" ? 7 : 4} value={selected[field]} onChange={(event) => patchSection(field, event.target.value)}/> : <input name={field} value={selected[field]} onChange={(event) => patchSection(field, event.target.value)}/>}</label>)}
            <button className={styles.saveButton} type="submit"><AdminIcon name="document" size={14}/>Salvar alterações</button>
          </form> : <div className={styles.emptyInline}>Esta seção não possui campos editoriais diretos neste contrato.</div>}
        </section>
      </> : null}

      {tab === "appearance" ? <section className={styles.editorCard}><header><h3>Aparência</h3><p>O padrão visual é controlado pelo frontend público e pelo design system do Portal Lander.</p></header><div className={styles.readonly}><div><span>Layout</span><strong>Portal Lander</strong></div><div><span>Viewport</span><strong>{viewport === "desktop" ? "Desktop" : viewport === "tablet" ? "Tablet" : "Mobile"}</strong></div><div><span>Tipo</span><strong>{selected.type.replaceAll("_", " ")}</strong></div></div></section> : null}

      {tab === "behavior" ? <section className={styles.editorCard}><header><h3>Comportamento</h3><p>Estado e ordem continuam usando os campos persistidos no projeto atual.</p></header><form action={updatePageSection} className={styles.form}><input type="hidden" name="id" value={selected.id}/><input type="hidden" name="pageId" value={page.id}/><input type="hidden" name="position" value={selected.position}/>{(["eyebrow", "title", "subtitle", "body"] as SectionField[]).map((field) => <input key={field} type="hidden" name={field} value={selected[field]}/>) }<label className={styles.toggle}><input name="enabled" type="checkbox" defaultChecked={selected.enabled}/><span><strong>Seção ativa</strong><small>Controla a visibilidade sem alterar o conteúdo.</small></span></label><button className={styles.saveButton} type="submit">Salvar comportamento</button></form></section> : null}
    </aside>

    <section className={styles.previewPanel} aria-label="Preview da página inteira">
      <header><div><h2>Preview da página inteira</h2><p>{viewport === "desktop" ? "Desktop" : viewport === "tablet" ? "Tablet" : "Mobile"} · edição independente por dispositivo · alterações refletidas ao vivo antes de salvar.</p></div><div className={styles.devices}><button aria-label="Desktop" className={viewport === "desktop" ? styles.activeDevice : ""} onClick={() => setViewport("desktop")} type="button"><AdminIcon name="desktop" size={16}/></button><button aria-label="Tablet" className={viewport === "tablet" ? styles.activeDevice : ""} onClick={() => setViewport("tablet")} type="button"><AdminIcon name="tablet" size={16}/></button><button aria-label="Mobile" className={viewport === "mobile" ? styles.activeDevice : ""} onClick={() => setViewport("mobile")} type="button"><AdminIcon name="smartphone" size={16}/></button></div></header>
      <div className={styles.previewCanvas}><PortalPagePreview section={selected} item={selectedItem} viewport={viewport}/></div>
      {publicRoute ? <Link className={styles.publicRouteLink} href={publicRoute} target="_blank">Abrir página pública real ↗</Link> : null}
    </section>
  </div>;
}
