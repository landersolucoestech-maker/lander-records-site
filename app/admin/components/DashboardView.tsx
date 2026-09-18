import Image from "next/image";
import Link from "next/link";
import { AdminIcon, type IconName } from "./AdminIcon";

type Activity = {
  id: string;
  label: string;
  meta: string;
  when?: string;
  icon?: IconName;
  accent?: "red" | "neutral";
};

type Publication = {
  id: string;
  title: string;
  type: string;
  status: "draft" | "published" | "archived";
  updatedAt: string;
  thumbnail?: string;
  href?: string;
};

type AnalyticsSeriesPoint = { label: string; visitors: number; views: number };
type DashboardAnalytics = {
  visitors: number | null;
  views: number | null;
  engagementRate: number | null;
  conversions: number | null;
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

const referenceDashboard: DashboardData = {
  analytics: {
    visitors: 12842,
    views: 38421,
    engagementRate: 4.8,
    conversions: 284,
    previousVisitorsChange: 12.5,
    previousViewsChange: 18.3,
    previousEngagementChange: 0.9,
    previousConversionsChange: 22.1,
    series: [
      { label: "16 ago", visitors: 650, views: 390 },
      { label: "19 ago", visitors: 720, views: 405 },
      { label: "22 ago", visitors: 700, views: 390 },
      { label: "25 ago", visitors: 760, views: 420 },
      { label: "28 ago", visitors: 1120, views: 480 },
      { label: "31 ago", visitors: 1480, views: 520 },
      { label: "3 set", visitors: 1260, views: 500 },
      { label: "6 set", visitors: 1360, views: 535 },
      { label: "9 set", visitors: 1180, views: 490 },
      { label: "12 set", visitors: 1290, views: 525 },
      { label: "15 set", visitors: 930, views: 455 },
    ],
    devices: [
      { label: "Desktop", count: 6962, percentage: 54.2 },
      { label: "Mobile", count: 4971, percentage: 38.7 },
      { label: "Tablet", count: 909, percentage: 7.1 },
    ],
  },
  recentActivity: [
    { id: "demo-a1", label: "Nova notícia publicada", meta: "Lançamento: Lander Records no Primavera Sound 2026", when: "há 2h", icon: "document", accent: "red" },
    { id: "demo-a2", label: "Mídia enviada", meta: "Capa do single - DJ Stay", when: "há 5h", icon: "image", accent: "red" },
    { id: "demo-a3", label: "Novo artista cadastrado", meta: "DJ Stay", when: "há 1 dia", icon: "artists", accent: "red" },
    { id: "demo-a4", label: "Configuração atualizada", meta: "Informações da home", when: "há 1 dia", icon: "settings", accent: "neutral" },
  ],
  recentPublications: [
    { id: "demo-p1", title: "Lander Records no Primavera Sound 2026", type: "Notícia", status: "published", updatedAt: "15/09/2026, 14:32", thumbnail: "/lander-records-anuncie-banner.webp", href: "/admin/posts" },
    { id: "demo-p2", title: "DJ Stay – Novo single", type: "Artista", status: "published", updatedAt: "14/09/2026, 10:15", thumbnail: "/dj-stay-home-card.webp", href: "/admin/artists" },
    { id: "demo-p3", title: "sobre-nos", type: "Página", status: "published", updatedAt: "12/09/2026, 18:40", thumbnail: "/lander-records-logo.webp", href: "/admin/pages" },
    { id: "demo-p4", title: "Novo talento: Alana Ruiz", type: "Notícia", status: "published", updatedAt: "10/09/2026, 16:20", thumbnail: "/dj-stay-wide.webp", href: "/admin/posts" },
    { id: "demo-p5", title: "Galeria Primavera Sound", type: "Mídia", status: "published", updatedAt: "09/09/2026, 11:05", thumbnail: "/lander-records-anuncie-banner.webp", href: "/admin/media" },
  ],
};

const sparkPaths: Record<MetricCardProps["accent"], string> = {
  red: "M2 25 L14 18 L26 27 L38 20 L50 20 L62 12 L76 6",
  blue: "M2 22 L14 15 L26 27 L38 20 L50 20 L62 11 L76 6",
  green: "M2 20 L15 14 L27 25 L39 18 L50 19 L62 11 L76 6",
  orange: "M2 22 L15 15 L28 27 L40 20 L52 18 L64 10 L76 5",
};

function formatInteger(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
}

function formatMetric(value: number, suffix: string) {
  if (suffix === "%") return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  return `${formatInteger(value)}${suffix}`;
}

function MetricCard({ accent, change, icon, label, suffix = "", value }: MetricCardProps) {
  const connected = typeof value === "number";
  return <article className={`adminMetricCard is-${accent}`}>
    <span className="adminMetricIcon"><AdminIcon name={icon} size={25} /></span>
    <div className="adminMetricCopy">
      <span>{label}</span>
      <strong>{connected ? formatMetric(value, suffix) : "—"}</strong>
      {connected && typeof change === "number" ? <small className={change >= 0 ? "isPositive" : "isNegative"}><b>{change >= 0 ? "↑" : "↓"} {Math.abs(change).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</b><em>vs. período anterior</em></small> : <small>Analytics não conectado</small>}
    </div>
    <svg aria-hidden="true" className="adminMetricSpark" viewBox="0 0 78 36"><defs><linearGradient id={`spark-${accent}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".18" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs><path d={`${sparkPaths[accent]} L76 36 L2 36 Z`} fill={`url(#spark-${accent})`} stroke="none" /><path d={sparkPaths[accent]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
  </article>;
}

function PanelHeading({ children, description, action, icon }: { children: React.ReactNode; description?: string; action?: React.ReactNode; icon: IconName }) {
  return <div className="adminAnalyticsPanelHeading">
    <div className="adminPanelHeadingIdentity"><span className="adminPanelHeadingIcon"><AdminIcon name={icon} size={20} /></span><div><h2>{children}</h2>{description ? <p>{description}</p> : null}</div></div>
    {action}
  </div>;
}

function AnalyticsEmpty({ message }: { message: string }) {
  return <div className="adminAnalyticsEmpty"><span className="adminAnalyticsEmptyIcon"><AdminIcon name="activity" size={22} /></span><strong>Analytics não conectado</strong><p>{message}</p></div>;
}

function statusLabel(status: Publication["status"]) {
  if (status === "published") return "Publicado";
  if (status === "draft") return "Rascunho";
  return "Arquivado";
}

function linePoints(series: AnalyticsSeriesPoint[], key: "visitors" | "views") {
  const width = 760;
  const height = 166;
  const top = 8;
  const bottom = 12;
  const max = 2000;
  return series.map((point, index) => {
    const x = series.length === 1 ? width / 2 : index * (width / (series.length - 1));
    const y = top + (1 - Math.min(point[key], max) / max) * (height - top - bottom);
    return [x, y] as const;
  });
}

function smoothPath(points: ReadonlyArray<readonly [number, number]>) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;
  let path = `M ${points[0][0]} ${points[0][1]}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const midX = (current[0] + next[0]) / 2;
    path += ` C ${midX} ${current[1]}, ${midX} ${next[1]}, ${next[0]} ${next[1]}`;
  }
  return path;
}

function PerformanceChart({ analytics }: { analytics: DashboardAnalytics }) {
  const series = analytics.series ?? [];
  const visitors = linePoints(series, "visitors");
  const views = linePoints(series, "views");
  const visitorPath = smoothPath(visitors);
  const viewsPath = smoothPath(views);
  const areaPath = visitors.length ? `${visitorPath} L 760 166 L 0 166 Z` : "";
  return <div className="adminLineChart" role="img" aria-label="Evolução de visitantes e visualizações nos últimos 30 dias">
    <div className="adminLineChartPlot">
      <div className="adminChartYLabels"><span>2.000</span><span>1.500</span><span>1.000</span><span>500</span><span>0</span></div>
      <div className="adminLineChartCanvas">
        <svg aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 760 166">
          <defs><linearGradient id="dashboard-area-red" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#ef1c24" stopOpacity=".20" /><stop offset="1" stopColor="#ef1c24" stopOpacity=".02" /></linearGradient></defs>
          {[0, 41.5, 83, 124.5, 166].map((y) => <line key={y} x1="0" x2="760" y1={y} y2={y} className="adminChartGridLine" />)}
          {areaPath ? <path d={areaPath} fill="url(#dashboard-area-red)" /> : null}
          {viewsPath ? <path d={viewsPath} className="adminChartViewsLine" fill="none" /> : null}
          {visitorPath ? <path d={visitorPath} className="adminChartVisitorsLine" fill="none" /> : null}
        </svg>
        <div className="adminChartXAxis">{series.map((point) => <span key={point.label}>{point.label}</span>)}</div>
      </div>
    </div>
    <div className="adminChartLegend"><span><i className="visitors" />Visitantes</span><span><i className="views" />Visualizações</span></div>
  </div>;
}

function DeviceBreakdown({ analytics }: { analytics: DashboardAnalytics }) {
  const devices = analytics.devices ?? [];
  const desktop = devices.find((item) => item.label === "Desktop")?.percentage ?? 0;
  const mobile = devices.find((item) => item.label === "Mobile")?.percentage ?? 0;
  const firstStop = desktop;
  const secondStop = desktop + mobile;
  const visitors = analytics.visitors ?? devices.reduce((total, device) => total + device.count, 0);
  return <div className="adminDeviceBreakdown">
    <div className="adminDeviceDonut" aria-label={`${formatInteger(visitors)} visitantes`} role="img" style={{ background: `conic-gradient(#ee111b 0 ${firstStop}%, #252c34 ${firstStop}% ${secondStop}%, #d7dce2 ${secondStop}% 100%)` }}><strong>{formatInteger(visitors)}</strong><span>visitantes</span></div>
    <div className="adminDeviceList">{devices.map((device) => <div key={device.label}><span className={`adminDeviceName is-${device.label.toLowerCase()}`}><i />{device.label}</span><strong>{device.percentage.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</strong><small>{formatInteger(device.count)}</small></div>)}</div>
  </div>;
}

function typeClass(type: string) {
  const normalized = type.toLocaleLowerCase("pt-BR");
  if (normalized.includes("notícia")) return "news";
  if (normalized.includes("artista")) return "artist";
  if (normalized.includes("página")) return "page";
  return "media";
}

export function DashboardView({ data, demoMode = false, name, preview = false, readOnly = false, role = "viewer" }: { data: DashboardData; demoMode?: boolean; name: string; preview?: boolean; readOnly?: boolean; role?: "viewer" | "editor" | "admin" | "owner" }) {
  const dashboardData = demoMode ? referenceDashboard : data;
  const analytics = dashboardData.analytics ?? null;
  const dashboardSummary = analytics
    ? "Acompanhe os indicadores conectados do site e o resumo operacional."
    : "Resumo operacional do CMS. Métricas de audiência aparecem quando uma fonte de analytics do site estiver conectada.";
  const canEdit = !readOnly && role !== "viewer";
  const publications = dashboardData.recentPublications ?? [];
  const activities = dashboardData.recentActivity;
  const createHref = preview ? "/cms-preview/posts" : demoMode ? "/admin/posts" : "/admin/posts/new";

  return <div className="adminDashboard" data-testid="dashboard">
    {preview ? <div className="adminPreviewNotice">BACKEND_ENVIRONMENT_DEFERRED · estrutura visual sem leitura ou escrita no banco.</div> : null}

    <header className="adminDashboardHeading"><div><h1>{name ? `Olá, ${name}!` : "Olá!"}</h1><p>{dashboardSummary}</p></div></header>

    <section aria-label="Indicadores de performance digital" className="adminMetricGrid" data-testid="dashboard-metrics">
      <MetricCard accent="red" change={analytics?.previousVisitorsChange} icon="users" label="Visitantes" value={analytics?.visitors} />
      <MetricCard accent="blue" change={analytics?.previousViewsChange} icon="eye" label="Visualizações" value={analytics?.views} />
      <MetricCard accent="green" change={analytics?.previousEngagementChange} icon="chart" label="Taxa de engajamento" suffix="%" value={analytics?.engagementRate} />
      <MetricCard accent="orange" change={analytics?.previousConversionsChange} icon="target" label="Leads / Conversões" value={analytics?.conversions} />
    </section>

    <div className="adminPerformanceGrid">
      <section className="adminDashboardPanel adminPerformancePanel" data-testid="site-performance">
        <PanelHeading icon="chart" description="Evolução de visitantes e visualizações ao longo do tempo." action={<select aria-label="Período de desempenho" className="adminPeriodSelect" defaultValue="30" disabled={!analytics?.series?.length}><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option></select>}>Desempenho do site</PanelHeading>
        {analytics?.series?.length ? <PerformanceChart analytics={analytics} /> : <AnalyticsEmpty message="Conecte uma fonte elegível para acompanhar visitantes e visualizações por período." />}
      </section>

      <section className="adminDashboardPanel adminDevicesPanel" data-testid="device-breakdown">
        <PanelHeading icon="monitor" description="Distribuição de visitantes por dispositivo.">Dispositivos</PanelHeading>
        {analytics?.devices?.length ? <DeviceBreakdown analytics={analytics} /> : <AnalyticsEmpty message="A distribuição entre Desktop, Mobile e Tablet aparecerá quando houver analytics real." />}
      </section>
    </div>

    <div className="adminDashboardLowerGrid">
      <section className="adminDashboardPanel" data-testid="recent-activity">
        <PanelHeading icon="activity" description="Últimas ações realizadas no seu site." action={role === "admin" || role === "owner" ? <Link className="adminTextButton" href={preview ? "/cms-preview/audit" : "/admin/audit"}>Ver todas</Link> : undefined}>Atividades recentes</PanelHeading>
        {activities.length ? <div className="adminActivityList">{activities.slice(0, 4).map((item) => <div key={item.id}><span className={`adminActivityIcon is-${item.accent ?? "red"}`}><AdminIcon name={item.icon ?? "activity"} size={18} /></span><span className="adminActivityCopy"><b>{item.label}</b><small>{item.meta}</small></span>{item.when ? <time>{item.when}</time> : null}</div>)}</div> : <div className="adminPanelEmpty">{preview ? "Atividades reais não são carregadas no preview." : "Nenhuma atividade registrada."}</div>}
      </section>

      <section className="adminDashboardPanel adminPublicationsPanel" data-testid="recent-publications">
        <PanelHeading icon="document" description="Publicações mais recentes do seu site." action={canEdit || demoMode ? <Link className="adminPrimaryCompact" href={createHref}>+ <span>Nova publicação</span></Link> : undefined}>Conteúdo &amp; Publicações</PanelHeading>
        {publications.length ? <div className="adminPublicationsTableWrap"><table className="adminPublicationsTable"><thead><tr><th>Título</th><th>Tipo</th><th>Status</th><th>Data</th><th><span className="srOnly">Ações</span></th></tr></thead><tbody>{publications.slice(0, 5).map((item) => {
          const href = item.href ?? (preview ? "/cms-preview/posts" : `/admin/posts/${item.id}`);
          return <tr key={item.id}><td><div className="adminPublicationTitle">{item.thumbnail ? <Image alt="" height={28} src={item.thumbnail} unoptimized width={42} /> : <span className="adminPublicationThumbFallback" />}<strong>{item.title}</strong></div></td><td><span className={`adminTypeBadge is-${typeClass(item.type)}`}>{item.type}</span></td><td><span className={`adminPublicationStatus is-${item.status}`}><i />{statusLabel(item.status)}</span></td><td>{item.updatedAt}</td><td><Link aria-label={`Abrir ${item.title}`} href={href}><AdminIcon name="more" size={17} /></Link></td></tr>;
        })}</tbody></table></div> : <div className="adminPanelEmpty">{preview ? "Publicações reais não são carregadas no preview." : "Nenhuma publicação encontrada."}</div>}
      </section>
    </div>
  </div>;
}

export type { DashboardData };
