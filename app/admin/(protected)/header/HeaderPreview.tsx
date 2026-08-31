"use client";

import Image from "next/image";
import { useState } from "react";
import { AdminIcon } from "../../components/AdminIcon";
import styles from "./HeaderManager.module.css";

type PreviewItem = { id: string; label: string; url: string; newTab: boolean };
type Viewport = "desktop" | "tablet" | "mobile";

const viewportLabels: Array<[Viewport, string]> = [["desktop", "Desktop"], ["tablet", "Tablet"], ["mobile", "Mobile"]];

export function HeaderPreview({ brandName, ctaLabel, items, logoSrc }: { brandName: string; ctaLabel: string; items: PreviewItem[]; logoSrc: string }) {
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const compact = viewport !== "desktop";

  return <section aria-label="Prévia ilustrativa do cabeçalho" className={styles.previewPanel}>
    <div className={styles.previewHeading}><div><p>PRÉ-VISUALIZAÇÃO DO CABEÇALHO</p><h2>Estrutura pública conhecida</h2><span>Representação ilustrativa; o site público é a validação final.</span></div><div aria-label="Largura da prévia" className={styles.viewportControls} role="group">{viewportLabels.map(([value, label]) => <button aria-pressed={viewport === value} key={value} onClick={() => setViewport(value)} title={label} type="button"><AdminIcon name={value === "desktop" ? "home" : value === "tablet" ? "pages" : "menu"} size={17} /><span className="srOnly">{label}</span></button>)}</div></div>
    <div className={`${styles.previewCanvas} ${styles[viewport]}`} data-testid="header-preview-canvas" data-viewport={viewport}>
      <div className={styles.publicHeaderPreview}>
        <Image alt={brandName} height={46} src={logoSrc} unoptimized width={170} />
        {!compact ? <nav aria-label="Itens ilustrativos do menu principal">{items.map((item) => <span key={item.id}>{item.label}{item.newTab && /^https?:\/\//i.test(item.url) ? <small data-testid="header-external-indicator"> ↗</small> : null}</span>)}</nav> : null}
        <div className={styles.previewActions}>{compact ? <span aria-label="Menu mobile ilustrativo" className={styles.previewMenu}><i aria-hidden="true" /></span> : null}<span className={styles.previewCta}>{ctaLabel}</span></div>
      </div>
      <div className={styles.previewContext}><span>LANDER <b>RECORDS</b></span><p>O conteúdo abaixo é apenas contexto visual mínimo.</p></div>
    </div>
    <div className={styles.previewNotice}><AdminIcon name="pages" size={17} /><span>Esta é uma prévia ilustrativa. Consulte o site público para validar o resultado exato.</span><a href="/" rel="noopener noreferrer" target="_blank">Abrir site público <AdminIcon name="external" size={14} /><span className="srOnly"> (abre em nova aba)</span></a></div>
  </section>;
}
