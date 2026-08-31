import { AdminIcon } from "../../components/AdminIcon";
import styles from "./NavigationManager.module.css";

export default function LoadingNavigation() {
  return <div aria-busy="true" aria-live="polite" className={styles.manager}>
    <header className={styles.header}><div><p>Navegação / Visão geral</p><h1>Navegação</h1><span>Carregando estrutura dos menus...</span></div></header>
    <section aria-label="Carregando resumo da navegação" className={styles.metrics}>{["Total de itens", "Ativos", "Inativos", "Links externos"].map((label) => <article key={label}><span className={styles.metricIcon}><AdminIcon name="navigation" /></span><div><small>{label}</small><strong>—</strong><p>Carregando</p></div></article>)}</section>
    <section className={styles.catalog}><div className={styles.toolbar}><span>Carregando filtros...</span></div><div className={styles.empty}>Carregando itens de navegação...</div></section>
  </div>;
}
