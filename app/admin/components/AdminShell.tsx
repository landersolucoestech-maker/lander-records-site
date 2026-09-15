"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AdminIcon } from "./AdminIcon";
import { resolveAdminLocation, visibleAdminNavigation, type AdminRole } from "./admin-navigation";

type ShellProps = {
  children: React.ReactNode;
  email?: string;
  footerAction?: React.ReactNode;
  name: string;
  preview?: boolean;
  role?: AdminRole;
  sessionSource?: "session" | "development-auth-bypass";
};

const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]';

export function AdminShell({ children, email, footerAction, name, preview = false, role = "viewer", sessionSource = "session" }: ShellProps) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const location = resolveAdminLocation(pathname, role, preview);
  const readOnly = preview || sessionSource !== "session";
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "LR";

  useEffect(() => {
    if (!open) return;
    const sidebar = sidebarRef.current;
    const workspace = workspaceRef.current;
    const toggle = toggleRef.current;
    if (!sidebar || !workspace) return;
    const media = window.matchMedia("(max-width: 900px)");
    if (!media.matches) return;
    const previousOverflow = document.body.style.overflow;
    workspace.inert = true;
    document.body.style.overflow = "hidden";
    sidebar.setAttribute("role", "dialog");
    sidebar.setAttribute("aria-modal", "true");
    sidebar.setAttribute("aria-label", "Navegação administrativa");
    const targets = () => Array.from(sidebar.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) => element.getClientRects().length);
    (targets()[0] || sidebar).focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
      if (event.key !== "Tab") return;
      const elements = targets();
      const first = elements[0];
      const last = elements.at(-1);
      if (!first || !last) { event.preventDefault(); sidebar.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === sidebar)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !sidebar.contains(event.target)) (targets()[0] || sidebar).focus();
    };
    const resize = () => { if (!media.matches) setOpen(false); };
    document.addEventListener("keydown", keydown);
    document.addEventListener("focusin", containFocus);
    media.addEventListener("change", resize);
    return () => {
      workspace.inert = false;
      document.body.style.overflow = previousOverflow;
      sidebar.removeAttribute("role");
      sidebar.removeAttribute("aria-modal");
      sidebar.removeAttribute("aria-label");
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("focusin", containFocus);
      media.removeEventListener("change", resize);
      if (media.matches) toggle?.focus();
    };
  }, [open]);

  return <div className={`adminShell${open ? " sidebarOpen" : ""}`} data-testid="admin-shell" data-session-source={preview ? "preview" : sessionSource}>
    <button aria-label="Fechar menu pela sobreposição" className="adminSidebarBackdrop" onClick={() => setOpen(false)} tabIndex={-1} type="button" />
    <aside className="adminSidebar" data-testid="admin-sidebar" id="admin-sidebar" ref={sidebarRef} tabIndex={-1}>
      <div className="adminBrandBlock">
        <Image alt="Lander Records" className="adminBrandLogo" height={68} priority src="/lander-records-brand.svg" unoptimized width={168} />
        <span>Portal editorial</span>
        <button aria-label="Fechar menu" className="adminDrawerClose" onClick={() => setOpen(false)} type="button"><AdminIcon name="x" /></button>
      </div>
      {readOnly ? <div className="adminPreviewBadge">{preview ? "Preview local" : "Desenvolvimento"} · somente leitura</div> : null}
      <nav aria-label="Painel administrativo">
        {visibleAdminNavigation(role).map((group) => <div className="adminNavGroup" key={group.label}>
          <span className="adminNavLabel">{group.label}</span>
          {group.items.map((item) => {
            const href = preview ? item.previewHref : item.href;
            return <Link aria-current={location.activeHref === href ? "page" : undefined} href={href} key={item.href} onClick={() => setOpen(false)}><AdminIcon name={item.icon} size={18} /><span>{item.label}</span></Link>;
          })}
        </div>)}
      </nav>
      <div className="adminSidebarFooter">
        <div className="adminUserSummary"><span className="adminAvatar">{initials}</span><span><strong>{name}</strong><small>{readOnly ? "Acesso de leitura" : email || role}</small></span></div>
        {footerAction}
        <Link href="/" rel="noopener noreferrer" target="_blank">Ver site público <AdminIcon name="external" size={15} /><span className="srOnly"> (abre em nova aba)</span></Link>
      </div>
    </aside>
    <div className="adminWorkspace" ref={workspaceRef}>
      <a className="adminSkipLink" href="#admin-main">Ir para o conteúdo</a>
      <header className="adminTopbar" data-testid="admin-topbar">
        <div className="adminTopbarLocation">
          <button aria-controls="admin-sidebar" aria-expanded={open} aria-label={open ? "Fechar menu" : "Abrir menu"} className="adminMenuButton" onClick={() => setOpen((value) => !value)} ref={toggleRef} type="button"><AdminIcon name="menu" /></button>
          <nav aria-label="Breadcrumb" className="adminBreadcrumb"><ol>{location.breadcrumbs.map((crumb, index) => <li key={`${crumb.label}-${index}`}>{crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}</li>)}</ol></nav>
        </div>
        <div className="adminTopbarActions"><Link aria-label="Ver site público (abre em nova aba)" className="adminPublicLink" href="/" rel="noopener noreferrer" target="_blank"><AdminIcon name="external" size={16} /><span>Ver site público</span></Link><span className="adminTopbarUser"><span className="adminAvatar">{initials}</span><span><strong>{name}</strong><small>{readOnly ? "Somente leitura" : role}</small></span></span></div>
      </header>
      {readOnly ? <div className="adminReadOnlyNotice" role="status"><strong>{preview ? "Preview local" : "Sessão de desenvolvimento"}</strong><span>Somente leitura. Para salvar alterações, entre com uma conta administrativa real.</span>{!preview ? <Link href="/admin/login">Entrar com uma conta</Link> : null}</div> : null}
      <main className="adminMain" id="admin-main" tabIndex={-1}>{children}</main>
    </div>
  </div>;
}
