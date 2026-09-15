import Link from "next/link";
import { AdminIcon, type IconName } from "./AdminIcon";

type Activity = { id: string; label: string; meta: string };
type Publication = { id: string; title: string; type: string; status: "draft" | "published" | "archived"; updatedAt: string };
type AnalyticsSeriesPoint = { label: string; visitors: number; views: number };
type DashboardAnalytics = {
  visitors: number;
  views: number;
  engagementRate: number;
  conversions: number;
  previousVisitorsChange?: number | null;
  previousViewsChange?: number | null;
  previousEngagementChange?: number | null;
  previousConversionsChange?: number | null;
  series?: AnalyticsSeriesPoint[];
  devices?: Array<{ label: "Desktop" | "Mobile" | "Tablet"; count: number; percentage: number }>;
};

type DashboardData = {
  artistDrafts?: number | null;
  postDrafts?: number | null;
  recentActivity: Activity[];
  recentPublications?: Publication[];
  analytics?: DashboardAnalytics | null;
};

type MetricCardProps = {
  accent: "red" | "blue" | "green" | "orange";
  change?: number | null;
  icon: IconName;
  label: string;
  suffix?: string;
  value?: number | null;
};

function formatInteger(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
}

function MetricCard({ accent, change, icon, label, suffix = "", value }: MetricCardProps) {
  const connected = typeof value === "number";
  return <article className={`adminMetricCard is-${accent}`}>
    <span className="adminMetricIcon"><AdminIcon name={icon} size={24} /></span>
    <div className="adminMetricCopy"><span>{label}</span><strong>{connected ? `${formatInteger(value)}${suffix}` : "—"}</strong>{connected && typeof change === "number" ? <small className={change >= 0 ? "isPositive" : "isNegative"}>{change >= 0 ? "↑" : "↓"} {Math.abs(change).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% <em>vs. período anterior</em></small> : <small>Analytics não conectado</small>}</div>
    <span className="adminMetricSpark" aria-hidden="true" />
  </article>;
}

function PanelHeading({ children, description, action }: { children: React.ReactNode; description?: string; action?: React.ReactNode }) {
  return <div className="adminAnalyticsPanelHeading"><div><h2>{children}</h2>{description ? <p>{description}</p> : null}</div>{action}</div>;
}

function AnalyticsEmpty({ message }: { message: string }) {
  return <div className="adminAnalyticsEmpty"><span className="adminAnalyticsEmptyIcon"><AdminIcon name="activity" size={22} /></span><strong>Analytics não conectado</strong><p>{message}</p></div>;
}

function statusLabel(status: Publication["status"]) {
  if (status === "published") return "Publicado";
  if (status === "draft") return "Rascunho";
  return "Arquivado";
}

export function DashboardView({ data, name, preview = false, readOnly = false, role = "viewer" }: { data: DashboardData; name: string; preview?: boolean; readOnly?: boolean; role?: "viewer" | "editor" | "admin" | "owner" }) {
  const analytics = data.analytics ?? null;
  const canEdit = !readOnly && role !== "viewer";
  const publications = data.recentPublications ?? [];

  return <div className="adminDashboard" data-testid="dashboard">
    {preview ? <div className="adminPreviewNotice">BACKEND_ENVIRONMENT_DEFERRED · estrutura visual sem leitura ou escrita no banco.</div> : null}

    <header className="adminDashboardHeading"><div><h1>{name ? `Olá, ${name}!` : "Olá!"}</h1><p>Aqui está o desempenho do seu site em tempo real e um resumo geral.</p></div></header>

    <section aria-label="Indicadores de performance digital" className="adminMetricGrid" data-testid="dashboard-metrics">
      <MetricCard accent="red" change={analytics?.previousVisitorsChange} icon="artists" label="Visitantes" value={analytics?.visitors} />
      <MetricCard accent="blue" change={analytics?.previousViewsChange} icon="search" label="Visualizações" value={analytics?.views} />
      <MetricCard accent="green" change={analytics?.previousEngagementChange} icon="activity" label="Taxa de engajamento" suffix="%" value={analytics?.engagementRate} />
      <MetricCard accent="orange" change={analytics?.previousConversionsChange} icon="pages" label="Leads / Conversões" value={analytics?.conversions} />
    </section>

    <div className="adminPerformanceGrid">
      <section className="adminDashboardPanel adminPerformancePanel" data-testid="site-performance">
        <PanelHeading description="Evolução de visitantes e visualizações ao longo do tempo." action={<select aria-label="Período de desempenho" className="adminPeriodSelect" defaultValue="30" disabled={!analytics}><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option></select>}>Desempenho do site</PanelHeading>
        {analytics?.series?.length ? <div className="adminSimpleChart" role="img" aria-label="Série temporal de visitantes e visualizações"><div className="adminChartLegend"><span><i className="visitors" />Visitantes</span><span><i className="views" />Visualizações</span></div><div className="adminChartBars">{analytics.series.map((point) => <div className="adminChartPoint" key={point.label} title={`${point.label}: ${point.visitors} visitantes, ${point.views} visualizações`}><span className="visitors" style={{ height: `${Math.max(8, Math.min(100, point.visitors))}%` }} /><span className="views" style={{ height: `${Math.max(8, Math.min(100, point.views))}%` }} /><small>{point.label}</small></div>)}</div></div> : <AnalyticsEmpty message="Conecte uma fonte elegível para acompanhar visitantes e visualizações por período." />}
      </section>

      <section className="adminDashboardPanel adminDevicesPanel" data-testid="device-breakdown">
        <PanelHeading description="Distribuição de visitantes por dispositivo.">Dispositivos</PanelHeading>
        {analytics?.devices?.length ? <div className="adminDeviceBreakdown"><div className="adminDeviceDonut" aria-label={`${formatInteger(analytics.visitors)} visitantes`} role="img"><strong>{formatInteger(analytics.visitors)}</strong><span>visitantes</span></div><div className="adminDeviceList">{analytics.devices.map((device) => <div key={device.label}><span>{device.label}</span><strong>{device.percentage.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</strong><small>{formatInteger(device.count)}</small></div>)}</div></div> : <AnalyticsEmpty message="A distribuição entre Desktop, Mobile e Tablet aparecerá quando houver analytics real." />}
      </section>
    </div>

    <div className="adminDashboardLowerGrid">
      <section className="adminDashboardPanel" data-testid="recent-activity">
        <PanelHeading description="Últimas ações realizadas no seu site." action={role === "admin" || role === "owner" ? <Link className="adminTextButton" href={preview ? "/cms-preview/audit" : "/admin/audit"}>Ver todas</Link> : undefined}>Atividades recentes</PanelHeading>
        {data.recentActivity.length ? <div className="adminActivityList">{data.recentActivity.slice(0, 4).map((item) => <div key={item.id}><span className="adminActivityIcon"><AdminIcon name="activity" size={17} /></span><span><b>{item.label}</b><small>{item.meta}</small></span></div>)}</div> : <div className="adminPanelEmpty">{preview ? "Atividades reais não são carregadas no preview." : "Nenhuma atividade registrada."}</div>}
      </section>

      <section className="adminDashboardPanel adminPublicationsPanel" data-testid="recent-publications">
        <PanelHeading description="Publicações mais recentes do seu site." action={canEdit ? <Link className="adminPrimaryCompact" href={preview ? "/cms-preview/posts" : "/admin/posts/new"}>+ Nova publicação</Link> : undefined}>Conteúdo &amp; Publicações</PanelHeading>
        {publications.length ? <div className="adminPublicationsTableWrap"><table className="adminPublicationsTable"><thead><tr><th>Título</th><th>Tipo</th><th>Status</th><th>Data</th><th><span className="srOnly">Ações</span></th></tr></thead><tbody>{publications.slice(0, 5).map((item) => <tr key={item.id}><td><strong>{item.title}</strong></td><td><span className="adminTypeBadge">{item.type}</span></td><td><span className={`adminPublicationStatus is-${item.status}`}>{statusLabel(item.status)}</span></td><td>{item.updatedAt}</td><td><Link aria-label={`Abrir ${item.title}`} href={preview ? "/cms-preview/posts" : `/admin/posts/${item.id}`}><AdminIcon name="chevron" size={15} /></Link></td></tr>)}</tbody></table></div> : <div className="adminPanelEmpty">{preview ? "Publicações reais não são carregadas no preview." : "Nenhuma publicação encontrada."}</div>}
      </section>
    </div>
  </div>;
}

export type { DashboardData };
