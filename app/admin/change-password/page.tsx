import { redirect } from "next/navigation";
import { getAdminSession } from "../../../lib/auth";
import { changeOwnPassword } from "../actions";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const params = await searchParams;

  return (
    <main className="adminAuthPage">
      <section className="adminAuthCard">
        <div className="adminWordmark">LANDER <span>CMS</span></div>
        <p className="adminEyebrow">SEGURANÇA</p>
        <h1>Alterar senha</h1>
        <p>Use pelo menos 12 caracteres. A senha temporária não poderá continuar em uso.</p>
        {params.error ? <div className="adminAlert error">A senha atual não confere ou a nova senha não atende aos requisitos.</div> : null}
        <form action={changeOwnPassword} className="adminForm">
          <label>Senha atual<input name="currentPassword" type="password" required /></label>
          <label>Nova senha<input name="newPassword" type="password" minLength={12} required /></label>
          <label>Confirmar nova senha<input name="confirmPassword" type="password" minLength={12} required /></label>
          <button className="adminButton primary" type="submit">Salvar nova senha</button>
        </form>
      </section>
    </main>
  );
}
