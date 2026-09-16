import { asc } from "drizzle-orm";
import { requireAdmin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { adminUsers } from "../../../../lib/db/schema";
import { createAdminUser, resetAdminPassword, updateAdminUser } from "../../actions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireAdmin("owner");
  const rows = await getDb().select().from(adminUsers).orderBy(asc(adminUsers.name));

  return <div className="adminPage">
    <div className="adminNotice">Somente owners podem gerenciar contas, papéis, ativação e redefinição de senha.</div>

    <section className="adminPanel adminStack">
      <div className="adminSectionHeader"><div><h2>Usuários administrativos</h2><p>{rows.length} conta{rows.length === 1 ? "" : "s"} cadastrada{rows.length === 1 ? "" : "s"}. Permissões existentes foram preservadas.</p></div></div>
      {rows.length ? rows.map((user) => <article className="adminSectionCard" key={user.id}>
        <form action={updateAdminUser} className="adminForm"><input type="hidden" name="id" value={user.id}/><div className="adminFormGrid">
          <label>Nome<input name="name" defaultValue={user.name}/></label>
          <label>E-mail<input value={user.email} disabled/></label>
          <label>Role<select name="role" defaultValue={user.role}><option value="owner">Owner</option><option value="admin">Admin</option><option value="editor">Editor</option><option value="viewer">Viewer</option></select></label>
          <label className="adminCheck"><input name="isActive" type="checkbox" defaultChecked={user.isActive}/> Conta ativa</label>
        </div><div className="adminActions"><button className="adminButton" type="submit">Salvar usuário</button></div></form>
        <div className="adminDivider" />
        <form action={resetAdminPassword} className="adminForm"><input type="hidden" name="id" value={user.id}/><div className="adminFormGrid"><label>Nova senha temporária<input name="temporaryPassword" type="password" minLength={12} placeholder="Mínimo de 12 caracteres" required/></label></div><div className="adminActions"><button className="adminButton danger" type="submit">Redefinir senha</button></div></form>
      </article>) : <div className="adminEmpty">Nenhum usuário administrativo cadastrado.</div>}
    </section>

    <section className="adminPanel">
      <div className="adminSectionHeader"><div><h2>Novo usuário</h2><p>Crie uma conta utilizando o mesmo contrato de roles e senha temporária já existente.</p></div></div>
      <form action={createAdminUser} className="adminForm"><div className="adminFormGrid">
        <label>Nome<input name="name" required/></label>
        <label>E-mail<input name="email" type="email" required/></label>
        <label>Role<select name="role" defaultValue="editor"><option value="owner">Owner</option><option value="admin">Admin</option><option value="editor">Editor</option><option value="viewer">Viewer</option></select></label>
        <label>Senha temporária<input name="temporaryPassword" type="password" minLength={12} required/></label>
      </div><div className="adminActions"><button className="adminButton primary" type="submit">Criar usuário</button></div></form>
    </section>
  </div>;
}
