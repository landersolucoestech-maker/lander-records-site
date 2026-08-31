import Link from "next/link";
import { AdminIcon, type IconName } from "./AdminIcon";

type Activity = { id: string; label: string; meta: string };
type DashboardData = {
  artistDrafts: number | null;
  artistPublished?: number | null;
  artistTotal?: number | null;
  activePages?: number | null;
  postPublished?: number | null;
  postDrafts: number | null;
  recentActivity: Activity[];
};

const quickActions: Array<[string, string, string, IconName]> = [
  ["Nova notícia", "Criar publicação", "/admin/posts/new", "posts"],
  ["Novo artista", "Adicionar artista", "/admin/artists/new", "artists"],
  ["Nova página", "Criar página", "/admin/pages/new", "pages"],
  ["Enviar mídia", "Upload de arquivos", "/admin/media", "media"],
  ["Editar Home", "Gerenciar seções", "/admin/pages", "home"],
];

const homeSections: Array<[string, string, "edit" | "auto"]> = [
  ["Hero", "Conteúdo principal", "edit"], ["Sobre Nós", "Página institucional", "edit"], ["Redes Sociais", "Configurações sociais", "auto"], ["Ações", "Itens configurados", "edit"], ["Artistas em destaque", "Seleção editorial", "edit"], ["Anuncie Aqui", "Banner institucional", "edit"], ["Últimos Lançamentos", "Fonte: Spotify", "auto"], ["Últimas Notícias", "Fonte editorial", "edit"],
];

function route(href: string, preview: boolean) {
  if (!preview) return href;
  if (href.includes("artists")) return "/cms-preview/artists";
  if (href.includes("posts")) return "/cms-preview/posts";
  if (href.includes("media")) return "/cms-preview/media";
  if (href.includes("pages")) return "/cms-preview/pages";
  return "/cms-preview/dashboard";
}

function PanelHeader({ action, children, href, preview }: { action?: string; children: React.ReactNode; href?: string; preview: boolean }) {
  return <div className="adminPanelHeader"><h2>{children}</h2>{action && href ? <Link className="adminTextButton" href={route(href, preview)}>{action}</Link> : null}</div>;
}

export function DashboardView({ data, name, preview = false, role = "viewer" }: { data: DashboardData; name: string; preview?: boolean; role?: "viewer" | "editor" | "admin" | "owner" }) {
  const canEdit = role !== "viewer";
  const today = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(new Date());
  const pending = [
    [data.postDrafts, "Notícias em rascunho", "Aguardando publicação", "/admin/posts", "posts" as IconName],
    [data.artistDrafts, "Artistas não publicados", "Aguardando publicação", "/admin/artists", "artists" as IconName],
  ] as const;

  return <div className="adminDashboard" data-testid="dashboard">
    {preview ? <div className="adminPreviewNotice">BACKEND_ENVIRONMENT_DEFERRED · estrutura visual sem leitura ou escrita no banco.</div> : null}
    <header className="adminDashboardHeading"><div><h1>{name ? `Olá, ${name}!` : "Olá!"}</h1><p>Aqui está o resumo do que acontece no seu site.</p></div><span className="adminDate" suppressHydrationWarning><AdminIcon name="calendar" size={16} />{today}</span></header>

    <section aria-labelledby="quick-actions-title" className="adminDashboardSection" data-testid="dashboard-quick-actions">
      <h2 id="quick-actions-title">Ações rápidas</h2>
      {canEdit ? <div className="adminQuickGrid">{quickActions.map(([title, detail, href, icon]) => <Link className="adminQuickAction" href={route(href, preview)} key={title}><AdminIcon name={icon} size={27} /><span><strong>{title}</strong><small>{detail}</small></span></Link>)}</div> : <div className="adminInlineEmpty">Seu perfil possui acesso de leitura. Ações de criação não estão disponíveis.</div>}
    </section>

    <div className="adminDashboardPrimaryGrid">
      <section className="adminDashboardPanel" data-testid="editorial-pending"><PanelHeader action="Ver todas" href="/admin/posts" preview={preview}>Pendências editoriais</PanelHeader><div className="adminPanelList">
        {pending.map(([count, title, detail, href, icon]) => <Link className="adminPendingItem" href={route(href, preview)} key={title}><AdminIcon name={icon} /><strong>{count ?? "—"}</strong><span><b>{title}</b><small>{count === null ? "Dados não consultados no preview" : detail}</small></span><AdminIcon name="chevron" size={15} /></Link>)}
        <div className="adminPendingItem isUnavailable"><AdminIcon name="pages" /><strong>—</strong><span><b>Páginas sem SEO completo</b><small>Indicador ainda não disponível</small></span></div>
        <div className="adminPendingItem isUnavailable"><AdminIcon name="media" /><strong>—</strong><span><b>Mídias sem texto alternativo</b><small>Indicador ainda não disponível</small></span></div>
      </div></section>

      <section className="adminDashboardPanel" data-testid="home-status"><PanelHeader action="Editar Home" href="/admin/pages" preview={preview}>Status do conteúdo da Home</PanelHeader><div className="adminHomeList">{homeSections.map(([title, detail, kind]) => <Link href={route("/admin/pages", preview)} key={title}><span className="adminHomeIcon"><AdminIcon name={kind === "auto" ? "integration" : "home"} size={16} /></span><span><b>{title}</b><small>{detail}</small></span><span className={`adminStatusBadge ${kind}`}>{kind === "auto" ? "Automático" : "Editável"}</span><AdminIcon name="chevron" size={14} /></Link>)}</div></section>

      <section className="adminDashboardPanel" data-testid="content-integrations"><PanelHeader action="Ver todas" href="/admin/settings/lander-records" preview={preview}>Integrações de conteúdo</PanelHeader><div className="adminIntegrationList">
        <Link href={route("/admin/settings/lander-records", preview)}><span className="adminIntegrationMark spotify">S</span><span><b>Spotify</b><small>Últimos lançamentos</small><em>Status não consultado</em></span><span className="adminStatusBadge neutral">Não consultado</span></Link>
        <Link href={route("/admin/settings/lander-records", preview)}><span className="adminIntegrationMark soundcharts">S</span><span><b>Soundcharts</b><small>Métricas dos artistas</small><em>Status não consultado</em></span><span className="adminStatusBadge neutral">Não consultado</span></Link>
      </div><div className="adminInfoNote"><span>i</span>Últimos lançamentos e métricas sociais são alimentados pelas integrações configuradas.</div></section>
    </div>

    <div className="adminDashboardSecondaryGrid">
      <section className="adminDashboardPanel" data-testid="recent-activity"><PanelHeader action={role === "admin" || role === "owner" ? "Ver todas" : undefined} href="/admin/audit" preview={preview}>Atividade recente</PanelHeader>{data.recentActivity.length ? <div className="adminActivityList">{data.recentActivity.slice(0, 5).map((item) => <div key={item.id}><span className="adminActivityIcon"><AdminIcon name="activity" size={17} /></span><span><b>{item.label}</b><small>{item.meta}</small></span></div>)}</div> : <div className="adminPanelEmpty">{preview ? "Atividades reais não são carregadas no preview." : "Nenhuma atividade registrada."}</div>}</section>
      <section className="adminDashboardPanel" data-testid="useful-links"><PanelHeader preview={preview}>Links úteis</PanelHeader><div className="adminUsefulLinks">{[["Visualizar site público", "/"], ["Ver Home", "/"], ["Ver Artistas", "/artistas/"], ["Ver Notícias", "/noticias/"], ["Ver Contato", "/contato/"]].map(([label, href]) => <Link href={href} key={label} target="_blank"><AdminIcon name="chevron" size={14} /><span>{label}</span><AdminIcon name="external" size={15} /><span className="srOnly"> (abre em nova aba)</span></Link>)}</div></section>
    </div>
  </div>;
}

export type { DashboardData };
