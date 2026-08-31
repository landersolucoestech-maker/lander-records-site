"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AdminIcon, type IconName } from "./AdminIcon";

type NavItem = { label: string; href?: string; icon: IconName; minimumRole?: "admin" | "owner" };
type NavGroup = { label: string; items: NavItem[] };

const rank = { viewer: 0, editor: 1, admin: 2, owner: 3 } as const;
const groups: NavGroup[] = [
  { label: "Visão geral", items: [{ label: "Dashboard", href: "/admin", icon: "dashboard" }] },
  { label: "Conteúdo", items: [{ label: "Home", href: "/admin/home", icon: "home" }, { label: "Artistas", href: "/admin/artists", icon: "artists" }, { label: "Notícias", href: "/admin/posts", icon: "posts" }, { label: "Páginas", href: "/admin/pages", icon: "pages" }, { label: "Mídia", href: "/admin/media", icon: "media" }, { label: "Mensagens", icon: "posts" }] },
  { label: "Estrutura do site", items: [{ label: "Navegação", href: "/admin/navigation", icon: "navigation" }, { label: "Cabeçalho", icon: "pages" }, { label: "Rodapé", icon: "pages" }] },
  { label: "Organização", items: [{ label: "Categorias", href: "/admin/categories", icon: "pages" }, { label: "Tags", href: "/admin/tags", icon: "tags" }] },
  { label: "Configurações", items: [{ label: "Configurações do Site", href: "/admin/settings", icon: "settings" }, { label: "Integrações", href: "/admin/settings/lander-records", icon: "integration" }] },
  { label: "Administração", items: [{ label: "Usuários", href: "/admin/users", icon: "users", minimumRole: "owner" }, { label: "Atividade", href: "/admin/audit", icon: "audit", minimumRole: "admin" }] },
];

function allowed(item: NavItem, role: keyof typeof rank) {
  return !item.minimumRole || rank[role] >= rank[item.minimumRole];
}

export function AdminShell({ children, email, footerAction, name, preview = false, role = "viewer" }: { children: React.ReactNode; email?: string; footerAction?: React.ReactNode; name: string; preview?: boolean; role?: keyof typeof rank }) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const topbarTitle = pathname.includes("/home") ? "Home / Visão geral" : pathname.includes("artists") ? "Artistas / Visão geral" : pathname.includes("posts") ? "Notícias / Visão geral" : pathname.includes("media") ? "Mídia" : pathname.includes("navigation") ? "Navegação / Visão geral" : pathname.includes("settings") || pathname.includes("integrations") ? "Configurações" : pathname.includes("users") ? "Usuários" : pathname.includes("audit") ? "Atividade" : pathname.includes("categories") ? "Categorias" : pathname.includes("tags") ? "Tags" : pathname.includes("releases") ? "Lançamentos" : pathname.includes("pages") ? "Páginas / Visão geral" : "Dashboard";
  const mapHref = (href: string) => preview ? (href === "/admin" ? "/cms-preview/dashboard" : href.includes("lander-records") ? "/cms-preview/integrations" : `/cms-preview/${href.split("/").filter(Boolean).at(-1) || "dashboard"}`) : href;

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); toggleRef.current?.focus(); } };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  return <div className={`adminShell${open ? " sidebarOpen" : ""}`} data-testid="admin-shell">
    <button aria-label="Fechar menu pela sobreposição" className="adminSidebarBackdrop" onClick={() => setOpen(false)} tabIndex={-1} type="button" />
    <aside className="adminSidebar" data-testid="admin-sidebar" id="admin-sidebar">
      <div className="adminBrandBlock">
        <Image alt="Lander Records" className="adminBrandLogo" height={68} priority src="/lander-records-brand.svg" unoptimized width={168} />
        <span>Gerenciador do Site</span>
      </div>
      {preview ? <div className="adminPreviewBadge">PREVIEW LOCAL · SEM PERSISTÊNCIA</div> : null}
      <nav aria-label="Painel administrativo">
        {groups.map((group) => <div className="adminNavGroup" key={group.label}><span className="adminNavLabel">{group.label}</span>{group.items.filter((item) => allowed(item, role)).map((item) => {
          const href = item.href ? mapHref(item.href) : undefined;
          const active = href ? (href.endsWith("dashboard") ? pathname === href || pathname === "/cms-preview" : pathname.startsWith(href)) : false;
          return href ? <Link aria-current={active ? "page" : undefined} href={href} key={item.label} onClick={() => setOpen(false)}><AdminIcon name={item.icon} /><span>{item.label}</span></Link> : <span aria-disabled="true" className="adminNavUnavailable" key={item.label}><AdminIcon name={item.icon} /><span>{item.label}</span><small>Em breve</small></span>;
        })}</div>)}
      </nav>
      <div className="adminSidebarFooter">
        <div className="adminUserSummary"><span className="adminAvatar">{name.slice(0, 2).toUpperCase()}</span><span><strong>{name}</strong><small>{email || (preview ? "Interface de desenvolvimento" : role)}</small></span></div>
        {footerAction}
        <Link href="/" target="_blank">Ver site público <AdminIcon name="external" size={15} /><span className="srOnly"> (abre em nova aba)</span></Link>
      </div>
    </aside>
    <div className="adminWorkspace">
      <header className="adminTopbar" data-testid="admin-topbar">
        <div><button aria-controls="admin-sidebar" aria-expanded={open} aria-label={open ? "Fechar menu" : "Abrir menu"} className="adminMenuButton" onClick={() => setOpen((value) => !value)} ref={toggleRef} type="button"><AdminIcon name={open ? "x" : "menu"} /></button><strong>{topbarTitle}</strong></div>
        <div className="adminTopbarActions"><Link className="adminPublicLink" href="/" target="_blank"><AdminIcon name="home" size={16} /> Ver site público <AdminIcon name="external" size={14} /><span className="srOnly"> (abre em nova aba)</span></Link><span className="adminTopbarUser"><span className="adminAvatar">{name.slice(0, 2).toUpperCase()}</span><span><strong>{name}</strong><small>{email || role}</small></span></span></div>
      </header>
      <main className="adminMain" id="admin-main">{children}</main>
    </div>
  </div>;
}
