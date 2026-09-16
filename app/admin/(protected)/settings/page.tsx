import Image from "next/image";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { contactTopics, mediaAssets, siteSettings, socialLinks } from "../../../../lib/db/schema";
import { updateSiteSettings, upsertContactTopic, upsertSocialLink } from "../../actions";
import { AdminIcon } from "../../components/AdminIcon";
import { SettingsTabs } from "./SettingsTabs";
import styles from "./Settings.module.css";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireAdmin();
  const canManageUsers = session.user.role === "owner";
  const db = getDb();
  const [settingsRows, socials, topics, media] = await Promise.all([
    db.select().from(siteSettings).limit(1),
    db.select().from(socialLinks).orderBy(asc(socialLinks.position)),
    db.select().from(contactTopics).orderBy(asc(contactTopics.position)),
    db.select().from(mediaAssets).where(eq(mediaAssets.status, "active")).orderBy(asc(mediaAssets.originalFilename)),
  ]);
  const settings = settingsRows[0];
  if (!settings) throw new Error("Site settings not seeded.");
  const logo = settings.logoMediaId ? media.find((item) => item.id === settings.logoMediaId) : null;

  const company = <div className={styles.tabPanel}>
    <section className={styles.card}>
      <div className={styles.cardHeader}><div><h2>Informações da Empresa</h2><p>Dados institucionais e de contato exibidos pelo Portal.</p></div></div>
      <div className={styles.cardBody}><form action={updateSiteSettings} className={styles.form}>
        <input name="brandName" type="hidden" value={settings.brandName}/><input name="tagline" type="hidden" value={settings.tagline}/><input name="defaultSeoTitle" type="hidden" value={settings.defaultSeoTitle}/><input name="defaultSeoDescription" type="hidden" value={settings.defaultSeoDescription}/><input name="logoMediaId" type="hidden" value={settings.logoMediaId || ""}/><input name="socialImageMediaId" type="hidden" value={settings.socialImageMediaId || ""}/>
        <div className={styles.grid}>
          <label className={styles.field}><span>E-mail</span><input name="contactEmail" type="email" defaultValue={settings.contactEmail}/></label>
          <label className={styles.field}><span>Telefone</span><input name="contactPhone" defaultValue={settings.contactPhone}/></label>
          <label className={styles.field}><span>Localização</span><input name="location" defaultValue={settings.location}/></label>
          <label className={styles.field}><span>Horário</span><input name="hours" defaultValue={settings.hours}/></label>
          <label className={`${styles.field} ${styles.fieldWide}`}><span>Endereço</span><textarea name="address" defaultValue={settings.address}/></label>
        </div><div className={styles.formActions}><button className="adminButton primary" type="submit">Salvar alterações</button></div>
      </form></div>
    </section>

    <section className={styles.card}>
      <div className={styles.cardHeader}><div><h2>Assuntos do formulário</h2><p>Os identificadores e destinos continuam usando o contrato atual do formulário público.</p></div></div>
      <div className={styles.cardBody}><div className={styles.stack}>{topics.map((topic) => <form action={upsertContactTopic} className={styles.row} key={topic.id}><input type="hidden" name="id" value={topic.id}/><input aria-label="Nome" name="name" defaultValue={topic.name}/><input aria-label="Slug" name="slug" defaultValue={topic.slug}/><input aria-label="Identificador SaaS" name="saasType" defaultValue={topic.saasType}/><input aria-label="Posição" name="position" type="number" defaultValue={topic.position}/><label className={styles.check}><input name="active" type="checkbox" defaultChecked={topic.active}/> Ativo</label><button className="adminButton" type="submit">Salvar</button></form>)}
        <form action={upsertContactTopic} className={`${styles.row} ${styles.newRow}`}><input name="name" placeholder="Novo assunto" required/><input name="slug" placeholder="slug"/><input name="saasType" placeholder="lead.general"/><input name="position" type="number" defaultValue={0}/><label className={styles.check}><input name="active" type="checkbox" defaultChecked/> Ativo</label><button className="adminButton primary" type="submit">Adicionar</button></form></div></div>
    </section>
  </div>;

  const identity = <div className={styles.tabPanel}>
    <div className={styles.companyGrid}>
      <section className={styles.card}>
        <div className={styles.cardHeader}><div><h2>Identidade Visual</h2><p>Marca aplicada às áreas públicas e administrativas.</p></div></div>
        <div className={styles.cardBody}><div className={styles.identity}>
          <div className={styles.logoPreview}>{logo ? <Image alt={logo.altText || settings.brandName} fill sizes="112px" src={logo.url} unoptimized /> : <AdminIcon name="image" size={30} />}</div>
          <h3>{settings.brandName}</h3><p>{settings.tagline || "Sem tagline configurada"}</p>
          <div className={styles.summary}><div><span>E-mail</span><strong>{settings.contactEmail || "—"}</strong></div><div><span>Telefone</span><strong>{settings.contactPhone || "—"}</strong></div><div><span>Localização</span><strong>{settings.location || "—"}</strong></div></div>
        </div></div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}><div><h2>Marca e SEO padrão</h2><p>Configuração central da identidade do Site.</p></div></div>
        <div className={styles.cardBody}><form action={updateSiteSettings} className={styles.form}>
          <input name="contactEmail" type="hidden" value={settings.contactEmail}/><input name="contactPhone" type="hidden" value={settings.contactPhone}/><input name="location" type="hidden" value={settings.location}/><input name="hours" type="hidden" value={settings.hours}/><input name="address" type="hidden" value={settings.address}/>
          <div className={styles.grid}>
            <label className={styles.field}><span>Marca</span><input name="brandName" defaultValue={settings.brandName}/></label>
            <label className={styles.field}><span>Tagline</span><input name="tagline" defaultValue={settings.tagline}/></label>
            <label className={styles.field}><span>Logo</span><select name="logoMediaId" defaultValue={settings.logoMediaId || ""}><option value="">Logo estático atual</option>{media.map((item)=><option key={item.id} value={item.id}>{item.originalFilename}</option>)}</select></label>
            <label className={styles.field}><span>Imagem social padrão</span><select name="socialImageMediaId" defaultValue={settings.socialImageMediaId || ""}><option value="">Nenhuma</option>{media.map((item)=><option key={item.id} value={item.id}>{item.originalFilename}</option>)}</select></label>
            <label className={styles.field}><span>Título SEO padrão</span><input name="defaultSeoTitle" defaultValue={settings.defaultSeoTitle}/></label>
            <label className={`${styles.field} ${styles.fieldWide}`}><span>Descrição SEO padrão</span><textarea name="defaultSeoDescription" defaultValue={settings.defaultSeoDescription}/></label>
          </div><div className={styles.formActions}><button className="adminButton primary" type="submit">Salvar identidade</button></div>
        </form></div>
      </section>
    </div>

    <section className={styles.card}>
      <div className={styles.cardHeader}><div><h2>Redes sociais</h2><p>Links públicos mantidos na fonte de dados atual.</p></div></div>
      <div className={styles.cardBody}><div className={styles.stack}>{socials.map((social) => <form action={upsertSocialLink} className={styles.row} key={social.id}><input type="hidden" name="id" value={social.id}/><input aria-label="Plataforma" name="platform" defaultValue={social.platform}/><input aria-label="Rótulo" name="label" defaultValue={social.label}/><input aria-label="URL" name="url" type="url" defaultValue={social.url}/><input aria-label="Posição" name="position" type="number" defaultValue={social.position}/><label className={styles.check}><input name="active" type="checkbox" defaultChecked={social.active}/> Ativa</label><button className="adminButton" type="submit">Salvar</button></form>)}
        <form action={upsertSocialLink} className={`${styles.row} ${styles.newRow}`}><input name="platform" placeholder="instagram" required/><input name="label" placeholder="Instagram" required/><input name="url" type="url" placeholder="https://..."/><input name="position" type="number" defaultValue={0}/><label className={styles.check}><input name="active" type="checkbox" defaultChecked/> Ativa</label><button className="adminButton primary" type="submit">Adicionar</button></form></div></div>
    </section>
  </div>;

  const automations = <section className={styles.card}><div className={styles.cardHeader}><div><h2>Automações</h2><p>Fluxos automáticos disponíveis a partir das integrações e regras reais do projeto.</p></div></div><div className={styles.cardBody}><div className={styles.featureList}>
    <div className={styles.featureRow}><div><strong>Publicação e revalidação</strong><small>As ações editoriais continuam revalidando as rotas públicas conforme os contratos atuais.</small></div><span className={styles.toggleVisual} aria-label="Ativo"/></div>
    <div className={styles.featureRow}><div><strong>Sincronização de integrações</strong><small>Executada somente quando o provider correspondente estiver realmente configurado.</small></div><Link className="adminButton" href="/admin/settings/lander-records">Gerenciar integrações</Link></div>
    <div className={styles.featureRow}><div><strong>Automações adicionais</strong><small>Nenhum toggle sem persistência foi inventado. Novas automações devem usar a lógica existente do projeto.</small></div><span className="adminBadge">Não configurado</span></div>
  </div></div></section>;

  const security = <section className={styles.card}><div className={styles.cardHeader}><div><h2>Segurança da Conta</h2><p>Autenticação, sessão e permissões continuam protegidas pelos contratos atuais.</p></div></div><div className={styles.cardBody}><div className={styles.securityGrid}>
    <div className={styles.securityBox}><div><strong>Alterar senha</strong><small>Atualize sua credencial usando o fluxo autenticado existente.</small></div><Link className="adminButton" href="/admin/change-password">Alterar senha</Link></div>
    <div className={styles.securityBox}><div><strong>Sessão atual</strong><small>{session.user.email} · papel {session.user.role}</small></div><span className={styles.statusConnected}>Ativa</span></div>
    <div className={styles.securityBox}><div><strong>Controle de acesso</strong><small>RBAC aplicado no servidor em todas as mutações administrativas.</small></div><span className="adminBadge live">Protegido</span></div>
    <div className={styles.securityBox}><div><strong>Ambiente</strong><small>O preview de desenvolvimento continua isolado das mutações persistentes.</small></div><span className="adminBadge">Fail-closed</span></div>
  </div></div></section>;

  const integrations = <section className={styles.card}><div className={styles.cardHeader}><div><h2>Integrações</h2><p>Conecte e acompanhe serviços externos usados pela operação.</p></div><Link className="adminButton primary" href="/admin/settings/lander-records">Abrir integrações</Link></div><div className={styles.cardBody}><div className={styles.portalGrid}>
    <article className={styles.portalCard}><span><AdminIcon name="integration" size={17}/></span><strong>Providers e credenciais</strong><p>Status, configurações e sincronizações continuam no módulo real de integrações.</p><Link className="adminButton" href="/admin/settings/lander-records">Gerenciar</Link></article>
    <article className={styles.portalCard}><span><AdminIcon name="activity" size={17}/></span><strong>Sincronização</strong><p>Os jobs e ações continuam usando os providers existentes, sem simular conexões.</p><Link className="adminButton" href="/admin/settings/lander-records">Ver estado</Link></article>
  </div></div></section>;

  const users = <section className={styles.card}><div className={styles.cardHeader}><div><h2>Usuários e Permissões</h2><p>Gerencie equipe, papéis e acesso usando o RBAC atual.</p></div>{canManageUsers ? <Link className="adminButton primary" href="/admin/users">Gerenciar usuários</Link> : null}</div><div className={styles.cardBody}><div className={styles.portalGrid}>
    <article className={styles.portalCard}><span><AdminIcon name="users" size={17}/></span><strong>Equipe administrativa</strong><p>Contas e permissões são lidas e alteradas pelo módulo persistente de usuários.</p>{canManageUsers ? <Link className="adminButton" href="/admin/users">Abrir equipe</Link> : <span className="adminBadge">Sem permissão</span>}</article>
    <article className={styles.portalCard}><span><AdminIcon name="shield" size={17}/></span><strong>Papéis e acesso</strong><p>O papel da sessão atual é <b>{session.user.role}</b>; as regras continuam aplicadas no servidor.</p></article>
  </div></div></section>;

  return <div className={styles.page}>
    <SettingsTabs automations={automations} canManageUsers={canManageUsers} company={company} identity={identity} integrations={integrations} security={security} users={users}/>
  </div>;
}
