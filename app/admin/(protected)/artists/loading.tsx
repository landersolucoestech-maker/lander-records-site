import styles from "./ArtistManager.module.css";

export default function ArtistsLoading() {
  return <div className={styles.manager} aria-busy="true" aria-live="polite"><header className={styles.header}><div><p>Artistas / Visão geral</p><h1>Artistas</h1><span>Carregando o catálogo editorial…</span></div></header><section className={styles.metrics} aria-hidden="true">{Array.from({ length: 4 }, (_, index) => <article key={index}><span className={styles.metricIcon} /><div><small>Carregando</small><strong>—</strong></div></article>)}</section><section className={styles.catalog}><div className={styles.empty}>Carregando artistas, gêneros e posições da Home…</div></section></div>;
}
