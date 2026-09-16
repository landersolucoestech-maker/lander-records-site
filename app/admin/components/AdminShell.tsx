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
  const [collapsed, setCollapsed] = useState(false);
  const [siteExpanded, setSiteExpanded] = useState(true);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const location = resolveAdminLocation(pathname, role, preview);
  const developmentPreview = sessionSource === "development-auth-bypass";
  const readOnly = preview || developmentPreview;
  const showReadOnlyChrome = preview;
  const pagesIndex = pathname === "/admin/pages" || pathname === "/cms-preview/pages";
  const initials = developmentPreview ? "DE" : name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "LR";

  useEffect(() => {
    const stored = window.localStorage.getItem("lander-admin-sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("lander-admin-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    if (!open) return;
    const sidebar = sidebarRef.current;
    const workspace = workspaceRef.current;
    const toggle = mobileToggleRef.current;
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

  const toggleSidebar = () => {
    if (window.matchMedia("(max-width: 900px)").matches) setOpen(false);
    else setCollapsed((value) => !value);
  };

  return <div className={`adminShell${open ? " sidebarOpen" : ""}${collapsed ? " sidebarCollapsed" : ""}`} data-testid="admin-shell" data-session-source={preview ? "preview" : sessionSource}>
    <button aria-label="Fechar menu pela sobreposição" className="adminSidebarBackdrop" onClick={() => setOpen(false)} tabIndex={-1} type="button" />
    <aside className="adminSidebar" data-testid="admin-sidebar" id="admin-sidebar" ref={sidebarRef} tabIndex={-1}>
      <div className="adminBrandBlock">
        <Image alt="Lander Records" className="adminBrandLogo" height={72} priority src="/lander-records-brand.svg" unoptimized width={152} />
        <button aria-label={collapsed ? "Expandir menu" : "Colapsar menu"} className="adminSidebarCollapse" onClick={toggleSidebar} title={collapsed ? "Expandir menu" : "Colapsar menu"} type="button"><AdminIcon name="chevron" /></button>
      </div>
      {showReadOnlyChrome ? <div className="adminPreviewBadge">Preview local · somente leitura</div> : null}
      <nav aria-label="Painel administrativo">
        {visibleAdminNavigation(role).map((group) => {
          const links = group.items.map((item) => {
            const href = preview ? item.previewHref : item.href;
            const active = location.activeHref === href || location.activeHref?.split(/[?#]/, 1)[0] === href.split(/[?#]/, 1)[0];
            return <Link aria-current={active ? "page" : undefined} href={href} key={`${group.key}-${item.label}`} onClick={() => setOpen(false)} title={collapsed ? item.label : undefined}><AdminIcon name={item.icon} size={19} /><span>{item.label}</span></Link>;
          });
          if (group.module) {
            return <div className="adminNavModule" key={group.key}>
              <button aria-expanded={siteExpanded} className="adminNavParent" onClick={() => setSiteExpanded((value) => !value)} title={collapsed ? group.module.label : undefined} type="button">
                <AdminIcon name={group.module.icon} size={19} />
                <span>{group.module.label}</span>
                <AdminIcon name="chevron" size={15} />
              </button>
              {siteExpanded ? <div className="adminNavChildren">{links}</div> : null}
            </div>;
          }
          return <div className="adminNavGroup" key={group.key}>
            {group.label ? <span className="adminNavLabel">{group.label}</span> : null}
            {links}
          </div>;
        })}
      </nav>
      {!developmentPreview ? <div className="adminSidebarFooter">
        <div className="adminUserSummary"><span className="adminAvatar">{initials}</span><span><strong>{name}</strong><small>{readOnly ? "Acesso de leitura" : email || role}</small></span></div>
        {footerAction}
      </div> : null}
    </aside>
    <div className="adminWorkspace" ref={workspaceRef}>
      <a className="adminSkipLink" href="#admin-main">Ir para o conteúdo</a>
      <header className={`adminTopbar${pagesIndex ? " adminTopbarContextual adminTopbarPages" : ""}`} data-testid="admin-topbar">
        <div className="adminTopbarLocation">
          <button aria-controls="admin-sidebar" aria-expanded={open} aria-label={open ? "Fechar menu" : "Abrir menu"} className="adminMenuButton" onClick={() => setOpen((value) => !value)} ref={mobileToggleRef} type="button"><AdminIcon name="menu" /></button>
          {pagesIndex ? <div className="adminContextTitle"><strong>Páginas</strong><small>Gerencie páginas e configure cada seção com edição e preview em tempo real.</small></div> : <nav aria-label="Breadcrumb" className="adminBreadcrumb"><ol>{location.breadcrumbs.map((crumb, index) => <li key={`${crumb.label}-${index}`}>{crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}</li>)}</ol></nav>}
        </div>
        <div className="adminTopbarActions">
          {pagesIndex ? <><Link className="adminTopbarPrimary" href={preview ? "/cms-preview/pages" : "/admin/pages/new"}><span aria-hidden="true">+</span><span>Criar página</span></Link><button aria-label="Notificações" className="adminNotificationButton" type="button"><AdminIcon name="bell" size={18} /></button></> : <Link aria-label="Ver site público (abre em nova aba)" className="adminPublicLink" href="/" rel="noopener noreferrer" target="_blank"><span>Ver site público</span><AdminIcon name="external" size={15} /></Link>}
          <span className="adminTopbarUser"><span className="adminAvatar">{initials}</span><span><strong>{name}</strong><small>{email || role}</small></span></span>
        </div>
      </header>
      {showReadOnlyChrome ? <div className="adminReadOnlyNotice" role="status"><strong>Preview local</strong><span>Somente leitura. Para salvar alterações, entre com uma conta administrativa real.</span></div> : null}
      <main className="adminMain" id="admin-main" tabIndex={-1}>{children}</main>
    </div>
  </div>;
}
