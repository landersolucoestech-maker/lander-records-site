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
type SortMode = "created-desc" | "created-asc" | "name-asc" | "name-desc";
function formatSize(bytes:number){if(bytes<1024)return`${bytes} B`;if(bytes<1024*1024)return`${Math.max(1,Math.round(bytes/1024)).toLocaleString("pt-BR")} KB`;return`${(bytes/(1024*1024)).toLocaleString("pt-BR",{maximumFractionDigits:1})} MB`;}
function typeLabel(mimeType:string){if(mimeType.startsWith("image/"))return"Imagem";if(mimeType.startsWith("video/"))return"Vídeo";if(mimeType==="application/pdf")return"PDF";return mimeType||"Arquivo";}
function statusLabel(status:string){if(status==="active")return"Ativos";if(status==="archived")return"Arquivados";return status||"Sem status";}
function dateValue(value:string){const match=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());if(match)return Date.UTC(Number(match[3]),Number(match[2])-1,Number(match[1]));const parsed=Date.parse(value);return Number.isFinite(parsed)?parsed:0;}
function Metric({accent,icon,label,value,hint}:{accent:"red"|"blue"|"green"|"orange";icon:"media"|"check"|"image"|"upload";label:string;value:string;hint:string}){return <article className={`adminMetricCard is-${accent}`}><span className="adminMetricIcon"><AdminIcon name={icon} size={24}/></span><div className="adminMetricCopy"><span>{label}</span><strong>{value}</strong><small>{hint}</small></div></article>;}

export function MediaLibrary({ archiveAction, canArchive, canUpload, items, uploadAction }: { archiveAction:Action; canArchive:boolean; canUpload:boolean; items:MediaLibraryItem[]; uploadAction:Action }) {
  const [query,setQuery]=useState("");
  const [type,setType]=useState("all");
  const [status,setStatus]=useState("all");
  const [origin,setOrigin]=useState("all");
  const [sort,setSort]=useState<SortMode>("created-desc");
  const [page,setPage]=useState(1);
  const [pageSize,setPageSize]=useState<PageSize>(10);
  const [uploadOpen,setUploadOpen]=useState(false);
  const types=useMemo(()=>Array.from(new Set(items.map((item)=>typeLabel(item.mimeType)))).sort((a,b)=>a.localeCompare(b,"pt-BR")),[items]);
  const statuses=useMemo(()=>Array.from(new Set(items.map((item)=>item.status).filter(Boolean))).sort((a,b)=>statusLabel(a).localeCompare(statusLabel(b),"pt-BR")),[items]);
  const origins=useMemo(()=>Array.from(new Set(items.map((item)=>item.storageProvider||"Armazenamento"))).sort((a,b)=>a.localeCompare(b,"pt-BR")),[items]);
  const filtered=useMemo(()=>{
    const needle=query.trim().toLocaleLowerCase("pt-BR");
    const next=items.filter((item)=>
      (!needle||[item.originalFilename,item.url,item.altText,item.mimeType,item.storageProvider].join(" ").toLocaleLowerCase("pt-BR").includes(needle))
      &&(type==="all"||typeLabel(item.mimeType)===type)
      &&(status==="all"||item.status===status)
      &&(origin==="all"||(item.storageProvider||"Armazenamento")===origin)
    );
    return [...next].sort((a,b)=>{
      if(sort==="name-asc")return a.originalFilename.localeCompare(b.originalFilename,"pt-BR");
      if(sort==="name-desc")return b.originalFilename.localeCompare(a.originalFilename,"pt-BR");
      if(sort==="created-asc")return dateValue(a.createdAt)-dateValue(b.createdAt);
      return dateValue(b.createdAt)-dateValue(a.createdAt);
    });
  },[items,origin,query,sort,status,type]);
  const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize)); const safePage=Math.min(page,totalPages); const visible=filtered.slice((safePage-1)*pageSize,safePage*pageSize);
  const activeCount=items.filter((item)=>item.status==="active").length;
  const imageCount=items.filter((item)=>item.mimeType.startsWith("image/")).length;
  const totalBytes=items.reduce((sum,item)=>sum+Math.max(0,item.byteSize||0),0);
  const hasFilters=Boolean(query.trim()||type!=="all"||status!=="all"||origin!=="all"||sort!=="created-desc");
  const clearFilters=()=>{setQuery("");setType("all");setStatus("all");setOrigin("all");setSort("created-desc");setPage(1);};

  useEffect(()=>{setPage(1);},[origin,query,sort,status,type]);
  useEffect(()=>{if(!canUpload)return;const open=()=>setUploadOpen(true);window.addEventListener("admin:add-media",open);return()=>window.removeEventListener("admin:add-media",open);},[canUpload]);

  return <div className="adminDashboard" data-testid="media-manager">
    {!canUpload ? <div className="adminReadOnlyNotice" role="status">Biblioteca em modo de leitura para este acesso.</div> : null}
    <section className="adminMetricGrid" aria-label="Resumo da biblioteca de mídia">
      <Metric accent="red" icon="media" label="Arquivos" value={items.length.toLocaleString("pt-BR")} hint="total na biblioteca"/>
      <Metric accent="green" icon="check" label="Ativos" value={activeCount.toLocaleString("pt-BR")} hint="disponíveis para uso"/>
      <Metric accent="blue" icon="image" label="Imagens" value={imageCount.toLocaleString("pt-BR")} hint="arquivos de imagem"/>
      <Metric accent="orange" icon="upload" label="Armazenamento" value={formatSize(totalBytes)} hint="volume carregado"/>
    </section>

    <section className={styles.queryPanel} aria-label="Busca e filtros de mídias">
      <label className={styles.search}>
        <span className="srOnly">Buscar mídia</span><AdminIcon name="search" size={16}/>
        <input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Buscar por arquivo, URL ou texto alternativo..." type="search"/>
      </label>
      <div className={styles.queryControls}>
        <label><span className="srOnly">Tipo</span><select aria-label="Filtrar por tipo" value={type} onChange={(event)=>setType(event.target.value)}><option value="all">Todos os tipos</option>{types.map((value)=><option key={value} value={value}>{value}</option>)}</select></label>
        <label><span className="srOnly">Status</span><select aria-label="Filtrar por status" value={status} onChange={(event)=>setStatus(event.target.value)}><option value="all">Todos os status</option>{statuses.map((value)=><option key={value} value={value}>{statusLabel(value)}</option>)}</select></label>
        <label><span className="srOnly">Origem</span><select aria-label="Filtrar por origem" value={origin} onChange={(event)=>setOrigin(event.target.value)}><option value="all">Todas as origens</option>{origins.map((value)=><option key={value} value={value}>{value}</option>)}</select></label>
        <label><span className="srOnly">Ordenar por</span><select aria-label="Ordenar mídias" value={sort} onChange={(event)=>setSort(event.target.value as SortMode)}><option value="created-desc">Mais recentes</option><option value="created-asc">Mais antigas</option><option value="name-asc">Nome A–Z</option><option value="name-desc">Nome Z–A</option></select></label>
        {hasFilters?<button className={styles.queryReset} onClick={clearFilters} type="button"><AdminIcon name="x" size={13}/>Limpar</button>:null}
      </div>
    </section>

    <section className={styles.tableSurface} aria-label="Biblioteca de mídia">
      {filtered.length?<section className="table-card"><div className={styles.tableWrap}><table><thead><tr><th>Arquivo</th><th>Tipo</th><th>Tamanho</th><th>Adicionado em</th><th>Origem</th><th className={styles.actionsColumn}>Ações</th></tr></thead><tbody>{visible.map((item)=><tr key={item.id}><td><div className={`table-primary ${styles.fileIdentity}`}><span className={styles.fileIcon}><AdminIcon name="media" size={14}/></span><div><strong>{item.originalFilename||"Mídia sem nome"}</strong><small>{item.url}</small></div></div></td><td><span className={styles.typeBadge}>{typeLabel(item.mimeType)}</span></td><td>{formatSize(item.byteSize)}</td><td>{item.createdAt}</td><td>{item.storageProvider||"Armazenamento"}</td><td className={styles.actionsColumn}><div className={styles.rowActions}><Link aria-label={`Abrir ${item.originalFilename}`} href={item.url} rel="noopener noreferrer" target="_blank"><AdminIcon name="eye" size={15}/></Link>{canArchive&&item.status==="active"?<form action={archiveAction} onSubmit={(event)=>{if(!window.confirm(`Arquivar “${item.originalFilename}”?`))event.preventDefault();}}><input name="id" type="hidden" value={item.id}/><button aria-label={`Arquivar ${item.originalFilename}`} type="submit"><AdminIcon name="trash" size={15}/></button></form>:null}</div></td></tr>)}</tbody></table></div>
      <AdminPagination currentPage={safePage} endItem={filtered.length ? Math.min(safePage * pageSize, filtered.length) : 0} itemLabel={visible.length===1?"registro":"registros"} onPageChange={setPage} onPageSizeChange={(value)=>{setPageSize(value as PageSize);setPage(1);}} pageSize={pageSize} pageSizeOptions={[10,25,50]} startItem={filtered.length ? (safePage - 1) * pageSize + 1 : 0} totalItems={filtered.length} totalPages={totalPages}/></section>:<div className={`admin-empty ${styles.empty}`}><AdminIcon name={items.length?"search":"media"} size={28}/><strong>{items.length?"Nenhuma mídia encontrada":"Biblioteca vazia"}</strong><p>{items.length?"Ajuste a busca ou os filtros para voltar a exibir os arquivos.":"A biblioteca de mídia está vazia."}</p>{items.length&&hasFilters?<button className="adminButton" onClick={clearFilters} type="button">Limpar filtros</button>:null}</div>}
    </section>

    {canUpload&&uploadOpen?<AdminDialog description="Envie uma imagem para a biblioteca central usando o armazenamento configurado no projeto." footer={<><button className="adminButton" onClick={()=>setUploadOpen(false)} type="button">Cancelar</button><button className="adminPrimaryCompact" form="media-upload-form" type="submit"><AdminIcon name="upload" size={15}/>Enviar mídia</button></>} onClose={()=>setUploadOpen(false)} title="Adicionar mídia"><form action={uploadAction} className={styles.modalForm} id="media-upload-form" onSubmit={()=>setUploadOpen(false)}><label><span>Arquivo</span><input accept="image/*" name="file" required type="file"/><small>Selecione uma imagem válida para a biblioteca.</small></label><label><span>Texto alternativo</span><input maxLength={500} name="altText" placeholder="Descrição acessível da imagem ou arquivo" required/><small>Usado em acessibilidade e nos componentes públicos que exibem esta mídia.</small></label></form></AdminDialog>:null}
  </div>;
}
