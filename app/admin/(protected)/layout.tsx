import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../../lib/auth";
import { logoutAction } from "../actions";

const nav = [
  ["Dashboard", "/admin"],
  ["Artistas", "/admin/artists"],
  ["Notícias / Posts", "/admin/posts"],
  ["Páginas & Seções", "/admin/pages"],
  ["Biblioteca de mídia", "/admin/media"],
  ["Configurações da Lander Records", "/admin/settings/lander-records"],
  ["Usuários & Roles", "/admin/users"],
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
