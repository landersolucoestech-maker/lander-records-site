import { redirect } from "next/navigation";
import { getAdminSession } from "../../../lib/auth";
import { loginAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getAdminSession();
  if (session) redirect(session.user.mustChangePassword ? "/admin/change-password" : "/admin");

  const params = await searchParams;
  const message =
    params.error === "locked"
      ? "Acesso bloqueado temporariamente após várias tentativas inválidas."
      : params.error
        ? "E-mail ou senha inválidos."
        : "";

  return (
    <main className="adminAuthPage">
      <section className="adminAuthCard">
        <div className="adminWordmark">LANDER <span>PORTAL</span></div>
        <p className="adminEyebrow">PAINEL ADMINISTRATIVO</p>
        <h1>Acesso restrito</h1>
        <p>Gerencie o conteúdo público da Lander Records.</p>
        {message ? <div className="adminAlert error">{message}</div> : null}
        <form action={loginAction} className="adminForm">
          <label>E-mail<input name="email" type="email" autoComplete="username" required /></label>
          <label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>
          <button className="adminButton primary" type="submit">Entrar</button>
        </form>
      </section>
    </main>
  );
}
