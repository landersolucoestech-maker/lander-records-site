import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../../lib/auth";
import { AdminIcon } from "../components/AdminIcon";
import { loginAction } from "./actions";
import styles from "./Login.module.css";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getAdminSession();
  if (session) redirect(session.user.mustChangePassword ? "/admin/change-password" : "/admin");

  const params = await searchParams;
  const message = params.error === "locked"
    ? "Acesso bloqueado temporariamente após várias tentativas inválidas."
    : params.error
      ? "E-mail ou senha inválidos."
      : "";

  return <main className={styles.page}>
    <section className={styles.brandPanel} aria-label="Lander Records · Área interna">
      <Link className={styles.logo} href="/" aria-label="Voltar ao site da Lander Records"><Image alt="Lander Records" height={86} priority src="/lander-records-brand.svg" unoptimized width={154}/></Link>
      <div className={styles.brandCopy}><span>LANDER RECORDS · OPERAÇÃO INTERNA</span><h1>Conteúdo, artistas e operação em um único ambiente.</h1><p>A área administrativa reúne Site, Mídias, Páginas, Mídia Kit e Configurações com navegação e identidade compartilhadas.</p></div>
      <div className={styles.brandFoot}><span>ADMINISTRAÇÃO UNIFICADA</span><span>LANDER RECORDS</span></div>
    </section>

    <section className={styles.formPanel}>
      <div className={styles.formWrap}>
        <div className={styles.formHeading}><span>ACESSO ADMINISTRATIVO</span><h2>Entrar na área interna</h2><p>Use sua conta administrativa para acessar o painel da Lander Records.</p></div>
        {message ? <div className={styles.warning} role="alert"><AdminIcon name="shield" size={18}/><div><strong>Não foi possível entrar</strong><p>{message}</p></div></div> : null}
        <form action={loginAction} className={styles.form}>
          <label><span>E-mail</span><input name="email" type="email" autoComplete="username" placeholder="seuemail@empresa.com" required /></label>
          <label><span>Senha</span><input name="password" type="password" autoComplete="current-password" placeholder="••••••••" required /></label>
          <div className={styles.options}><label><input name="remember" type="checkbox"/><span>Manter sessão</span></label><span>Sessões podem ser revogadas pelo backend</span></div>
          <button className={styles.primary} type="submit"><AdminIcon name="shield" size={16}/>Entrar</button>
        </form>
        <div className={styles.demoEntry}><span>SESSÃO PROTEGIDA</span><p>Autenticação, bloqueio por tentativas e permissões continuam sendo processados pela lógica atual do projeto.</p></div>
        <Link className={styles.back} href="/">← Voltar ao site público</Link>
      </div>
    </section>
  </main>;
}
