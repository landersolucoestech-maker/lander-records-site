"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminIcon, type IconName } from "./AdminIcon";
import { resolveAdminLocation, visibleAdminNavigation, type AdminRole } from "./admin-navigation";

export type AdminNotificationItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  actorName: string;
};

type ShellProps = {
  children: React.ReactNode;
  email?: string;
  footerAction?: React.ReactNode;
  name: string;
  notifications?: AdminNotificationItem[];
  notificationScope?: string;
  preview?: boolean;
  role?: AdminRole;
  sessionSource?: "session" | "development-auth-bypass";
};

type ModuleHeaderAction = {
  label: string;
  href?: string;
  event?: "admin:new-content" | "admin:new-artist" | "admin:add-media";
  icon?: IconName;
  external?: boolean;
  requiresEdit?: boolean;
};

type ModuleHeader = {
  title: string;
  description: string;
  action?: ModuleHeaderAction;
  back?: { label: string; href: string };
};

const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]';

function moduleHeader(pathname: string, preview: boolean): ModuleHeader | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  const root = preview ? "/cms-preview" : "/admin";
  const starts = (segment: string) => path === `${root}/${segment}` || path.startsWith(`${root}/${segment}/`);

  if (path === "/admin" || path === "/cms-preview/dashboard") {
    return { title: "Dashboard", description: "Visão geral da operação, conteúdo e desempenho do site da Lander Records." };
  }

  if (starts("posts")) {
    if (path === `${root}/posts`) return { title: "Conteúdos", description: "Gerencie publicações e rascunhos editoriais da Lander Records em um único fluxo.", action: { label: "Novo conteúdo", event: "admin:new-content", icon: "plus", requiresEdit: true } };
    if (path.endsWith("/view")) return { title: "Visualizar conteúdo", description: "Consulte a publicação preservando o mesmo contexto visual do módulo editorial.", back: { label: "Conteúdos", href: preview ? `${root}/posts` : "/admin/posts" } };
    return { title: "Editar conteúdo", description: "Edite publicação, mídia, autoria, organização e SEO com prévia em tempo real.", back: { label: "Conteúdos", href: preview ? `${root}/posts` : "/admin/posts" } };
  }

  if (starts("artists")) {
    if (path === `${root}/artists`) return { title: "Artistas", description: "Gerencie artistas, perfis, publicação e conteúdos relacionados em uma única área.", action: { label: "Novo artista", event: "admin:new-artist", icon: "plus", requiresEdit: true } };
    if (path.endsWith("/new")) return { title: "Novo artista", description: "Cadastre identidade, mídias, plataformas, destinos e metadados do artista.", back: { label: "Artistas", href: preview ? `${root}/artists` : "/admin/artists" } };
    if (path.endsWith("/view")) return { title: "Visualizar artista", description: "Consulte o perfil administrativo e a presença pública do artista.", back: { label: "Artistas", href: preview ? `${root}/artists` : "/admin/artists" } };
    return { title: "Editar artista", description: "Configure identidade, publicação, integrações, mídia e conteúdo público com prévia em tempo real.", back: { label: "Artistas", href: preview ? `${root}/artists` : "/admin/artists" } };
  }

  if (starts("media")) return {
    title: "Mídias",
    description: "Organize a biblioteca de arquivos, metadados e ciclo de vida das mídias do site.",
    action: preview ? undefined : { label: "Adicionar mídia", event: "admin:add-media", icon: "upload", requiresEdit: true },
  };

  if (starts("pages")) {
    if (path === `${root}/pages`) return { title: "Páginas", description: "Gerencie as páginas existentes e configure cada seção com edição e prévia em tempo real." };
    if (path.endsWith("/view")) return { title: "Visualizar página", description: "Consulte a estrutura administrativa e o destino público da página.", back: { label: "Páginas", href: preview ? `${root}/pages` : "/admin/pages" } };
    return { title: "Configurar página", description: "Edite seções e conteúdo usando o workbench visual canônico da Lander Records.", back: { label: "Páginas", href: preview ? `${root}/pages` : "/admin/pages" } };
  }

  if (starts("media-kit")) return {
    title: "Mídia Kit",
    description: "Edite a apresentação comercial e acompanhe as informações que compõem o material institucional.",
    action: { label: "Editar dados de origem", href: preview ? `${root}/settings` : "/admin/settings", icon: "edit", requiresEdit: true },
  };
  if (starts("settings/lander-records") || (preview && starts("integrations"))) return { title: "Integrações", description: "Gerencie conexões externas, estado de sincronização e fontes de dados sem expor credenciais no cliente." };
  if (starts("settings")) return { title: "Configurações", description: "Gerencie identidade, preferências, segurança e integrações em uma experiência unificada." };
  if (starts("users")) return { title: "Usuários", description: "Gerencie contas administrativas, papéis e controles de acesso da Lander Records." };
  if (starts("home")) return { title: "Home", description: "Configure as áreas editoriais e a composição da página inicial.", action: { label: "Ver site público", href: "/", icon: "external", external: true } };
  if (starts("navigation")) return { title: "Navegação", description: "Gerencie menus, destinos e hierarquia da navegação pública." };
  if (starts("header")) return { title: "Cabeçalho", description: "Configure os elementos estruturais do cabeçalho público." };
  if (starts("post-categories") || starts("categories")) return { title: "Categorias", description: "Gerencie as categorias usadas na organização editorial." };
  if (starts("artist-categories")) return { title: "Categorias de artistas", description: "Gerencie classificações e filtros usados no catálogo de artistas." };
  if (starts("releases")) return { title: "Lançamentos", description: "A fonte oficial dos Últimos Lançamentos é a playlist do Spotify configurada em Integrações." };
  if (starts("audit")) return { title: "Auditoria", description: "Consulte eventos administrativos e histórico de alterações." };
  return null;
}

function roleLabel(role: AdminRole) {
  if (role === "owner") return "Proprietário";
  if (role === "admin") return "Administrador";
  if (role === "editor") return "Editor";
  return "Leitor";
}

function notificationLabel(action: string) {
  const labels: Record<string, string> = {
    "artist.created": "Artista criado",
    "artist.updated": "Artista atualizado",
    "artist.deleted": "Artista excluído",
    "post.created": "Conteúdo criado",
    "post.updated": "Conteúdo atualizado",
    "post.deleted": "Conteúdo excluído",
    "post.published": "Conteúdo publicado",
    "media.uploaded": "Mídia adicionada",
    "media.archived": "Mídia arquivada",
  };
  return labels[action] || action.split(".").map((part) => part.replaceAll("_", " ")).join(" · ");
}

function notificationDetail(item: AdminNotificationItem) {
  const metadata = item.metadata || {};
  for (const key of ["name", "title", "originalFilename", "slug"]) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  if (item.entityType === "artist") return "Perfil de artista";
  if (item.entityType === "post") return "Conteúdo editorial";
  if (item.entityType === "media_asset") return "Arquivo de mídia";
  return item.entityType.replaceAll("_", " ");
}

function notificationHref(item: AdminNotificationItem) {
  if (item.entityType === "artist") return "/admin/artists";
  if (item.entityType === "post") return "/admin/posts";
  if (item.entityType === "media_asset") return "/admin/media";
  return "/admin";
}

function notificationDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}

export function AdminShell({ children, email, footerAction, name, notifications = [], notificationScope = "default", preview = false, role = "viewer", sessionSource = "session" }: ShellProps) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationSeenAt, setNotificationSeenAt] = useState("");
  const [hash, setHash] = useState("");
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const location = resolveAdminLocation(`${pathname}${hash}`, role, preview);
  const developmentPreview = sessionSource === "development-auth-bypass";
  const readOnly = preview || developmentPreview;
  const showReadOnlyChrome = preview;
  const contextualHeader = moduleHeader(pathname, preview);
  const initials = developmentPreview ? "DE" : name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "LR";
  const navigation = useMemo(() => visibleAdminNavigation(role), [role]);
  const canEdit = !readOnly && role !== "viewer";
  const headerAction = contextualHeader?.action && (!contextualHeader.action.requiresEdit || canEdit) ? contextualHeader.action : undefined;
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const contentRoot = preview ? "/cms-preview/posts" : "/admin/posts";
  const artistsRoot = preview ? "/cms-preview/artists" : "/admin/artists";
  const mediaRoot = preview ? "/cms-preview/media" : "/admin/media";
  const showContentHeaderTools = normalizedPath === contentRoot;
  const showArtistHeaderTools = normalizedPath === artistsRoot;
  const showMediaHeaderTools = normalizedPath === mediaRoot;
  const showNotificationHeaderTools = showContentHeaderTools || showArtistHeaderTools || showMediaHeaderTools;
  const showReadOnlyHeaderAction = (showContentHeaderTools || showArtistHeaderTools) && Boolean(contextualHeader?.action);
  const unreadNotifications = notifications.filter((item) => !notificationSeenAt || Date.parse(item.createdAt) > Date.parse(notificationSeenAt)).length;
  const canOpenAudit = role === "owner" || role === "admin";

  useEffect(() => {
    const stored = window.localStorage.getItem("lander-admin-sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("lander-admin-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const stored = window.localStorage.getItem(`lander-admin-notifications-seen:${notificationScope}`);
    setNotificationSeenAt(stored || "");
  }, [notificationScope]);

  useEffect(() => {
    setNotificationOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!accountOpen) return;
    const close = (event: PointerEvent) => {
      if (event.target instanceof Node && accountRef.current && !accountRef.current.contains(event.target)) setAccountOpen(false);
    };
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") setAccountOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", keydown); };
  }, [accountOpen]);

  useEffect(() => {
    if (!notificationOpen) return;
    const close = (event: PointerEvent) => {
      if (event.target instanceof Node && notificationRef.current && !notificationRef.current.contains(event.target)) setNotificationOpen(false);
    };
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") setNotificationOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", keydown); };
  }, [notificationOpen]);

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

  const toggleNotifications = () => {
    setAccountOpen(false);
    setNotificationOpen((current) => {
      const next = !current;
      if (next && notifications[0]) {
        const seenAt = notifications[0].createdAt;
        setNotificationSeenAt(seenAt);
        window.localStorage.setItem(`lander-admin-notifications-seen:${notificationScope}`, seenAt);
      }
      return next;
    });
  };

  return <div className={`adminShell${open ? " sidebarOpen" : ""}${collapsed ? " sidebarCollapsed" : ""}`} data-testid="admin-shell" data-session-source={preview ? "preview" : sessionSource}>
    <button aria-label="Fechar menu pela sobreposição" className="adminSidebarBackdrop" onClick={() => setOpen(false)} tabIndex={-1} type="button" />
    <aside className="adminSidebar" data-testid="admin-sidebar" id="admin-sidebar" ref={sidebarRef} tabIndex={-1}>
      <div className="adminBrandBlock">
        <div className="adminBrandRow">
          <Link className="adminBrandLink" href="/" aria-label="Ir para o site público"><Image alt="Lander Records" className="adminBrandLogo" height={52} priority src="/lander-records-brand.svg" unoptimized width={150} /></Link>
          <button aria-label={collapsed ? "Expandir menu" : "Recolher menu"} className="adminSidebarCollapse" onClick={toggleSidebar} title={collapsed ? "Expandir menu" : "Recolher menu"} type="button"><AdminIcon name="chevron" size={16} /></button>
        </div>
        <span className="adminAdministrationLabel">ADMINISTRAÇÃO</span>
      </div>
      {showReadOnlyChrome ? <div className="adminPreviewBadge">Prévia · somente leitura</div> : null}
      <nav aria-label="Painel administrativo">
        <span className="adminNavigationEyebrow">NAVEGAÇÃO</span>
        {navigation.map((group) => {
          if (group.module) {
            const activeChild = group.items.some((item) => {
              const href = preview ? item.previewHref : item.href;
              return location.activeHref === href || (!href.includes("#") && location.activeHref?.split(/[?#]/, 1)[0] === href.split(/[?#]/, 1)[0]);
            });
            const expanded = expandedGroups[group.key] ?? activeChild;
            return <div className={`adminNavModule${expanded ? " expanded" : ""}`} key={group.key}>
              <button aria-expanded={expanded} className="adminNavParent" onClick={() => setExpandedGroups((current) => ({ ...current, [group.key]: !expanded }))} title={collapsed ? group.module.label : undefined} type="button">
                <AdminIcon name={group.module.icon} size={17} />
                <span>{group.module.label}</span>
                <AdminIcon name="chevron" size={13} />
              </button>
              {expanded ? <div className="adminNavChildren">{group.items.map((item) => {
                const href = preview ? item.previewHref : item.href;
                const active = location.activeHref === href || (!href.includes("#") && location.activeHref?.split(/[?#]/, 1)[0] === href.split(/[?#]/, 1)[0]);
                return <Link aria-current={active ? "page" : undefined} href={href} key={`${group.key}-${item.label}`} onClick={() => setOpen(false)} title={collapsed ? item.label : undefined}><AdminIcon name={item.icon} size={14} /><span>{item.label}</span></Link>;
              })}</div> : null}
            </div>;
          }
          return <div className="adminNavGroup" key={group.key}>
            {group.label ? <span className="adminNavLabel">{group.label}</span> : null}
            {group.items.map((item) => {
              const href = preview ? item.previewHref : item.href;
              const active = location.activeHref === href || (!href.includes("#") && location.activeHref?.split(/[?#]/, 1)[0] === href.split(/[?#]/, 1)[0]);
              return <Link aria-current={active ? "page" : undefined} href={href} key={`${group.key}-${item.label}`} onClick={() => setOpen(false)} title={collapsed ? item.label : undefined}><AdminIcon name={item.icon} size={17} /><span>{item.label}</span></Link>;
            })}
          </div>;
        })}
      </nav>
      {!developmentPreview ? <div className="adminSidebarFooter"><div className="adminUserSummary"><span className="adminAvatar">{initials}</span><span><strong>{name}</strong><small>{readOnly ? "Acesso de leitura" : email || roleLabel(role)}</small></span></div></div> : null}
    </aside>

    <div className="adminWorkspace" ref={workspaceRef}>
      <a className="adminSkipLink" href="#admin-main">Ir para o conteúdo</a>
      <header className={`adminTopbar${contextualHeader ? " adminTopbarContextual" : ""}`} data-testid="admin-topbar">
        <div className="adminTopbarLocation">
          <button aria-controls="admin-sidebar" aria-expanded={open} aria-label={open ? "Fechar menu" : "Abrir menu"} className="adminMenuButton" onClick={() => setOpen((value) => !value)} ref={mobileToggleRef} type="button"><AdminIcon name="menu" /></button>
          {contextualHeader ? <div className="adminPageHeadingRow">{contextualHeader.back ? <Link className="adminHeaderBack" href={contextualHeader.back.href}><span aria-hidden="true">←</span><span>{contextualHeader.back.label}</span></Link> : null}<div className="adminContextTitle"><strong>{contextualHeader.title}</strong><small>{contextualHeader.description}</small></div></div> : <nav aria-label="Breadcrumb" className="adminBreadcrumb"><ol>{location.breadcrumbs.map((crumb, index) => <li key={`${crumb.label}-${index}`}>{crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}</li>)}</ol></nav>}
        </div>
        <div className="adminTopbarActions">
          {headerAction ? headerAction.event ? <button aria-haspopup="dialog" className="adminTopbarPrimary" onClick={() => window.dispatchEvent(new Event(headerAction.event!))} type="button"><AdminIcon name={headerAction.icon || "plus"} size={14} /><span>{headerAction.label}</span></button> : <Link className="adminTopbarPrimary" href={headerAction.href!} rel={headerAction.external ? "noopener noreferrer" : undefined} target={headerAction.external ? "_blank" : undefined}><AdminIcon name={headerAction.icon || "plus"} size={14} /><span>{headerAction.label}</span></Link> : showReadOnlyHeaderAction && contextualHeader?.action ? <button aria-disabled="true" className="adminTopbarPrimary adminTopbarPrimaryDisabled" disabled title="Disponível para sessões persistentes com permissão de edição" type="button"><AdminIcon name={contextualHeader.action.icon || "plus"} size={14}/><span>{contextualHeader.action.label}</span></button> : null}
          {showNotificationHeaderTools ? <div className="adminNotificationWrap" ref={notificationRef}><button aria-expanded={notificationOpen} aria-haspopup="true" aria-label={unreadNotifications ? `Notificações, ${unreadNotifications} não lidas` : "Notificações"} className="adminNotificationButton" onClick={toggleNotifications} title="Notificações" type="button"><AdminIcon name="bell" size={16}/>{unreadNotifications ? <span className="adminNotificationBadge">{Math.min(unreadNotifications, 99)}</span> : null}</button>{notificationOpen ? <div className="adminNotificationPopover" role="status"><div className="adminNotificationHeader"><div><strong>Notificações</strong><span>Atividade editorial recente</span></div>{notifications.length ? <small>{notifications.length} eventos</small> : null}</div>{notifications.length ? <div className="adminNotificationList">{notifications.map((item) => <Link className="adminNotificationItem" href={notificationHref(item)} key={item.id} onClick={() => setNotificationOpen(false)}><span className="adminNotificationItemIcon"><AdminIcon name={item.entityType === "artist" ? "artists" : item.entityType === "media_asset" ? "media" : "posts"} size={14}/></span><span className="adminNotificationItemCopy"><strong>{notificationLabel(item.action)}</strong><span>{notificationDetail(item)}</span><small>{item.actorName} · {notificationDate(item.createdAt)}</small></span></Link>)}</div> : <div className="adminNotificationEmpty"><AdminIcon name="bell" size={18}/><strong>Nenhuma atividade recente</strong><span>Novas alterações editoriais aparecerão aqui.</span></div>}{canOpenAudit ? <Link className="adminNotificationFooter" href="/admin/audit" onClick={() => setNotificationOpen(false)}>Ver auditoria completa <span aria-hidden="true">→</span></Link> : null}</div> : null}</div> : null}
          <div className="adminAccountWrap" ref={accountRef}>
            <button aria-expanded={accountOpen} aria-haspopup="menu" className="adminTopbarUser" onClick={() => setAccountOpen((value) => !value)} type="button"><span className="adminAvatar">{initials}</span><span><strong>{name}</strong><small>{developmentPreview ? "Administrador" : roleLabel(role)}</small></span><AdminIcon name="chevron" size={13} /></button>
            {accountOpen ? <div className="adminAccountPopover" role="menu"><Link href="/admin/settings" role="menuitem" onClick={() => setAccountOpen(false)}><AdminIcon name="settings" size={15}/><span>Configurações</span></Link>{footerAction ? <div className="adminAccountLogout" onClick={() => setAccountOpen(false)}>{footerAction}</div> : null}</div> : null}
          </div>
        </div>
      </header>
      {showReadOnlyChrome ? <div className="adminReadOnlyNotice" role="status"><strong>Prévia</strong><span>Somente leitura. Para salvar alterações, entre com uma conta administrativa real.</span></div> : null}
      <main className="adminMain" id="admin-main" tabIndex={-1}>{children}</main>
    </div>
  </div>;
}
