import Image from "next/image";
import Link from "next/link";
import { AdminIcon, type IconName } from "../../components/AdminIcon";
import { HeaderPreview } from "./HeaderPreview";
import styles from "./HeaderManager.module.css";

export type HeaderManagerData = {
  brandName: string;
  ctaLabel: string;
  ctaUrl: string;
  globalLogoUrl: string;
  primaryItems: Array<{ id: string; label: string; url: string; newTab: boolean }>;
  publicLogoSrc: string;
};

export function HeaderManagerView({ data, preview = false, viewer = false }: { data: HeaderManagerData; preview?: boolean; viewer?: boolean }) {
  const moduleHref = (path: string) => preview ? `/cms-preview/${path.split("/").filter(Boolean).at(-1)}` : path;
  const metrics: Array<[IconName, string, string, string]> = [
    ["media", "Logo do Header", "Asset estrutural", data.publicLogoSrc],
    ["external", "CTA principal", "Definido no frontend", `Destino ${data.ctaUrl}`],
    ["navigation", "Menu principal", "primary", `${data.primaryItems.length} itens raiz habilitados`],
    ["menu", "Menu mobile", "Automático", "Ativo abaixo de 980 px"],
    ["pages", "Comportamento", "Fixo no topo", "Estrutural no Design System"],
  ];

  return <div className={styles.manager} data-testid="header-manager">
    {preview ? <div className="adminPreviewNotice">BACKEND_ENVIRONMENT_DEFERRED · dados isolados, sem mutations ou persistência.</div> : null}
    <header className={styles.header}><div><p>Cabeçalho / Visão geral</p><h1>Cabeçalho</h1><span>Consulte as fontes reais que compõem o Header global e valide seu comportamento responsivo.</span></div>{viewer ? <span className={styles.readOnly}>Somente leitura</span> : null}</header>
    <section aria-label="Resumo do cabeçalho" className={styles.metrics}>{metrics.map(([icon, label, value, detail]) => <article data-testid="header-metric-card" key={label}><span className={styles.metricIcon}><AdminIcon name={icon} /></span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>)}</section>
    <div className={styles.workspace}>
      <section aria-label="Fontes do cabeçalho" className={styles.sources}>
        <div className={styles.sourceHeading}><p>GERAL</p><h2>Fontes oficiais</h2><span>Somente conteúdo com contrato real é apresentado como administrável.</span></div>
        <article className={styles.sourceBlock}><div><h3>Logo pública</h3><p>O Header usa diretamente o asset estrutural abaixo.</p></div><div className={styles.logoPreview}><Image alt={data.brandName} height={46} src={data.publicLogoSrc} unoptimized width={170} /></div><dl><div><dt>Asset utilizado</dt><dd>{data.publicLogoSrc}</dd></div><div><dt>Logo global do CMS</dt><dd>{data.globalLogoUrl ? "Configurada, mas ainda não consumida pelo Header" : "Sem mídia selecionada; fallback estático"}</dd></div></dl><p className={styles.deferred}>PUBLIC HEADER LOGO CONSUMPTION — FRONTEND DEFERRED</p><Link className="adminButton" href={moduleHref("/admin/settings")}>Abrir configurações globais</Link></article>
        <article className={styles.sourceBlock}><div><h3>Call to action (CTA)</h3><p>Desktop e mobile repetem o mesmo conteúdo estrutural.</p></div><dl><div><dt>Texto</dt><dd>{data.ctaLabel}</dd></div><div><dt>Destino</dt><dd>{data.ctaUrl}</dd></div><div><dt>Persistência</dt><dd>Não existe no modelo atual</dd></div></dl><p className={styles.deferred}>HEADER CTA CONFIGURATION — BACKEND DEFERRED</p></article>
        <article className={styles.sourceBlock}><div><h3>Menu principal</h3><p>Itens, ordem e disponibilidade pertencem ao módulo Navegação.</p></div><dl><div><dt>Chave</dt><dd>primary</dd></div><div><dt>Itens raiz ativos</dt><dd>{data.primaryItems.length}</dd></div><div><dt>Submenus públicos</dt><dd>Não renderizados</dd></div></dl><Link className="adminButton" href={moduleHref("/admin/navigation")}>Gerenciar Navegação <AdminIcon name="external" size={14} /></Link></article>
      </section>
      <HeaderPreview brandName={data.brandName} ctaLabel={data.ctaLabel} items={data.primaryItems} logoSrc={data.publicLogoSrc} />
    </div>
    <section aria-label="Orientações do cabeçalho" className={styles.guidance}><article><AdminIcon name="pages" /><div><h2>Sobre o cabeçalho</h2><p>Ele é exibido globalmente nas páginas públicas e permanece fixo no topo.</p></div></article><article><AdminIcon name="navigation" /><div><h2>Navegação automática</h2><p>O menu primary fornece os mesmos itens raiz ao desktop e ao mobile.</p></div></article><article><AdminIcon name="settings" /><div><h2>Design protegido</h2><p>Cores, altura, breakpoints, tamanho da logo e estilo do CTA continuam estruturais.</p></div></article></section>
  </div>;
}
