import styles from "./NewsManager.module.css";

export default function PostsLoading() {
  return <div className={styles.manager} aria-busy="true" aria-live="polite"><header className={styles.header}><div><p>Notícias / Visão geral</p><h1>Notícias</h1><span>Carregando o workspace editorial…</span></div></header><section className={styles.metrics} aria-hidden="true">{Array.from({ length: 4 }, (_, index) => <article key={index}><span className={styles.metricIcon} /><div><small>Carregando</small><strong>—</strong></div></article>)}</section><section className={styles.catalog}><div className={styles.empty}>Carregando notícias, categorias, tags e imagens…</div></section></div>;
}
