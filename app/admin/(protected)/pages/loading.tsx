import styles from "./PagesManager.module.css";

export default function PagesLoading() {
  return <div aria-busy="true" aria-live="polite" className={styles.manager}>
    <header className={styles.header}><div><p>Páginas / Visão geral</p><h1>Páginas</h1><span>Carregando páginas e conteúdos estruturais...</span></div></header>
    <section aria-label="Carregando resumo das páginas" className={styles.metrics}>{Array.from({ length: 4 }, (_, index) => <article key={index}><span className={styles.metricIcon} /><div><small>Carregando</small><strong>—</strong><p>Aguarde</p></div></article>)}</section>
    <section className={styles.catalog}><div className={styles.toolbar}><span>Carregando filtros...</span></div><div className={styles.empty}>Carregando páginas administráveis...</div></section>
  </div>;
}
