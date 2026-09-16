import { asc } from "drizzle-orm";
import { requireAdmin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { adminUsers } from "../../../../lib/db/schema";
import { createAdminUser, resetAdminPassword, updateAdminUser } from "../../actions";
import { AdminIcon } from "../../components/AdminIcon";
import styles from "./Users.module.css";

export const dynamic = "force-dynamic";

function initials(name: string, email: string) {
  const source = name.trim() || email;
  return source.split(/\s+|@/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "LR";
}

export default async function UsersPage() {
  await requireAdmin("owner");
  const rows = await getDb().select().from(adminUsers).orderBy(asc(adminUsers.name));
  const active = rows.filter((user) => user.isActive).length;
  const owners = rows.filter((user) => user.role === "owner").length;

  return <div className={styles.page}>
    <section className={styles.kpis} aria-label="Resumo de usuários">
      <article><span>Usuários ativos</span><strong>{active}</strong></article>
      <article><span>Contas totais</span><strong>{rows.length}</strong></article>
      <article><span>Papéis disponíveis</span><strong>4</strong></article>
      <article><span>Proprietários</span><strong>{owners}</strong></article>
    </section>

    <section className={styles.card}>
      <header><div><h2>Gerenciar Equipe</h2><p>Gerencie o acesso dos usuários mantendo o RBAC e as ações reais do projeto.</p></div></header>
      <div className={styles.cardBody}>
        <form action={createAdminUser} className={styles.inviteRow}>
          <div className={styles.inviteInput}><AdminIcon name="users" size={14}/><input aria-label="Nome do novo usuário" name="name" placeholder="Nome do usuário" required/></div>
          <div className={styles.inviteInput}><AdminIcon name="mail" size={14}/><input aria-label="E-mail do novo usuário" name="email" type="email" placeholder="Digite o endereço de email" required/></div>
          <select aria-label="Papel do novo usuário" name="role" defaultValue="editor"><option value="owner">Owner</option><option value="admin">Admin</option><option value="editor">Editor</option><option value="viewer">Viewer</option></select>
          <input aria-label="Senha temporária" className={styles.passwordInput} name="temporaryPassword" type="password" minLength={12} placeholder="Senha temporária" required/>
          <button className={styles.primaryButton} type="submit"><AdminIcon name="plus" size={14}/>Criar usuário</button>
        </form>

        <div className={styles.teamList}>{rows.length ? rows.map((user) => <article className={styles.userRow} key={user.id}>
          <span className={styles.avatar}>{initials(user.name, user.email)}</span>
          <div className={styles.userCopy}><strong>{user.name || "Sem nome"}</strong><small>{user.email}</small></div>
          <form action={updateAdminUser} className={styles.userControls}>
            <input type="hidden" name="id" value={user.id}/>
            <input aria-label={`Nome de ${user.name}`} name="name" defaultValue={user.name}/>
            <select aria-label={`Papel de ${user.name}`} name="role" defaultValue={user.role}><option value="owner">Owner</option><option value="admin">Admin</option><option value="editor">Editor</option><option value="viewer">Viewer</option></select>
            <label className={styles.statusToggle}><input name="isActive" type="checkbox" defaultChecked={user.isActive}/><span>{user.isActive ? "Ativo" : "Inativo"}</span></label>
            <button className={styles.iconButton} aria-label={`Salvar ${user.name}`} type="submit"><AdminIcon name="check" size={15}/></button>
          </form>
          <details className={styles.passwordDetails}><summary><AdminIcon name="settings" size={14}/>Senha</summary><form action={resetAdminPassword}><input type="hidden" name="id" value={user.id}/><input aria-label={`Nova senha temporária para ${user.name}`} name="temporaryPassword" type="password" minLength={12} placeholder="Nova senha temporária" required/><button className={styles.dangerButton} type="submit">Redefinir</button></form></details>
        </article>) : <div className={styles.empty}>Nenhum usuário administrativo cadastrado.</div>}</div>
      </div>
    </section>

    <section className={styles.card}>
      <header><div><h2>Papéis e Permissões</h2><p>Os papéis existentes continuam sendo o contrato real do projeto; esta camada apenas reproduz a organização visual da referência.</p></div></header>
      <div className={styles.cardBody}><div className={styles.roles}>{[
        ["Owner", "Acesso administrativo completo"],
        ["Admin", "Administração operacional"],
        ["Editor", "Gestão de conteúdo permitida"],
        ["Viewer", "Acesso somente leitura"],
      ].map(([role, description]) => <article key={role}><span className={styles.roleIcon}><AdminIcon name="shield" size={15}/></span><div><strong>{role}</strong><small>{description}</small></div><span className={styles.roleBadge}>Sistema</span></article>)}</div></div>
    </section>
  </div>;
}
