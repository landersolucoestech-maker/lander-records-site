import Link from "next/link";
import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { mockAdminUsers, mockDataEnabled } from "../../../../lib/mocks";
import { adminUsers } from "../../../../lib/db/schema";
import { createAdminUser, resetAdminPassword, updateAdminUser } from "../../actions";
import { AdminIcon } from "../../components/AdminIcon";
import settingsStyles from "../settings/Settings.module.css";
import styles from "./Users.module.css";

export const dynamic = "force-dynamic";

function initials(name: string, email: string) {
  const source = name.trim() || email;
  return source.split(/\s+|@/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "LR";
}

const roleLabel = {
  owner: "Proprietário",
  admin: "Administrador",
  editor: "Editor",
  viewer: "Leitor",
} as const;

export default async function UsersPage() {
  const session = await requireAdmin();
  const mockMode = mockDataEnabled();
  if (!mockMode && (session.source !== "session" || session.user.role !== "owner")) redirect("/admin/settings");
  const canManage = !mockMode && session.source === "session" && session.user.role === "owner";
  const rows = mockMode ? mockAdminUsers : await getDb().select().from(adminUsers).orderBy(asc(adminUsers.name));
  const active = rows.filter((user) => user.isActive).length;
  const owners = rows.filter((user) => user.role === "owner").length;

  return <div className={styles.page} data-testid="users-manager">
    <nav aria-label="Seções de configurações" className={settingsStyles.tabs}>
      <Link href="/admin/settings"><AdminIcon name="home" size={15}/>Empresa</Link>
      <Link href="/admin/settings#identity"><AdminIcon name="media" size={15}/>Identidade do site</Link>
      <Link href="/admin/settings#automations"><AdminIcon name="activity" size={15}/>Automações</Link>
      <Link href="/admin/settings#security"><AdminIcon name="shield" size={15}/>Segurança</Link>
      <Link href="/admin/settings/lander-records"><AdminIcon name="integration" size={15}/>Integrações</Link>
      <Link aria-current="page" href="/admin/users"><AdminIcon name="users" size={15}/>Usuários</Link>
    </nav>

    <section className={styles.kpis} aria-label="Resumo de usuários">
      <article><span>Usuários ativos</span><strong>{active}</strong></article>
      <article><span>Contas totais</span><strong>{rows.length}</strong></article>
      <article><span>Papéis disponíveis</span><strong>4</strong></article>
      <article><span>Proprietários</span><strong>{owners}</strong></article>
    </section>

    <section className={styles.card}>
      <header><div><h2>Gerenciar equipe</h2><p>Gerencie o acesso dos usuários mantendo o controle de papéis e as ações reais do projeto.</p></div></header>
      <div className={styles.cardBody}>
        <form action={createAdminUser} className={styles.inviteRow}>
          <div className={styles.inviteInput}><AdminIcon name="users" size={14}/><input aria-label="Nome do novo usuário" disabled={!canManage} name="name" placeholder="Nome do usuário" required/></div>
          <div className={styles.inviteInput}><AdminIcon name="mail" size={14}/><input aria-label="E-mail do novo usuário" disabled={!canManage} name="email" type="email" placeholder="Digite o endereço de e-mail" required/></div>
          <select aria-label="Papel do novo usuário" disabled={!canManage} name="role" defaultValue="editor"><option value="owner">Proprietário</option><option value="admin">Administrador</option><option value="editor">Editor</option><option value="viewer">Leitor</option></select>
          <input aria-label="Senha temporária" className={styles.passwordInput} disabled={!canManage} disabled={!canManage} name="temporaryPassword" type="password" minLength={12} placeholder="Senha temporária" required/>
          <button className={styles.primaryButton} disabled={!canManage} type="submit"><AdminIcon name="plus" size={14}/>{canManage ? "Criar usuário" : "Preview somente leitura"}</button>
        </form>

        <div className={styles.teamList}>{rows.length ? rows.map((user) => <article className={styles.userRow} key={user.id}>
          <span className={styles.avatar}>{initials(user.name, user.email)}</span>
          <div className={styles.userCopy}><strong>{user.name || "Sem nome"}</strong><small>{user.email}</small></div>
          <form action={updateAdminUser} className={styles.userControls}>
            <input type="hidden" name="id" value={user.id}/>
            <input aria-label={`Nome de ${user.name}`} disabled={!canManage} name="name" defaultValue={user.name}/>
            <select aria-label={`Papel de ${user.name}`} disabled={!canManage} name="role" defaultValue={user.role}><option value="owner">Proprietário</option><option value="admin">Administrador</option><option value="editor">Editor</option><option value="viewer">Leitor</option></select>
            <label className={styles.statusToggle}><input disabled={!canManage} name="isActive" type="checkbox" defaultChecked={user.isActive}/><span>{user.isActive ? "Ativo" : "Inativo"}</span></label>
            <button className={styles.iconButton} aria-label={`Salvar ${user.name}`} disabled={!canManage} type="submit"><AdminIcon name="check" size={15}/></button>
          </form>
          <details className={styles.passwordDetails}><summary><AdminIcon name="settings" size={14}/>Senha</summary><form action={resetAdminPassword}><input type="hidden" name="id" value={user.id}/><input aria-label={`Nova senha temporária para ${user.name}`} name="temporaryPassword" type="password" minLength={12} placeholder="Nova senha temporária" required/><button className={styles.dangerButton} disabled={!canManage} type="submit">Redefinir</button></form></details>
        </article>) : <div className={styles.empty}>Nenhum usuário administrativo cadastrado.</div>}</div>
      </div>
    </section>

    <section className={styles.card}>
      <header><div><h2>Papéis e permissões</h2><p>Os identificadores internos permanecem estáveis; a interface apresenta os papéis em linguagem consistente com o restante do Admin.</p></div></header>
      <div className={styles.cardBody}><div className={styles.roles}>{[
        ["owner", "Acesso administrativo completo"],
        ["admin", "Administração operacional"],
        ["editor", "Gestão de conteúdo permitida"],
        ["viewer", "Acesso somente leitura"],
      ].map(([role, description]) => <article key={role}><span className={styles.roleIcon}><AdminIcon name="shield" size={15}/></span><div><strong>{roleLabel[role as keyof typeof roleLabel]}</strong><small>{description}</small></div><span className={styles.roleBadge}>Sistema</span></article>)}</div></div>
    </section>
  </div>;
}
