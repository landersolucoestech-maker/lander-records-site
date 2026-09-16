"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AdminDialog } from "../../components/AdminDialog";
import { AdminIcon } from "../../components/AdminIcon";
import styles from "./MediaLibrary.module.css";

export type MediaLibraryItem = {
  id: string;
  url: string;
  originalFilename: string;
  storageProvider: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  byteSize: number;
  altText: string;
  status: string;
  createdAt: string;
};

type Action = (formData: FormData) => void | Promise<void>;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export function MediaLibrary({ archiveAction, items, uploadAction }: { archiveAction: Action; items: MediaLibraryItem[]; uploadAction: Action }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("active");
  const [uploadOpen, setUploadOpen] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pt-BR");
    return items.filter((item) => (!needle || [item.originalFilename, item.altText, item.mimeType, item.storageProvider].join(" ").toLocaleLowerCase("pt-BR").includes(needle)) && (status === "all" || item.status === status));
  }, [items, query, status]);

  return <div className={styles.page}>
    <div className={styles.toolbar}>
      <label className={styles.search}><span className="srOnly">Buscar mídia</span><AdminIcon name="search" size={17} /><input onChange={(event) => setQuery(event.target.value)} placeholder="Buscar arquivo, alt text ou tipo..." type="search" value={query} /></label>
      <label><span>Status</span><select onChange={(event) => setStatus(event.target.value)} value={status}><option value="active">Ativas</option><option value="archived">Arquivadas</option><option value="all">Todas</option></select></label>
      <div className={styles.toolbarMeta}><span>{filtered.length} de {items.length} arquivo{items.length === 1 ? "" : "s"}</span><button className="adminButton primary" onClick={() => setUploadOpen(true)} type="button"><span aria-hidden="true">＋</span> Enviar mídia</button></div>
    </div>

    {filtered.length ? <section className={styles.library} aria-label="Biblioteca de mídia">
      <div className={styles.grid}>{filtered.map((item) => <article className={styles.card} key={item.id}>
        <div className={styles.preview}><Image alt={item.altText || ""} fill sizes="(max-width: 760px) 50vw, 220px" src={item.url} unoptimized /></div>
        <div className={styles.cardBody}><div className={styles.cardHeading}><div><strong title={item.originalFilename}>{item.originalFilename}</strong><small>{item.mimeType}</small></div><span className={item.status === "active" ? "adminBadge live" : "adminBadge archived"}><i aria-hidden="true" />{item.status === "active" ? "Ativa" : "Arquivada"}</span></div>
          <dl><div><dt>Dimensões</dt><dd>{item.width && item.height ? `${item.width}×${item.height}` : "—"}</dd></div><div><dt>Tamanho</dt><dd>{formatSize(item.byteSize)}</dd></div><div><dt>Origem</dt><dd>{item.storageProvider}</dd></div><div><dt>Adicionada</dt><dd>{item.createdAt}</dd></div></dl>
          <p>{item.altText || "Sem texto alternativo."}</p>
          <div className={styles.cardActions}><a className="adminButton" href={item.url} rel="noopener noreferrer" target="_blank"><AdminIcon name="eye" size={15} />Abrir</a>{item.status === "active" ? <form action={archiveAction} onSubmit={(event) => { if (!window.confirm(`Arquivar “${item.originalFilename}”?`)) event.preventDefault(); }}><input name="id" type="hidden" value={item.id} /><button className="adminButton danger" type="submit"><AdminIcon name="trash" size={15} />Arquivar</button></form> : null}</div>
        </div>
      </article>)}</div>
    </section> : <div className={styles.empty}><AdminIcon name="media" size={28} /><strong>Nenhuma mídia encontrada</strong><p>{items.length ? "Nenhum arquivo corresponde aos filtros atuais." : "A biblioteca de mídia está vazia."}</p></div>}

    {uploadOpen ? <AdminDialog description="Adicione uma imagem à biblioteca central sem alterar os fluxos de armazenamento existentes." footer={<><button className="adminButton" onClick={() => setUploadOpen(false)} type="button">Cancelar</button><button className="adminButton primary" form="media-upload-form" type="submit">Enviar imagem</button></>} onClose={() => setUploadOpen(false)} title="Enviar mídia">
      <form action={uploadAction} className="adminForm" id="media-upload-form" onSubmit={() => setUploadOpen(false)}><label>Imagem<input accept="image/*" name="file" required type="file" /></label><label>Texto alternativo<input maxLength={500} name="altText" placeholder="Descreva a imagem para acessibilidade" required /></label><div className={styles.uploadHint}><AdminIcon name="image" size={18} /><span>O processamento atual continua responsável por rotação, limite de dimensão, conversão e armazenamento.</span></div></form>
    </AdminDialog> : null}
  </div>;
}
