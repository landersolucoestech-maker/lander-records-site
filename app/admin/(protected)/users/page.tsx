import { asc } from "drizzle-orm";
import { requireAdmin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { adminUsers } from "../../../../lib/db/schema";
import { createAdminUser, resetAdminPassword, updateAdminUser } from "../../actions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireAdmin("owner");
  const rows = await getDb().select().from(adminUsers).orderBy(asc(adminUsers.name));
  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">SEGURANÇA</p><h1>Usuários administrativos</h1><p>Somente owner gerencia contas, roles, ativação e redefinição de senha.</p></div></header>
      <section className="adminPanel adminStack">{rows.map((user) => <article className="adminSectionCard" key={user.id}>
        <form action={updateAdminUser} className="adminForm"><input type="hidden" name="id" value={user.id}/><div className="adminFormGrid"><label>Nome<input name="name" defaultValue={user.name}/></label><label>E-mail<input value={user.email} disabled/></label><label>Role<select name="role" defaultValue={user.role}><option value="owner">Owner</option><option value="admin">Admin</option><option value="editor">Editor</option><option value="viewer">Viewer</option></select></label><label className="adminCheck"><input name="isActive" type="checkbox" defaultChecked={user.isActive}/> Conta ativa</label></div><button className="adminButton" type="submit">Salvar usuário</button></form>
        <form action={resetAdminPassword} className="adminInlineForm"><input type="hidden" name="id" value={user.id}/><input name="temporaryPassword" type="password" minLength={12} placeholder="Nova senha temporária" required/><span/><span/><span/><span/><span/><button className="adminButton danger" type="submit">Redefinir senha</button></form>
      </article>)}</section>
      <section className="adminPanel"><h2>Novo usuário</h2><form action={createAdminUser} className="adminForm"><div className="adminFormGrid"><label>Nome<input name="name" required/></label><label>E-mail<input name="email" type="email" required/></label><label>Role<select name="role" defaultValue="editor"><option value="owner">Owner</option><option value="admin">Admin</option><option value="editor">Editor</option><option value="viewer">Viewer</option></select></label><label>Senha temporária<input name="temporaryPassword" type="password" minLength={12} required/></label></div><button className="adminButton primary" type="submit">Criar usuário</button></form></section>
    </div>
  );
}
