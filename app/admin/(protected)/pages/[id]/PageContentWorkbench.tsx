"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { addPageSectionItem, deletePageSectionItem, updatePageSection, updatePageSectionItem } from "../../../actions";
import { AdminIcon } from "../../../components/AdminIcon";
import { siteSectionContract, type ItemFieldName, type SectionFieldName } from "../site-page-contract";
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

export type PageMediaOption = {
  id: string;
  url: string;
  altText: string;
  mimeType: string;
  originalFilename: string;
};

type Viewport = "desktop" | "tablet" | "mobile";
type Tab = "content" | "appearance" | "behavior";

type Props = {
  page: { id: string; key: string; title: string };
  publicRoute: string | null;
  sections: PageEditorSection[];
  items: PageEditorItem[];
  mediaOptions?: PageMediaOption[];
  initialSectionId?: string;
};

const allSectionFields: SectionFieldName[] = ["eyebrow", "title", "subtitle", "body"];
const allItemFields: ItemFieldName[] = ["title", "subtitle", "body", "label", "url"];
const fieldLabels: Record<SectionFieldName | ItemFieldName, string> = {
  eyebrow: "Chamada / kicker",
  title: "Título",
  subtitle: "Descrição / subtítulo",
  body: "Texto",
  label: "Texto do botão / link",
  url: "Destino",
};

function viewportLabel(viewport: Viewport) {
  return viewport === "desktop" ? "Desktop" : viewport === "tablet" ? "Tablet" : "Mobile";
}

function fallbackLabel(section: PageEditorSection) {
  return section.sectionKey.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function hiddenSectionFields(section: PageEditorSection, visible: readonly SectionFieldName[]) {
  return allSectionFields.filter((field) => !visible.includes(field)).map((field) => <input key={field} name={field} type="hidden" value={section[field]} />);
}

function hiddenItemFields(item: PageEditorItem, visible: readonly ItemFieldName[]) {
  return allItemFields.filter((field) => !visible.includes(field)).map((field) => <input key={field} name={field} type="hidden" value={item[field]} />);
}

function EmptyField({ name }: { name: ItemFieldName }) {
  return <input name={name} type="hidden" value="" />;
}

function FieldControl({ field, name, value, onChange }: { field: SectionFieldName | ItemFieldName; name: string; value: string; onChange: (value: string) => void }) {
  const multiline = field === "body" || field === "subtitle";
  return <label><span>{fieldLabels[field]}</span>{multiline
    ? <textarea name={name} rows={field === "body" ? 6 : 4} value={value} onChange={(event) => onChange(event.target.value)} />
    : <input name={name} value={value} onChange={(event) => onChange(event.target.value)} />}</label>;
}

export default function PageContentWorkbench({ page, publicRoute, sections, items, mediaOptions = [], initialSectionId }: Props) {
  const ordered = useMemo(() => [...sections].sort((a, b) => a.position - b.position), [sections]);
  const firstId = ordered[0]?.id || "";
  const [selectedId, setSelectedId] = useState(initialSectionId && ordered.some((section) => section.id === initialSectionId) ? initialSectionId : firstId);
  const [tab, setTab] = useState<Tab>("content");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [sectionDrafts, setSectionDrafts] = useState<Record<string, PageEditorSection>>(() => Object.fromEntries(ordered.map((section) => [section.id, { ...section }])));
  const [itemDrafts, setItemDrafts] = useState<Record<string, PageEditorItem>>(() => Object.fromEntries(items.map((item) => [item.id, { ...item }])));
  const [selectedItemId, setSelectedItemId] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  const selected = sectionDrafts[selectedId] || ordered[0];
  const contract = selected ? siteSectionContract(page.key, selected.sectionKey) : null;
  const selectedItems = useMemo(() => {
    if (!selected) return [];
    return items
      .filter((item) => item.sectionId === selected.id)
      .map((item) => itemDrafts[item.id] || item)
      .sort((a, b) => a.position - b.position);
  }, [itemDrafts, items, selected]);
  const selectedItem = selectedItems.find((item) => item.id === selectedItemId) || selectedItems[0];
  const title = contract?.label || (selected ? fallbackLabel(selected) : "Página");
  const visibleSectionFields: readonly SectionFieldName[] = contract?.fields || allSectionFields;
  const visibleItemFields: readonly ItemFieldName[] = contract?.itemFields || allItemFields;
  const canAddItem = Boolean(contract?.allowAddItems && (!contract.maxItems || selectedItems.length < contract.maxItems));
  const mediaOption = selectedItem?.mediaId ? mediaOptions.find((media) => media.id === selectedItem.mediaId) : undefined;
  const hasEditableContent = visibleSectionFields.length > 0 || visibleItemFields.length > 0 || Boolean(contract?.media);

  useEffect(() => {
    if (!selectedItems.length) {
      setSelectedItemId("");
      return;
    }
    if (!selectedItems.some((item) => item.id === selectedItemId)) setSelectedItemId(selectedItems[0].id);
  }, [selectedId, selectedItemId, selectedItems]);

  useEffect(() => {
    if (!selected) return;
    window.dispatchEvent(new CustomEvent("admin:context-header", {
      detail: {
        title: `Configurar seção: ${title}`,
        description: `Edite somente os campos consumidos por ${title} no site público da Lander Records e valide o resultado no preview real.`,
      },
    }));
  }, [selected, title]);

  if (!selected) return <div className={styles.empty}>Nenhuma seção registrada para esta página.</div>;

  const patchSection = (field: SectionFieldName, value: string) => setSectionDrafts((current) => ({ ...current, [selected.id]: { ...current[selected.id], [field]: value } }));
  const patchItem = (id: string, field: ItemFieldName, value: string) => setItemDrafts((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));
  const patchItemMeta = (id: string, values: Partial<Pick<PageEditorItem, "mediaId" | "position" | "enabled">>) => setItemDrafts((current) => ({ ...current, [id]: { ...current[id], ...values } }));

  const chooseSection = (id: string) => {
    setSelectedId(id);
    setTab("content");
    setSelectedItemId("");
    setAddingItem(false);
  };

  return <div className={styles.workbench} data-testid="page-section-workbench" data-site-source="lander-records">
    <aside className={styles.editorRail} aria-label="Configuração da seção da Lander Records">
      <section className={styles.sectionSelector}>
        <label><span>Seção da página</span><select value={selected.id} onChange={(event) => chooseSection(event.target.value)}>{ordered.map((section, index) => {
          const sectionContract = siteSectionContract(page.key, section.sectionKey);
          return <option key={section.id} value={section.id}>{String(index + 1).padStart(2, "0")} · {sectionContract?.label || fallbackLabel(section)}</option>;
        })}</select></label>
      </section>

      {contract?.media === "item-image" ? <section className={styles.mediaCard}>
        <div className={styles.mediaHeading}><div><span>{title.toUpperCase()}</span><h2>{contract.mediaLabel || "Mídia da seção"}</h2></div><span className={styles.mediaState}>{mediaOption ? "Configurada" : "Sem mídia"}</span></div>
        <p>Este asset possui consumidor real no frontend público da Lander Records.</p>
        <div className={styles.mediaPreview}>{mediaOption ? <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={mediaOption.url} alt={mediaOption.altText || mediaOption.originalFilename} style={{ display: "block", maxWidth: "100%", maxHeight: 150, objectFit: "contain" }} /><strong>{mediaOption.originalFilename}</strong></> : <><AdminIcon name="image" size={30}/><strong>Nenhuma mídia vinculada</strong><small>Selecione um asset no formulário do item abaixo.</small></>}</div>
        <Link className={styles.uploadButton} href="/admin/media"><AdminIcon name="upload" size={14}/><span>Gerenciar biblioteca de mídia</span></Link>
      </section> : null}

      <div className={styles.tabs} role="tablist" aria-label="Configuração da seção">
        <button aria-selected={tab === "content"} className={tab === "content" ? styles.currentTab : ""} onClick={() => setTab("content")} role="tab" type="button">Conteúdo</button>
        <button aria-selected={tab === "appearance"} className={tab === "appearance" ? styles.currentTab : ""} onClick={() => setTab("appearance")} role="tab" type="button">Aparência</button>
        <button aria-selected={tab === "behavior"} className={tab === "behavior" ? styles.currentTab : ""} onClick={() => setTab("behavior")} role="tab" type="button">Comportamento</button>
      </div>

      {tab === "content" ? <>
        <section className={styles.detailCard}>
          <header><h3>{title}</h3><p>{contract?.description || "Seção administrativa sem contrato público específico."}</p></header>
          <div className={styles.readonlyGrid}>
            <div><span>Consumidor público</span><strong>{contract?.source || "Sem consumidor canônico registrado"}</strong></div>
            <div><span>Tipo</span><strong>{selected.type.replaceAll("_", " ")}</strong></div>
            {contract?.sourceHref ? <div><span>Fonte de dados</span><strong><Link href={contract.sourceHref}>Abrir módulo responsável →</Link></strong></div> : null}
          </div>
        </section>

        {selectedItems.length || canAddItem ? <section className={styles.highlightsCard}>
          <header><div><h3>{selected.sectionKey === "hero" ? "CTAs do Hero" : contract?.media ? "Mídia da seção" : "Itens da seção"}</h3><p>Somente itens realmente consumidos pelo frontend público aparecem aqui.</p></div>{canAddItem ? <button onClick={() => setAddingItem((value) => !value)} type="button">+ Novo</button> : null}</header>
          {selectedItems.length ? <div className={styles.highlightList}>{selectedItems.map((item, index) => <button className={item.id === selectedItem?.id ? styles.selectedHighlight : ""} key={item.id} onClick={() => { setSelectedItemId(item.id); setAddingItem(false); }} type="button"><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.label || item.title || contract?.mediaLabel || `Item ${index + 1}`}</strong><small>Ordem {item.position} · {item.enabled ? "Ativo" : "Inativo"}</small></div><span className={styles.dragMark}>⋮⋮</span></button>)}</div> : null}
        </section> : null}

        {addingItem && canAddItem ? <section className={styles.detailCard}>
          <header><h3>Novo item</h3><p>O item será persistido apenas nos campos usados por esta seção da Lander Records.</p></header>
          <form action={addPageSectionItem} className={styles.form}>
            <input name="sectionId" type="hidden" value={selected.id}/><input name="pageId" type="hidden" value={page.id}/><input name="itemKey" type="hidden" value={`item-${selectedItems.length + 1}`}/><input name="position" type="hidden" value={selectedItems.length + 1}/><input name="mediaId" type="hidden" value=""/>
            {allItemFields.filter((field) => !visibleItemFields.includes(field)).map((field) => <EmptyField key={field} name={field}/>)}
            <div className={styles.fields}>{visibleItemFields.map((field) => <label key={field}><span>{fieldLabels[field]}</span>{field === "body" || field === "subtitle" ? <textarea name={field} rows={field === "body" ? 6 : 4}/> : <input name={field}/>}</label>)}</div>
            <div className={styles.formActions}><button className={styles.primaryButton} type="submit"><AdminIcon name="plus" size={14}/>Adicionar item</button></div>
          </form>
        </section> : null}

        {selectedItem && (visibleItemFields.length > 0 || contract?.media) ? <section className={styles.detailCard}>
          <header className={styles.editingHeader}><span>Editando item {String(selectedItems.findIndex((item) => item.id === selectedItem.id) + 1).padStart(2, "0")} — {selectedItem.label || selectedItem.title || contract?.mediaLabel || "Item"}</span></header>
          <form action={updatePageSectionItem} className={styles.form}>
            <input type="hidden" name="id" value={selectedItem.id}/><input type="hidden" name="pageId" value={page.id}/><input type="hidden" name="itemKey" value={selectedItem.itemKey}/>{hiddenItemFields(selectedItem, visibleItemFields)}
            <div className={styles.fields}>
              {visibleItemFields.map((field) => <FieldControl field={field} key={field} name={field} value={selectedItem[field]} onChange={(value) => patchItem(selectedItem.id, field, value)} />)}
              {contract?.media ? <label><span>{contract.mediaLabel || "Mídia"}</span><select name="mediaId" value={selectedItem.mediaId || ""} onChange={(event) => patchItemMeta(selectedItem.id, { mediaId: event.target.value || null })}><option value="">Sem mídia</option>{mediaOptions.map((media) => <option key={media.id} value={media.id}>{media.originalFilename}</option>)}</select></label> : <input name="mediaId" type="hidden" value={selectedItem.mediaId || ""}/>} 
              <label><span>Ordem</span><input min="1" name="position" type="number" value={selectedItem.position} onChange={(event) => patchItemMeta(selectedItem.id, { position: Math.max(1, Number(event.target.value) || 1) })}/></label>
              <label className={styles.toggle}><input name="enabled" type="checkbox" checked={selectedItem.enabled} onChange={(event) => patchItemMeta(selectedItem.id, { enabled: event.target.checked })}/><span><strong>Item ativo</strong><small>Itens inativos não são retornados ao frontend público.</small></span></label>
            </div>
            <div className={styles.formActions}><button className={styles.primaryButton} type="submit"><AdminIcon name="document" size={14}/>Salvar item</button></div>
          </form>
          {contract?.allowAddItems ? <form action={deletePageSectionItem} className={styles.form}><input name="id" type="hidden" value={selectedItem.id}/><input name="pageId" type="hidden" value={page.id}/><div className={styles.formActions}><button className="adminButton danger" type="submit">Excluir item</button></div></form> : null}
        </section> : null}

        {visibleSectionFields.length ? <section className={styles.detailCard}>
          <header><h3>Conteúdo da seção</h3><p>Estes são exatamente os campos lidos pelo componente público atual.</p></header>
          <form action={updatePageSection} className={styles.form}>
            <input type="hidden" name="id" value={selected.id}/><input type="hidden" name="pageId" value={page.id}/><input type="hidden" name="position" value={selected.position}/><input type="hidden" name="enabled" value={selected.enabled ? "true" : ""}/>{hiddenSectionFields(selected, visibleSectionFields)}
            <div className={styles.fields}>{visibleSectionFields.map((field) => <FieldControl field={field} key={field} name={field} value={selected[field]} onChange={(value) => patchSection(field, value)} />)}</div>
            <div className={styles.formActions}><button className={styles.primaryButton} type="submit"><AdminIcon name="document" size={14}/>Salvar alterações</button></div>
          </form>
        </section> : !hasEditableContent ? <div className={styles.emptyInline}>Esta seção é controlada pelo módulo de domínio indicado acima; não existem campos de página sem consumidor real para editar.</div> : null}
      </> : null}

      {tab === "appearance" ? <section className={styles.detailCard}><header><h3>Aparência</h3><p>O frontend público da Lander Records é a fonte de verdade visual. O Portal Lander não define este conteúdo.</p></header><div className={styles.readonlyGrid}><div><span>Renderer</span><strong>{contract?.source || "Componente público da Lander Records"}</strong></div><div><span>Preview</span><strong>{viewportLabel(viewport)}</strong></div><div><span>Estilo</span><strong>CSS público da Lander Records</strong></div></div></section> : null}

      {tab === "behavior" ? <section className={styles.detailCard}><header><h3>Comportamento</h3><p>A ordem estrutural é definida pelo renderer público; o CMS controla a ativação desta seção.</p></header><form action={updatePageSection} className={styles.form}>
        <input type="hidden" name="id" value={selected.id}/><input type="hidden" name="pageId" value={page.id}/><input type="hidden" name="position" value={selected.position}/>{allSectionFields.map((field) => <input key={field} type="hidden" name={field} value={selected[field]}/>) }
        <label className={styles.toggle}><input name="enabled" type="checkbox" defaultChecked={selected.enabled}/><span><strong>Seção ativa</strong><small>Quando desativada, o repositório público deixa de fornecer esta seção ao frontend.</small></span></label>
        <div className={styles.readonlyGrid}><div><span>Posição canônica</span><strong>{String(selected.position).padStart(2, "0")} · {title}</strong></div></div>
        <div className={styles.formActions}><button className={styles.primaryButton} type="submit">Salvar comportamento</button></div>
      </form></section> : null}
    </aside>

    <section className={styles.previewPanel} aria-label="Preview público real">
      <header><div><h2>Preview público real</h2><p>{viewportLabel(viewport)} · renderização do próprio site da Lander Records · alterações persistidas aparecem após salvar.</p></div><div className={styles.devices}><button aria-label="Desktop" aria-pressed={viewport === "desktop"} className={viewport === "desktop" ? styles.deviceActive : ""} onClick={() => setViewport("desktop")} type="button"><AdminIcon name="monitor" size={17}/></button><button aria-label="Tablet" aria-pressed={viewport === "tablet"} className={viewport === "tablet" ? styles.deviceActive : ""} onClick={() => setViewport("tablet")} type="button"><AdminIcon name="tablet" size={17}/></button><button aria-label="Mobile" aria-pressed={viewport === "mobile"} className={viewport === "mobile" ? styles.deviceActive : ""} onClick={() => setViewport("mobile")} type="button"><AdminIcon name="smartphone" size={17}/></button></div></header>
      <div className={styles.previewStage}>
        <div className={`${styles.frameViewport} ${styles[viewport]}`}>
          {publicRoute ? <iframe className={styles.previewFrame} src={publicRoute} title={`Preview público de ${page.title}`} /> : <div className={styles.noPreview}><AdminIcon name="eye" size={26}/><strong>Preview público indisponível</strong><p>Esta página não possui renderer público registrado.</p></div>}
        </div>
      </div>
    </section>
  </div>;
}
