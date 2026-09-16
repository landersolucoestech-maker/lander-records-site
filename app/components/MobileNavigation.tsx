"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { trustedPublicLink } from "@/lib/public-link";

type NavigationItem = { id: string; label: string; url: string; newTab: boolean };

function MobileNavigationLink({ item }: { item: NavigationItem }) {
  const resolved = trustedPublicLink(item.url);
  if (!resolved) return <span aria-disabled="true">{item.label}</span>;
  if (resolved.external) {
    return <a href={resolved.href} target={item.newTab ? "_blank" : undefined} rel={item.newTab ? "noreferrer" : undefined}>{item.label}</a>;
  }
  return <Link href={resolved.href}>{item.label}</Link>;
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
        {items.map((item) => <MobileNavigationLink item={item} key={item.id} />)}
        <Link className="mobileNavCta" href="/contato">Quero Contratar</Link>
      </nav>
    </details>
  );
}
