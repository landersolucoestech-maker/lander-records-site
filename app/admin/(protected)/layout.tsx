import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../../lib/auth";
import { logoutAction } from "../actions";

const nav = [
  ["Visão geral", "/admin"],
  ["Artistas", "/admin/artists"],
  ["Categorias de artistas", "/admin/artist-categories"],
  ["Notícias / Posts", "/admin/posts"],
  ["Categorias de posts", "/admin/post-categories"],
  ["Tags", "/admin/tags"],
  ["Lançamentos", "/admin/releases"],
  ["Páginas e seções", "/admin/pages"],
  ["Navegação", "/admin/navigation"],
  ["Mídia", "/admin/media"],
  ["Contatos / Leads", "/admin/contacts"],
  ["Configurações", "/admin/settings"],
  ["Usuários", "/admin/users"],
  ["Auditoria", "/admin/audit"],
] as const;

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  if (session.user.mustChangePassword) redirect("/admin/change-password");

  return (
    <div className="adminShell">
      <aside className="adminSidebar">
        <Link href="/admin" className="adminWordmark">LANDER <span>CMS</span></Link>
        <nav aria-label="Painel administrativo">
          {nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <div className="adminSidebarFooter">
          <strong>{session.user.name}</strong>
          <span>{session.user.role}</span>
          <Link href="/" target="_blank">Ver site público ↗</Link>
          <form action={logoutAction}><button type="submit">Sair</button></form>
        </div>
      </aside>
      <main className="adminMain">{children}</main>
    </div>
  );
}
