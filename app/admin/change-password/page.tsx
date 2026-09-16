import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../../lib/auth";
import { AdminIcon } from "../components/AdminIcon";
import { changeOwnPassword } from "../actions";
import styles from "../login/Login.module.css";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const params = await searchParams;

  return <main className={styles.page}>
    <section className={styles.brandPanel} aria-label="Lander Records · Segurança">
      <Link className={styles.logo} href="/" aria-label="Voltar ao site da Lander Records"><Image alt="Lander Records" height={86} priority src="/lander-records-brand.svg" unoptimized width={154}/></Link>
      <div className={styles.brandCopy}><span>LANDER RECORDS · SEGURANÇA</span><h1>Proteção da conta administrativa.</h1><p>Credenciais e sessões continuam validadas pelo backend atual, com o mesmo padrão visual da área interna.</p></div>
      <div className={styles.brandFoot}><span>SESSÃO PROTEGIDA</span><span>LANDER RECORDS</span></div>
    </section>

    <section className={styles.formPanel}>
      <div className={styles.formWrap}>
        <div className={styles.formHeading}><span>SEGURANÇA DA CONTA</span><h2>Alterar senha</h2><p>Use pelo menos 12 caracteres. A senha temporária não poderá continuar em uso.</p></div>
        {params.error ? <div className={styles.warning} role="alert"><AdminIcon name="shield" size={18}/><div><strong>Não foi possível alterar a senha</strong><p>A senha atual não confere ou a nova senha não atende aos requisitos.</p></div></div> : null}
        <form action={changeOwnPassword} className={styles.form}>
          <label><span>Senha atual</span><input name="currentPassword" type="password" autoComplete="current-password" required /></label>
          <label><span>Nova senha</span><input name="newPassword" type="password" autoComplete="new-password" minLength={12} required /></label>
          <label><span>Confirmar nova senha</span><input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required /></label>
          <button className={styles.primary} type="submit"><AdminIcon name="shield" size={16}/>Salvar nova senha</button>
        </form>
        <Link className={styles.back} href="/admin">← Voltar ao painel</Link>
      </div>
    </section>
  </main>;
}
