"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminIcon } from "./AdminIcon";
import styles from "./AdminMediaPicker.module.css";

export type AdminMediaPickerItem = { id: string; name: string; url: string };

export function AdminMediaPicker({ items, onClose, onSelect, open, selectedId, title = "Selecionar imagem de capa" }: {
  items: AdminMediaPickerItem[];
  onClose: () => void;
  onSelect: (item: AdminMediaPickerItem) => void;
  open: boolean;
  selectedId?: string;
  title?: string;
}) {
  const [query, setQuery] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pt-BR");
    return items.filter((item) => !needle || [item.name, item.url].join(" ").toLocaleLowerCase("pt-BR").includes(needle));
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),[href],[tabindex="0"]') || []).filter((node) => node.getClientRects().length);
    window.setTimeout(() => (focusable()[0] || dialog)?.focus(), 0);
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const nodes = focusable();
      if (!nodes.length) { event.preventDefault(); dialog?.focus(); return; }
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return <div className={styles.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="presentation">
    <section aria-labelledby="admin-media-picker-title" aria-modal="true" className={styles.dialog} ref={dialogRef} role="dialog" tabIndex={-1}>
      <header className={styles.header}><div><span>BIBLIOTECA DE MÍDIAS</span><h2 id="admin-media-picker-title">{title}</h2><p>Escolha uma imagem já armazenada no Portal Lander.</p></div><button aria-label="Fechar biblioteca" className={styles.close} onClick={onClose} type="button"><AdminIcon name="x" size={18}/></button></header>
      <div className={styles.toolbar}><label className={styles.search}><span className="srOnly">Buscar imagem</span><AdminIcon name="search" size={16}/><input autoComplete="off" placeholder="Buscar por nome ou URL..." type="search" value={query} onChange={(event) => setQuery(event.target.value)}/></label><span>{filtered.length} imagem{filtered.length === 1 ? "" : "ns"}</span></div>
      <div className={styles.body}>{filtered.length ? <div className={styles.grid}>{filtered.map((item) => <button aria-pressed={item.id === selectedId} className={`${styles.item}${item.id === selectedId ? ` ${styles.selected}` : ""}`} key={item.id} onClick={() => onSelect(item)} type="button"><span className={styles.thumb}>{item.url ? <Image alt={item.name || "Imagem da biblioteca"} fill sizes="220px" src={item.url} unoptimized/> : <AdminIcon name="media" size={24}/>} {item.id === selectedId ? <i><AdminIcon name="check" size={14}/></i> : null}</span><span className={styles.copy}><strong>{item.name || "Mídia sem nome"}</strong><small>{item.url}</small></span></button>)}</div> : <div className={styles.empty}><AdminIcon name="media" size={26}/><strong>Nenhuma imagem encontrada</strong><p>Envie imagens em Site → Mídias ou ajuste a busca.</p></div>}</div>
    </section>
  </div>;
}
