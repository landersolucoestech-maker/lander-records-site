"use client";

import Link from "next/link";
import { useRef, useState } from "react";

type NavigationItem = { id: string; label: string; url: string; newTab: boolean };

function isExternal(url: string) {
  return /^https?:\/\//i.test(url);
}

export function MobileNavigation({ items }: { items: NavigationItem[] }) {
  const [open, setOpen] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);

  function closeMenu({ restoreFocus = false } = {}) {
    if (detailsRef.current) detailsRef.current.open = false;
    setOpen(false);
    if (restoreFocus) summaryRef.current?.focus();
  }

  return (
    <details className="mobileNav" ref={detailsRef} onToggle={(event) => setOpen(event.currentTarget.open)} onKeyDown={(event) => {
      if (event.key !== "Escape" || !open) return;
      event.preventDefault();
      closeMenu({ restoreFocus: true });
    }}>
      <summary ref={summaryRef} aria-expanded={open} aria-controls="mobile-navigation-menu" aria-label={open ? "Fechar menu de navegação" : "Abrir menu de navegação"}>
        <span>Menu</span><i aria-hidden="true" />
      </summary>
      <nav id="mobile-navigation-menu" aria-label="Navegação mobile" onClick={() => closeMenu()}>
        {items.map((item) => isExternal(item.url) ? (
          <a key={item.id} href={item.url} target={item.newTab ? "_blank" : undefined} rel={item.newTab ? "noreferrer" : undefined}>{item.label}</a>
        ) : <Link key={item.id} href={item.url}>{item.label}</Link>)}
        <Link className="mobileNavCta" href="/contato">Quero Contratar</Link>
      </nav>
    </details>
  );
}
