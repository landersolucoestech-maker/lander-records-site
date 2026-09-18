"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminDialog } from "../../components/AdminDialog";
import { AdminIcon } from "../../components/AdminIcon";
import { AdminPagination } from "../../components/AdminPagination";
import styles from "./MediaLibrary.module.css";

export type MediaLibraryItem = { id:string; url:string; originalFilename:string; storageProvider:string; mimeType:string; width:number|null; height:number|null; byteSize:number; altText:string; status:string; createdAt:string };
type Action = (formData: FormData) => void | Promise<void>;
type PageSize = 10 | 25 | 50;
function formatSize(bytes:number){if(bytes<1024)return`${bytes} B`;if(bytes<1024*1024)return`${Math.max(1,Math.round(bytes/1024)).toLocaleString("pt-BR")} KB`;return`${(bytes/(1024*1024)).toLocaleString("pt-BR",{maximumFractionDigits:1})} MB`;}
function typeLabel(mimeType:string){if(mimeType.startsWith("image/"))return"Imagem";if(mimeType.startsWith("video/"))return"Vídeo";if(mimeType==="application/pdf")return"PDF";return mimeType||"Arquivo";}
function Metric({accent,icon,label,value,hint}:{accent:"red"|"blue"|"green"|"orange";icon:"media"|"check"|"image"|"upload";label:string;value:string;hint:string}){return <article className={`adminMetricCard is-${accent}`}><span className="adminMetricIcon"><AdminIcon name={icon} size={24}/></span><div className="adminMetricCopy"><span>{label}</span><strong>{value}</strong><small>{hint}</small></div></article>;}

export function MediaLibrary({ archiveAction, canArchive, canUpload, items, uploadAction }: { archiveAction:Action; canArchive:boolean; canUpload:boolean; items:MediaLibraryItem[]; uploadAction:Action }) {
  const [query,setQuery]=useState(""); const [type,setType]=useState("Todos"); const [page,setPage]=useState(1); const [pageSize,setPageSize]=useState<PageSize>(10); const [uploadOpen,setUploadOpen]=useState(false);
  const types=useMemo(()=>["Todos",...Array.from(new Set(items.map((item)=>typeLabel(item.mimeType)))).sort((a,b)=>a.localeCompare(b,"pt-BR"))],[items]);
  const filtered=useMemo(()=>{const needle=query.trim().toLocaleLowerCase("pt-BR");return items.filter((item)=>(!needle||[item.originalFilename,item.altText,item.mimeType,item.storageProvider].join(" ").toLocaleLowerCase("pt-BR").includes(needle))&&(type==="Todos"||typeLabel(item.mimeType)===type));},[items,query,type]);
  const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize)); const safePage=Math.min(page,totalPages); const visible=filtered.slice((safePage-1)*pageSize,safePage*pageSize);
  const activeCount=items.filter((item)=>item.status==="active").length;
  const imageCount=items.filter((item)=>item.mimeType.startsWith("image/")).length;
  const totalBytes=items.reduce((sum,item)=>sum+Math.max(0,item.byteSize||0),0);

  useEffect(()=>{if(!canUpload)return;const open=()=>setUploadOpen(true);window.addEventListener("admin:add-media",open);return()=>window.removeEventListener("admin:add-media",open);},[canUpload]);

  return <div className="adminDashboard" data-testid="media-manager">
    {!canUpload ? <div className="adminReadOnlyNotice" role="status">Biblioteca em modo de leitura para este acesso.</div> : null}
    <section className="adminMetricGrid" aria-label="Resumo da biblioteca de mídia">
      <Metric accent="red" icon="media" label="Arquivos" value={items.length.toLocaleString("pt-BR")} hint="total na biblioteca"/>
      <Metric accent="green" icon="check" label="Ativos" value={activeCount.toLocaleString("pt-BR")} hint="disponíveis para uso"/>
      <Metric accent="blue" icon="image" label="Imagens" value={imageCount.toLocaleString("pt-BR")} hint="arquivos de imagem"/>
      <Metric accent="orange" icon="upload" label="Armazenamento" value={formatSize(totalBytes)} hint="volume carregado"/>
    </section>

    <section className={`adminDashboardPanel ${styles.tableSurface}`}>
      <div className="adminAnalyticsPanelHeading"><div className="adminPanelHeadingIdentity"><span className="adminPanelHeadingIcon"><AdminIcon name="media" size={20}/></span><div><h2>Biblioteca de mídia</h2><p>{filtered.length} de {items.length} arquivos visíveis com os filtros atuais.</p></div></div></div>
      <div className={`admin-toolbar ${styles.toolbar}`}>
        <div className={styles.toolbarGroup}><label className={styles.search}><span className="srOnly">Buscar mídia</span><AdminIcon name="search" size={16}/><input value={query} onChange={(event)=>{setQuery(event.target.value);setPage(1);}} placeholder="Buscar arquivo, URL ou tipo..." type="search"/></label><label className="srOnly" htmlFor="media-type">Filtrar mídia por tipo</label><select id="media-type" value={type} onChange={(event)=>{setType(event.target.value);setPage(1);}}>{types.map((value)=><option key={value} value={value}>{value==="Todos"?"Todos os tipos":value}</option>)}</select></div>
        <div className={styles.toolbarEnd}><span>{filtered.length} de {items.length} arquivos</span></div>
      </div>

      {filtered.length?<section className="table-card"><div className={styles.tableWrap}><table><thead><tr><th>Arquivo</th><th>Tipo</th><th>Tamanho</th><th>Adicionado em</th><th>Origem</th><th className={styles.actionsColumn}>Ações</th></tr></thead><tbody>{visible.map((item)=><tr key={item.id}><td><div className={`table-primary ${styles.fileIdentity}`}><span className={styles.fileIcon}><AdminIcon name="media" size={14}/></span><div><strong>{item.originalFilename||"Mídia sem nome"}</strong><small>{item.url}</small></div></div></td><td><span className={styles.typeBadge}>{typeLabel(item.mimeType)}</span></td><td>{formatSize(item.byteSize)}</td><td>{item.createdAt}</td><td>{item.storageProvider||"Armazenamento"}</td><td className={styles.actionsColumn}><div className={styles.rowActions}><Link aria-label={`Abrir ${item.originalFilename}`} href={item.url} rel="noopener noreferrer" target="_blank"><AdminIcon name="eye" size={15}/></Link>{canArchive&&item.status==="active"?<form action={archiveAction} onSubmit={(event)=>{if(!window.confirm(`Arquivar “${item.originalFilename}”?`))event.preventDefault();}}><input name="id" type="hidden" value={item.id}/><button aria-label={`Arquivar ${item.originalFilename}`} type="submit"><AdminIcon name="trash" size={15}/></button></form>:null}</div></td></tr>)}</tbody></table></div>
      <AdminPagination currentPage={safePage} endItem={filtered.length ? Math.min(safePage * pageSize, filtered.length) : 0} itemLabel={visible.length===1?"registro":"registros"} onPageChange={setPage} onPageSizeChange={(value)=>{setPageSize(value as PageSize);setPage(1);}} pageSize={pageSize} pageSizeOptions={[10,25,50]} startItem={filtered.length ? (safePage - 1) * pageSize + 1 : 0} totalItems={filtered.length} totalPages={totalPages}/></section>:<div className={`admin-empty ${styles.empty}`}><AdminIcon name="media" size={28}/><strong>Nenhuma mídia encontrada</strong><p>{items.length?"Nenhum arquivo corresponde aos filtros atuais.":"A biblioteca de mídia está vazia."}</p></div>}
    </section>

    {canUpload&&uploadOpen?<AdminDialog description="Envie uma imagem para a biblioteca central usando o armazenamento configurado no projeto." footer={<><button className="adminButton" onClick={()=>setUploadOpen(false)} type="button">Cancelar</button><button className="adminPrimaryCompact" form="media-upload-form" type="submit"><AdminIcon name="upload" size={15}/>Enviar mídia</button></>} onClose={()=>setUploadOpen(false)} title="Adicionar mídia"><form action={uploadAction} className={styles.modalForm} id="media-upload-form" onSubmit={()=>setUploadOpen(false)}><label><span>Arquivo</span><input accept="image/*" name="file" required type="file"/><small>Selecione uma imagem válida para a biblioteca.</small></label><label><span>Texto alternativo</span><input maxLength={500} name="altText" placeholder="Descrição acessível da imagem ou arquivo" required/><small>Usado em acessibilidade e nos componentes públicos que exibem esta mídia.</small></label></form></AdminDialog>:null}
  </div>;
}
