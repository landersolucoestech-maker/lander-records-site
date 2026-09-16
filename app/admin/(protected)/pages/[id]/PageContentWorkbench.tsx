"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

  const selected = sectionDrafts[selectedId] || ordered[0];
  if (!selected) return <div className={styles.empty}>Nenhuma seção registrada para esta página.</div>;

  const visibleSectionFields = sectionFields[selected.sectionKey] || [];
  const visibleItemFields = itemFields[selected.sectionKey] || [];
  const selectedItems = items.filter((item) => item.sectionId === selected.id).map((item) => itemDrafts[item.id] || item);
  const title = sectionLabel(selected);

  const patchSection = (field: SectionField, value: string) => setSectionDrafts((current) => ({ ...current, [selected.id]: { ...current[selected.id], [field]: value } }));
  const patchItem = (id: string, field: ItemField, value: string) => setItemDrafts((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));

  return <div className={styles.editor} data-testid="page-section-workbench">
    <div className={styles.topline}>
      <Link className={styles.backButton} href="/admin/pages"><span aria-hidden="true">←</span> Páginas</Link>
      <div className={styles.topActions}>{publicRoute ? <Link className={styles.outlineButton} href={publicRoute} target="_blank" rel="noopener noreferrer"><AdminIcon name="eye" size={16} />Ver página pública</Link> : null}</div>
    </div>

    <div className={styles.heading}>
      <span>{page.title.toUpperCase()}</span>
      <h1>Configurar seção: {title}</h1>
      <p>Configure {title} no painel rolável à esquerda e acompanhe o preview fixo à direita.</p>
    </div>

    <div className={styles.workbench}>
      <div className={styles.rail}>
        <section className={styles.summaryCard}>
          <div className={styles.summaryHead}><div><small>{title.toUpperCase()}</small><h2>Configurações da seção</h2><p>{selected.enabled ? "Seção ativa no conteúdo CMS." : "Seção atualmente desativada no conteúdo CMS."}</p></div><span className={`${styles.stateBadge} ${selected.enabled ? styles.active : styles.inactive}`}><i />{selected.enabled ? "Ativa" : "Inativa"}</span></div>
          <div className={styles.sectionPicker}><span>Seção</span><select value={selected.id} onChange={(event) => { setSelectedId(event.target.value); setTab("content"); }}>{ordered.map((section, index) => <option key={section.id} value={section.id}>{String(index + 1).padStart(2, "0")} · {sectionLabel(section)}</option>)}</select></div>
        </section>

        <div className={styles.tabs} role="tablist" aria-label="Configuração da seção">
          <button className={tab === "content" ? styles.currentTab : ""} onClick={() => setTab("content")} type="button">Conteúdo</button>
          <button className={tab === "appearance" ? styles.currentTab : ""} onClick={() => setTab("appearance")} type="button">Aparência</button>
          <button className={tab === "behavior" ? styles.currentTab : ""} onClick={() => setTab("behavior")} type="button">Comportamento</button>
        </div>

        <section className={styles.detailCard}>
          {tab === "content" ? <>
            <header><h3>Conteúdo</h3><p>Edite somente os campos funcionais desta seção. A persistência e as regras atuais do projeto continuam sendo usadas.</p></header>
            {visibleSectionFields.length ? <form action={updatePageSection} className={styles.form}>
              <input type="hidden" name="id" value={selected.id} />
              <input type="hidden" name="pageId" value={page.id} />
              <input type="hidden" name="position" value={selected.position} />
              <input type="hidden" name="enabled" value={selected.enabled ? "true" : ""} />
              {hiddenSectionFields(selected, visibleSectionFields)}
              <div className={styles.fields}>{visibleSectionFields.map((field) => <label key={field}><span>{fieldLabels[field]}</span>{field === "body" || field === "subtitle" ? <textarea name={field} rows={field === "body" ? 7 : 4} value={selected[field]} onChange={(event) => patchSection(field, event.target.value)} /> : <input name={field} value={selected[field]} onChange={(event) => patchSection(field, event.target.value)} />}</label>)}</div>
              <div className={styles.formActions}><button className={styles.darkButton} type="submit"><AdminIcon name="document" size={15} />Salvar alterações</button></div>
            </form> : <div className={styles.emptyInline}>Esta seção não possui campos editoriais diretos neste contrato.</div>}

            {selectedItems.length && visibleItemFields.length ? <div className={styles.itemsBlock}><div className={styles.itemsHeading}><strong>Itens da seção</strong><span>{selectedItems.length} item{selectedItems.length === 1 ? "" : "s"}</span></div>{selectedItems.map((item, index) => <form action={updatePageSectionItem} className={styles.itemCard} key={item.id}>
              <input type="hidden" name="id" value={item.id} /><input type="hidden" name="pageId" value={page.id} /><input type="hidden" name="itemKey" value={item.itemKey} /><input type="hidden" name="position" value={item.position} /><input type="hidden" name="enabled" value={item.enabled ? "true" : ""} /><input type="hidden" name="mediaId" value={item.mediaId || ""} />{hiddenItemFields(item, visibleItemFields)}
              <div className={styles.itemHead}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.title || item.label || `Item ${index + 1}`}</strong><small>{item.enabled ? "Item ativo" : "Item inativo"}</small></div></div>
              <div className={styles.itemFields}>{visibleItemFields.map((field) => <label key={field}><span>{fieldLabels[field]}</span>{field === "body" ? <textarea name={field} rows={4} value={item[field]} onChange={(event) => patchItem(item.id, field, event.target.value)} /> : <input name={field} value={item[field]} onChange={(event) => patchItem(item.id, field, event.target.value)} />}</label>)}</div>
              <div className={styles.itemActions}><button className={styles.outlineButton} type="submit">Salvar item</button></div>
            </form>)}</div> : null}
          </> : null}

          {tab === "appearance" ? <><header><h3>Aparência · {viewportLabel(viewport)}</h3><p>O componente público atual continua sendo a fonte de verdade para tipografia, cores e composição visual.</p></header><div className={styles.readonlyGrid}><div><span>Layout</span><strong>Herdado do componente público</strong></div><div><span>Viewport do preview</span><strong>{viewportLabel(viewport)}</strong></div><div><span>Tipo da seção</span><strong>{selected.type.replaceAll("_", " ")}</strong></div></div></> : null}

          {tab === "behavior" ? <><header><h3>Comportamento</h3><p>Estado e ordem permanecem vinculados aos mesmos campos persistidos pelo projeto.</p></header><form action={updatePageSection} className={styles.behaviorForm}>
            <input type="hidden" name="id" value={selected.id} /><input type="hidden" name="pageId" value={page.id} /><input type="hidden" name="position" value={selected.position} />{(["eyebrow", "title", "subtitle", "body"] as SectionField[]).map((field) => <input key={field} name={field} type="hidden" value={selected[field]} />)}
            <label className={styles.toggle}><input checked={selected.enabled} name="enabled" type="checkbox" onChange={(event) => setSectionDrafts((current) => ({ ...current, [selected.id]: { ...current[selected.id], enabled: event.target.checked } }))} /><span><strong>Seção ativa</strong><small>Controla a disponibilidade desta seção no conteúdo CMS.</small></span></label>
            <div className={styles.rule}><span>Ordem</span><strong>{String(selected.position).padStart(2, "0")}</strong><small>A ordem estrutural continua sendo a registrada no banco.</small></div>
            <div className={styles.formActions}><button className={styles.darkButton} type="submit">Salvar comportamento</button></div>
          </form></> : null}
        </section>
      </div>

      <section className={styles.previewPanel} aria-label="Preview da seção">
        <header><div><h2>Preview da seção</h2><p>{viewportLabel(viewport)} · edição em tempo real · alterações refletidas antes de salvar.</p></div><div className={styles.devices}>
          <button aria-label="Desktop" aria-pressed={viewport === "desktop"} className={viewport === "desktop" ? styles.deviceActive : ""} onClick={() => setViewport("desktop")} type="button"><AdminIcon name="monitor" size={17} /></button>
          <button aria-label="Tablet" aria-pressed={viewport === "tablet"} className={viewport === "tablet" ? styles.deviceActive : ""} onClick={() => setViewport("tablet")} type="button"><AdminIcon name="tablet" size={17} /></button>
          <button aria-label="Mobile" aria-pressed={viewport === "mobile"} className={viewport === "mobile" ? styles.deviceActive : ""} onClick={() => setViewport("mobile")} type="button"><AdminIcon name="smartphone" size={17} /></button>
        </div></header>
        <div className={styles.previewCanvas}><div className={`${styles.deviceCanvas} ${styles[viewport]}`}>
          <section className={`${styles.previewSection} ${selected.sectionKey === "hero" ? styles.heroPreview : ""}`}>
            <div className={styles.previewCopy}>{selected.eyebrow ? <span>{selected.eyebrow}</span> : null}<h2>{selected.title || title}</h2>{selected.subtitle ? <p>{selected.subtitle}</p> : null}{selected.body ? <p>{selected.body}</p> : null}{selectedItems.length ? <div className={styles.previewItems}>{selectedItems.slice(0, 4).map((item) => <div key={item.id}><strong>{item.title || item.label || "Item"}</strong>{item.subtitle ? <small>{item.subtitle}</small> : null}{item.label ? <b>{item.label}</b> : null}</div>)}</div> : null}</div>
          </section>
        </div></div>
      </section>
    </div>
  </div>;
}
