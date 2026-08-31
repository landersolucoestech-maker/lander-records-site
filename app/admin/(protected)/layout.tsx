import { redirect } from "next/navigation";
import { requireAdmin } from "../../../lib/auth";
import { logoutAction } from "../actions";
import { AdminShell } from "../components/AdminShell";
import "../dashboard.css";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  if (session.user.mustChangePassword) redirect("/admin/change-password");
  return <AdminShell email={session.user.email} footerAction={<form action={logoutAction}><button type="submit">Sair</button></form>} name={session.user.name} role={session.user.role}>{children}</AdminShell>;
}
