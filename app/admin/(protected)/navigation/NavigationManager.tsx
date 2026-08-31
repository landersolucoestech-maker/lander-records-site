"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { deleteNavigationItem, upsertNavigationItem } from "../../actions";
import { AdminIcon, type IconName } from "../../components/AdminIcon";
import { INTERNAL_NAVIGATION_DESTINATIONS, menuLabel, NAVIGATION_MENU_KEYS, navigationEmptyMessage, normalizeNavigationNewTab, type NavigationLinkType } from "../../navigation-contract";
import styles from "./NavigationManager.module.css";

export type NavigationSummary = {
  id: string;
  menuKey: string;
  parentId: string | null;
  parentLabel: string | null;
  label: string;
  url: string;
  linkType: string;
  position: number;
  enabled: boolean;
  newTab: boolean;
  depth: number;
  childCount: number;
  issue: string | null;
  safeDestination: boolean;
};

type Filters = { hierarchy?: string; menu?: string; q?: string; status?: string; type?: string };
type Metrics = { active: number; external: number; inactive: number; total: number };

function NavigationForm({ item, items, canDelete, onClose }: { item: NavigationSummary | null; items: NavigationSummary[]; canDelete: boolean; onClose: () => void }) {
  const [linkType, setLinkType] = useState<NavigationLinkType>(item?.linkType === "external" ? "external" : "internal");
  const [menuKey, setMenuKey] = useState(item?.menuKey === "footer" ? "footer" : "primary");
  const [newTab, setNewTab] = useState(normalizeNavigationNewTab(linkType, Boolean(item?.newTab)));
  const parentOptions = item?.childCount ? [] : items.filter((candidate) => candidate.menuKey === menuKey && !candidate.parentId && candidate.id !== item?.id);
  return <section aria-label={item ? `Editar ${item.label}` : "Novo item de menu"} className={styles.editor}>
    <div className={styles.editorHeading}><div><p>{item ? "EDIÇÃO DE ITEM" : "NOVO ITEM"}</p><h2>{item ? item.label : "Adicionar item de navegação"}</h2><span>Configure somente estrutura, destino, ordem e visibilidade do menu.</span></div><button aria-label="Fechar editor" className={styles.iconButton} onClick={onClose} type="button"><AdminIcon name="x" /></button></div>
    <form action={upsertNavigationItem} className={styles.form}>
      {item ? <input name="id" type="hidden" value={item.id} /> : null}
      <label>Menu<select name="menuKey" onChange={(event) => setMenuKey(event.target.value)} value={menuKey}>{NAVIGATION_MENU_KEYS.map((key) => <option key={key} value={key}>{menuLabel(key)}</option>)}</select></label>
      <label>Rótulo<input defaultValue={item?.label || ""} maxLength={160} name="label" required /></label>
      <label>Tipo de link<select name="linkType" onChange={(event) => { const nextType = event.target.value as NavigationLinkType; setLinkType(nextType); if (nextType === "internal") setNewTab(false); }} value={linkType}><option value="internal">Interno</option><option value="external">Externo</option></select></label>
      <label className={styles.destination}>{linkType === "internal" ? "Destino interno" : "URL externa"}<input defaultValue={item?.url || ""} list={linkType === "internal" ? "navigation-public-routes" : undefined} name="url" placeholder={linkType === "internal" ? "/artistas" : "https://exemplo.com"} required type={linkType === "external" ? "url" : "text"} /><small>{linkType === "internal" ? "O catálogo contém apenas rotas públicas confirmadas; destinos dinâmicos existentes também podem ser informados." : "Somente HTTPS é aceito."}</small></label>
      <datalist id="navigation-public-routes">{INTERNAL_NAVIGATION_DESTINATIONS.map((route) => <option key={route.url} value={route.url}>{route.label}</option>)}</datalist>
      <label>Item pai<select defaultValue={item?.parentId || ""} name="parentId"><option value="">Sem pai</option>{parentOptions.map((parent) => <option key={parent.id} value={parent.id}>{parent.label}</option>)}</select><small>Somente um nível administrativo. Subitens ainda não são renderizados publicamente.</small></label>
      <label>Posição<input defaultValue={item?.position ?? 0} max={9999} min={0} name="position" required type="number" /><small>A posição é ordenada dentro do menu selecionado.</small></label>
      <label className={styles.check}><input defaultChecked={item?.enabled ?? true} name="enabled" type="checkbox" />Item ativo</label>
      <label className={styles.check}><input checked={newTab} disabled={linkType === "internal"} name="newTab" onChange={(event) => setNewTab(event.target.checked)} type="checkbox" />Abrir em nova aba{linkType === "internal" ? " (somente para links externos)" : ""}</label>
      <div className={styles.formActions}><button className="adminButton" onClick={onClose} type="button">Cancelar</button><button className="adminButton primary" type="submit">{item ? "Salvar alterações" : "Criar item"}</button></div>
    </form>
    {item && canDelete && item.childCount ? <div className={styles.deleteForm} role="note"><strong>Exclusão bloqueada.</strong><span>Remova ou reassocie {item.childCount} subitem{item.childCount === 1 ? "" : "s"} antes de excluir este item.</span></div> : null}
    {item && canDelete && !item.childCount ? <form action={deleteNavigationItem} className={styles.deleteForm}><input name="id" type="hidden" value={item.id} /><button className="adminButton danger" type="submit">Excluir item</button></form> : null}
  </section>;
}

export default function NavigationManager({ allItems, canDelete = false, canEdit = true, initialFilters = {}, items, message, metrics: metricCounts, preview = false }: { allItems?: NavigationSummary[]; canDelete?: boolean; canEdit?: boolean; initialFilters?: Filters; items: NavigationSummary[]; message?: { kind: "error" | "success"; text: string } | null; metrics?: Metrics; preview?: boolean }) {
  const router = useRouter(); const pathname = usePathname();
  const [query, setQuery] = useState(initialFilters.q || ""); const [status, setStatus] = useState(initialFilters.status || "all"); const [type, setType] = useState(initialFilters.type || "all"); const [menu, setMenu] = useState(initialFilters.menu || "all"); const [hierarchy, setHierarchy] = useState(initialFilters.hierarchy || "all");
  const [editor, setEditor] = useState<NavigationSummary | "new" | null>(null);
  const sourceItems = allItems || items;
  useEffect(() => { if (preview) return; const params = new URLSearchParams(); if (query.trim()) params.set("q", query.trim()); if (status !== "all") params.set("status", status); if (type !== "all") params.set("type", type); if (menu !== "all") params.set("menu", menu); if (hierarchy !== "all") params.set("hierarchy", hierarchy); const timer = window.setTimeout(() => router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false }), 180); return () => window.clearTimeout(timer); }, [hierarchy, menu, pathname, preview, query, router, status, type]);
  const filtered = useMemo(() => { if (!preview) return items; const needle = query.trim().toLocaleLowerCase("pt-BR"); return items.filter((item) => (!needle || `${item.label} ${item.url}`.toLocaleLowerCase("pt-BR").includes(needle)) && (status === "all" || (status === "active" ? item.enabled : !item.enabled)) && (type === "all" || item.linkType === type) && (menu === "all" || item.menuKey === menu) && (hierarchy === "all" || (hierarchy === "root" ? !item.parentId : Boolean(item.parentId)))); }, [hierarchy, items, menu, preview, query, status, type]);
  const counts = metricCounts || { total: items.length, active: items.filter((item) => item.enabled).length, inactive: items.filter((item) => !item.enabled).length, external: items.filter((item) => item.linkType === "external").length };
  const metrics: Array<[IconName, string, number, string]> = [["navigation", "Total de itens", counts.total, "Registros de navegação"], ["home", "Ativos", counts.active, "Habilitados no read model público"], ["x", "Inativos", counts.inactive, "Excluídos do read model público"], ["external", "Links externos", counts.external, "Destinos fora do site"]];
  const hasFilters = Boolean(query.trim() || status !== "all" || type !== "all" || menu !== "all" || hierarchy !== "all");
  const clearFilters = () => { setQuery(""); setStatus("all"); setType("all"); setMenu("all"); setHierarchy("all"); };

  return <div className={styles.manager} data-testid="navigation-manager">
    {preview ? <div className="adminPreviewNotice">BACKEND_ENVIRONMENT_DEFERRED · dados de navegação isolados, sem mutations ou persistência.</div> : null}
    <header className={styles.header}><div><p>Navegação / Visão geral</p><h1>Navegação</h1><span>Gerencie os itens dos menus do site. Organize links, ordem, visibilidade e hierarquia.</span></div>{canEdit && !preview ? <button className="adminButton primary" onClick={() => setEditor("new")} type="button">＋ Novo item de menu</button> : preview ? <button className="adminButton primary" disabled type="button">＋ Novo item de menu</button> : null}</header>
    {message ? <div className={`adminAlert ${message.kind === "error" ? "error" : ""}`} role={message.kind === "error" ? "alert" : "status"}>{message.text}</div> : null}
    {editor ? <NavigationForm canDelete={canDelete} item={editor === "new" ? null : editor} items={sourceItems} key={editor === "new" ? "new" : editor.id} onClose={() => setEditor(null)} /> : null}
    <section aria-label="Resumo da navegação" className={styles.metrics}>{metrics.map(([icon, label, value, detail]) => <article data-testid="navigation-metric-card" key={label}><span className={styles.metricIcon}><AdminIcon name={icon} /></span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>)}</section>
    <section className={styles.catalog}>
      <div className={styles.toolbar} role="search"><label className={styles.search}><span className="srOnly">Buscar itens de navegação</span><AdminIcon name="search" size={17} /><input onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por rótulo ou URL..." type="search" value={query} /></label><label><span>Status</span><select onChange={(event) => setStatus(event.target.value)} value={status}><option value="all">Todos</option><option value="active">Ativos</option><option value="inactive">Inativos</option></select></label><label><span>Tipo</span><select onChange={(event) => setType(event.target.value)} value={type}><option value="all">Todos</option><option value="internal">Internos</option><option value="external">Externos</option></select></label><label><span>Menu</span><select onChange={(event) => setMenu(event.target.value)} value={menu}><option value="all">Todos</option><option value="primary">Principal</option><option value="footer">Rodapé</option></select></label><label><span>Hierarquia</span><select onChange={(event) => setHierarchy(event.target.value)} value={hierarchy}><option value="all">Todos</option><option value="root">Itens principais</option><option value="child">Subitens</option></select></label>{hasFilters && filtered.length ? <button className="adminButton" onClick={clearFilters} type="button">Limpar filtros</button> : null}</div>
      {filtered.length ? <div aria-label="Itens de navegação cadastrados" role="table"><div className={styles.tableHeader} role="row">{["Item do menu", "Tipo", "URL / destino", "Abre em", "Status", "Ordem", "Ações"].map((label) => <span key={label} role="columnheader">{label}</span>)}</div><div className={styles.rows} role="rowgroup">{filtered.map((item, index) => <div className={styles.rowWrap} key={item.id}>{index === 0 || filtered[index - 1].menuKey !== item.menuKey ? <div className={styles.menuHeading}>{menuLabel(item.menuKey)}</div> : null}<div className={`${styles.row} ${item.parentId ? styles.child : ""}`} data-testid="navigation-row" role="row">
        <div className={styles.identity} role="cell"><span className={styles.itemIcon}><AdminIcon name={item.parentId ? "chevron" : "navigation"} /></span><span><strong>{item.label}</strong><p>{item.parentLabel ? `Subitem de ${item.parentLabel}` : menuLabel(item.menuKey)}</p>{item.issue ? <small className={styles.warning}>{item.issue}</small> : null}</span></div>
        <div role="cell"><span className={`${styles.typeBadge} ${item.linkType === "external" ? styles.external : ""}`}>{item.linkType === "internal" ? "Interno" : item.linkType === "external" ? "Externo" : item.linkType}</span></div>
        <div className={styles.destinationCell} role="cell"><strong title={item.url}>{item.url}</strong></div>
        <div className={styles.openMode} role="cell">{item.linkType === "external" && item.newTab ? <><AdminIcon name="external" size={14} /> Nova aba</> : "Mesma aba"}</div>
        <div role="cell"><span className={`adminBadge ${item.enabled ? "live" : "archived"}`}><i aria-hidden="true" />{item.enabled ? "Ativo" : "Inativo"}</span>{item.parentId && sourceItems.some((candidate) => candidate.id === item.parentId && !candidate.enabled) ? <small className={styles.warning}>Pai inativo</small> : null}</div>
        <div className={styles.position} role="cell"><strong>{item.position}</strong></div>
        <div aria-label={`Ações de ${item.label}`} className={styles.actions} role="cell">{canEdit && !preview ? <button aria-label={`Editar ${item.label}`} onClick={() => setEditor(item)} type="button"><AdminIcon name="pages" size={16} /></button> : preview ? <button aria-label={`Editar ${item.label} indisponível no preview`} disabled type="button"><AdminIcon name="pages" size={16} /></button> : null}{!preview && item.safeDestination ? item.linkType === "external" ? <a aria-label={`Abrir destino de ${item.label} (abre em nova aba)`} href={item.url} rel="noopener noreferrer" target="_blank"><AdminIcon name="external" size={16} /></a> : <Link aria-label={`Abrir destino de ${item.label}`} href={item.url}><AdminIcon name="external" size={16} /></Link> : <button aria-label={`Abrir destino de ${item.label} indisponível${preview ? " no preview" : " por URL inválida"}`} disabled type="button"><AdminIcon name="external" size={16} /></button>}</div>
      </div></div>)}</div><div className={styles.resultCount}>Mostrando {filtered.length} de {counts.total} itens</div></div> : <div className={styles.empty} data-testid="navigation-empty"><strong>{navigationEmptyMessage(sourceItems.length)}</strong>{hasFilters ? <button className="adminButton" onClick={clearFilters} type="button">Limpar filtros</button> : canEdit && !preview ? <button className="adminButton primary" onClick={() => setEditor("new")} type="button">Adicionar primeiro item</button> : null}</div>}
    </section>
    <section aria-label="Limites e boas práticas de navegação" className={styles.guidance}><article><AdminIcon name="navigation" /><div><h2>Hierarquia administrativa</h2><p>O modelo registra pai e filho, mas Header, menu mobile e Footer exibem atualmente somente itens principais.</p></div></article><article><AdminIcon name="pages" /><div><h2>Páginas e menus são independentes</h2><p>Criar uma página não adiciona automaticamente um link, e remover um item não exclui conteúdo.</p></div></article><article><AdminIcon name="settings" /><div><h2>Boas práticas</h2><p>Use rótulos curtos, confirme o destino público e mantenha as posições organizadas dentro de cada menu.</p></div></article></section>
  </div>;
}
