"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminShell } from "../admin/components/AdminShell";
import { DashboardView } from "../admin/components/DashboardView";
import { createPreviewHomeSections, HomeManagerView } from "../admin/components/HomeManagerView";
import ArtistManager, { type ArtistSummary } from "../admin/(protected)/artists/ArtistManager";
import PostManager, { type PostSummary } from "../admin/(protected)/posts/PostManager";

type PreviewState = "filled" | "empty" | "loading" | "error";

const modules = [
  ["dashboard", "Dashboard"],
  ["home", "Home"],
  ["artists", "Artistas"],
  ["posts", "Notícias / Posts"],
  ["pages", "Páginas & Seções"],
  ["media", "Biblioteca de mídia"],
  ["releases", "Lançamentos"],
  ["categories", "Categorias"],
  ["tags", "Tags"],
  ["navigation", "Menus"],
  ["settings", "Configurações do site"],
  ["integrations", "Integrações"],
  ["users", "Usuários & Roles"],
  ["audit", "Auditoria"],
] as const;

const rows: Record<string, Array<[string, string, string]>> = {
  artists: [["DJ Stay", "Publicado", "Eletrônica"], ["Lander", "Rascunho", "Produtor"], ["Aurora", "Inativo", "Pop"]],
  pages: [["Home", "Ativa", "8 seções"], ["Sobre nós", "Ativa", "5 seções"], ["Contato", "Ativa", "3 seções"]],
  media: [["artist-card.webp", "Ativo", "1200 × 1200"], ["news-cover.webp", "Ativo", "1600 × 900"], ["hero-banner.webp", "Arquivado", "1920 × 800"]],
  releases: [["Noite Inteira", "Ativo", "Single"], ["Horizonte", "Rascunho", "EP"], ["Ao Vivo", "Ativo", "Álbum"]],
  categories: [["Eletrônica", "Ativa", "Artistas"], ["Notícias", "Ativa", "Posts"], ["Agenda", "Ativa", "Posts"]],
  tags: [["Bastidores", "Ativa", "3 posts"], ["Eventos", "Ativa", "8 posts"], ["Lançamentos", "Ativa", "5 posts"]],
  navigation: [["Início", "Ativo", "Principal"], ["Artistas", "Ativo", "Principal"], ["Contato", "Ativo", "Footer"]],
  users: [["Equipe editorial", "Ativo", "Editor"], ["Administrador local", "Ativo", "Admin"], ["Leitura", "Ativo", "Viewer"]],
  audit: [["Conteúdo atualizado", "Sucesso", "page_section"], ["Artista publicado", "Sucesso", "artist"], ["Login administrativo", "Sucesso", "admin_user"]],
};

const previewArtists: ArtistSummary[] = [
  { id: "preview-1", name: "Artista Aurora", slug: "artista-aurora", status: "published", cardImage: "", genres: ["Eletrônica"], homePosition: 1, isPubliclyVisible: true, updatedAt: "Não consultado" },
  { id: "preview-2", name: "Coletivo Horizonte", slug: "coletivo-horizonte", status: "published", cardImage: "", genres: ["Hip Hop", "Rap"], homePosition: 2, isPubliclyVisible: true, updatedAt: "Não consultado" },
  { id: "preview-3", name: "Projeto Norte", slug: "projeto-norte", status: "draft", cardImage: "", genres: ["Pop"], isPubliclyVisible: false, updatedAt: "Não consultado" },
  { id: "preview-4", name: "Trio Atlântico", slug: "trio-atlantico", status: "inactive", cardImage: "", genres: ["MPB"], isPubliclyVisible: false, updatedAt: "Não consultado" },
];

const previewPosts: PostSummary[] = [
  { id: "news-preview-1", title: "Novidades da Lander Records", slug: "novidades-lander-records", excerpt: "Conteúdo editorial demonstrativo para validar a composição da listagem.", status: "published", category: "Notícias", authorName: "Equipe editorial", publishedAt: "Não consultado", coverImage: "", featuredOnHome: true, tags: ["Destaque"], isPubliclyVisible: true, updatedAt: "Não consultado" },
  { id: "news-preview-2", title: "Bastidores do estúdio", slug: "bastidores-do-estudio", excerpt: "Exemplo isolado de uma notícia em elaboração.", status: "draft", category: "Editorial", authorName: "Equipe editorial", publishedAt: "", coverImage: "", featuredOnHome: false, tags: ["Bastidores"], isPubliclyVisible: false, updatedAt: "Não consultado" },
  { id: "news-preview-3", title: "Agenda cultural da semana", slug: "agenda-cultural", excerpt: "Exemplo de conteúdo publicado fora do destaque da Home.", status: "published", category: "Agenda", authorName: "Redação", publishedAt: "Não consultado", coverImage: "", featuredOnHome: false, tags: ["Eventos"], isPubliclyVisible: true, updatedAt: "Não consultado" },
  { id: "news-preview-4", title: "Comunicado anterior", slug: "comunicado-anterior", excerpt: "Registro arquivado representado somente no preview visual.", status: "archived", category: "Comunicados", authorName: "Redação", publishedAt: "", coverImage: "", featuredOnHome: false, tags: [], isPubliclyVisible: false, updatedAt: "Não consultado" },
];

function badgeClass(status: string) {
  if (/publicado|ativa|ativo|sucesso|novo/i.test(status)) return "live";
  if (/rascunho|agendado|atendimento/i.test(status)) return "draft";
  return "archived";
}

function StateBody({ section, state }: { section: string; state: PreviewState }) {
  if (state === "loading") return <div className="adminEmpty" aria-busy="true">Carregando dados de demonstração...</div>;
  if (state === "error") return <div className="adminAlert error" role="alert">Falha simulada. Nenhuma operação real foi executada.</div>;
  if (state === "empty") return <div className="adminEmpty">Nenhum item neste estado de demonstração.</div>;

  if (section === "dashboard") {
    return <>
      <div className="adminMetricGrid">
        {[["Artistas", "12"], ["Notícias publicadas", "28"], ["Rascunhos", "4"], ["Páginas ativas", "7"]].map(([label, value]) => <div className="adminMetricCard" key={label}><span>{label}</span><strong>{value}</strong><small>Dados visuais de demonstração</small></div>)}
      </div>
      <section className="adminPanel adminStack"><h2>Atividades recentes</h2>{rows.audit.map(([title, status, kind]) => <div className="adminSectionCard" key={title}><strong>{title}</strong><span>{kind} · <span className={`adminBadge ${badgeClass(status)}`}>{status}</span></span></div>)}</section>
    </>;
  }

  if (section === "settings" || section === "integrations") {
    return <section className="adminPanel"><h2>Identidade e integrações</h2><div className="adminForm"><div className="adminFormGrid"><label>Nome da marca<input defaultValue="Lander Records" readOnly /></label><label>E-mail de contato<input defaultValue="contato@exemplo.local" readOnly /></label><label>Spotify<input defaultValue="Não conectado no preview" readOnly /></label><label>Soundcharts<input defaultValue="Não conectado no preview" readOnly /></label></div><button className="adminButton primary" type="button" disabled>Salvar indisponível no preview</button></div></section>;
  }

  const data = rows[section] || [];
  return <section className="adminPanel"><table className="adminTable"><thead><tr><th>Item</th><th>Status</th><th>Detalhe</th><th>Ações</th></tr></thead><tbody>{data.map(([title, status, detail]) => <tr key={title}><td><strong>{title}</strong></td><td><span className={`adminBadge ${badgeClass(status)}`}>{status}</span></td><td>{detail}</td><td><button className="adminButton" type="button" disabled>Visualizar</button> <button className="adminButton" type="button" disabled>Editar visual</button></td></tr>)}</tbody></table></section>;
}

export function AdminPreview({ section }: { section: string }) {
  const validSection = modules.some(([key]) => key === section) ? section : "dashboard";
  const [state, setState] = useState<PreviewState>("filled");
  const title = modules.find(([key]) => key === validSection)?.[1] || "Dashboard";

  return <div className="adminPreviewShell" data-preview-only="true"><AdminShell email="preview local" footerAction={<Link href="/admin/login">Abrir login real protegido</Link>} name="Administrador" preview role="owner">
    {validSection === "dashboard" ? <DashboardView data={{ artistDrafts: null, postDrafts: null, recentActivity: [] }} name="Administrador" preview role="owner" /> : validSection === "home" ? <HomeManagerView preview sections={createPreviewHomeSections()} /> : validSection === "artists" ? <ArtistManager artists={previewArtists} preview /> : validSection === "posts" ? <PostManager posts={previewPosts} preview /> : <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">CMS FRONTEND PREVIEW</p><h1>{title}</h1><p>Protótipo visual isolado. Dados de demonstração e ações sem persistência.</p></div><div className="adminActions"><label className="adminPreviewState">Estado visual<select value={state} onChange={(event) => setState(event.target.value as PreviewState)}><option value="filled">Preenchido</option><option value="empty">Vazio</option><option value="loading">Loading</option><option value="error">Erro</option></select></label></div></header>
      <div className="adminAlert">BACKEND_ENVIRONMENT_DEFERRED · nenhuma chamada de API ou banco é feita por esta interface.</div><StateBody section={validSection} state={state} />
    </div>}
  </AdminShell></div>;
}
