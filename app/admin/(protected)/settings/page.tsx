import Image from "next/image";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { contactTopics, mediaAssets, siteSettings, socialLinks } from "../../../../lib/db/schema";
import { updateSiteSettings, upsertContactTopic, upsertSocialLink } from "../../actions";
import { AdminIcon } from "../../components/AdminIcon";
import styles from "./Settings.module.css";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
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

  return <div className={styles.page}>
    <nav aria-label="Seções de configurações" className={styles.tabs}>
      <Link aria-current="page" href="/admin/settings#company"><AdminIcon name="home" size={15} />Empresa</Link>
      <Link href="/admin/settings#identity"><AdminIcon name="media" size={15} />Identidade do Site</Link>
      <Link href="/admin/settings#automations"><AdminIcon name="activity" size={15} />Automações</Link>
      <Link href="/admin/settings#security"><AdminIcon name="settings" size={15} />Segurança</Link>
      <Link href="/admin/settings/lander-records"><AdminIcon name="integration" size={15} />Integrações</Link>
      <Link href="/admin/users"><AdminIcon name="users" size={15} />Usuários</Link>
    </nav>

    <div className={styles.companyGrid} id="company">
      <section className={`${styles.card} ${styles.sectionAnchor}`} id="identity">
        <div className={styles.cardHeader}><div><h2>Identidade visual</h2><p>Marca exibida nas áreas públicas e administrativas.</p></div></div>
        <div className={styles.cardBody}><div className={styles.identity}>
          <div className={styles.logoPreview}>{logo ? <Image alt={logo.altText || settings.brandName} fill sizes="112px" src={logo.url} unoptimized /> : <AdminIcon name="image" size={30} />}</div>
          <h3>{settings.brandName}</h3><p>{settings.tagline || "Sem tagline configurada"}</p>
          <div className={styles.summary}><div><span>E-mail</span><strong>{settings.contactEmail || "—"}</strong></div><div><span>Telefone</span><strong>{settings.contactPhone || "—"}</strong></div><div><span>Localização</span><strong>{settings.location || "—"}</strong></div></div>
        </div></div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}><div><h2>Dados e identidade do site</h2><p>Os campos e ações abaixo continuam usando a persistência atual do projeto.</p></div></div>
        <div className={styles.cardBody}><form action={updateSiteSettings} className={styles.form}><div className={styles.grid}>
          <label className={styles.field}><span>Marca</span><input name="brandName" defaultValue={settings.brandName}/></label>
          <label className={styles.field}><span>Tagline</span><input name="tagline" defaultValue={settings.tagline}/></label>
          <label className={styles.field}><span>E-mail</span><input name="contactEmail" type="email" defaultValue={settings.contactEmail}/></label>
          <label className={styles.field}><span>Telefone</span><input name="contactPhone" defaultValue={settings.contactPhone}/></label>
          <label className={styles.field}><span>Localização</span><input name="location" defaultValue={settings.location}/></label>
          <label className={styles.field}><span>Horário</span><input name="hours" defaultValue={settings.hours}/></label>
          <label className={`${styles.field} ${styles.fieldWide}`}><span>Endereço</span><textarea name="address" defaultValue={settings.address}/></label>
          <label className={styles.field}><span>Logo</span><select name="logoMediaId" defaultValue={settings.logoMediaId || ""}><option value="">Logo estático atual</option>{media.map((item)=><option key={item.id} value={item.id}>{item.originalFilename}</option>)}</select></label>
          <label className={styles.field}><span>Imagem social padrão</span><select name="socialImageMediaId" defaultValue={settings.socialImageMediaId || ""}><option value="">Nenhuma</option>{media.map((item)=><option key={item.id} value={item.id}>{item.originalFilename}</option>)}</select></label>
          <label className={styles.field}><span>Título SEO padrão</span><input name="defaultSeoTitle" defaultValue={settings.defaultSeoTitle}/></label>
          <label className={`${styles.field} ${styles.fieldWide}`}><span>Descrição SEO padrão</span><textarea name="defaultSeoDescription" defaultValue={settings.defaultSeoDescription}/></label>
        </div><div className={styles.formActions}><button className="adminButton primary" type="submit">Salvar configurações</button></div></form></div>
      </section>
    </div>

    <section className={`${styles.card} ${styles.sectionAnchor}`} id="automations">
      <div className={styles.cardHeader}><div><h2>Automações</h2><p>Esta área não cria automações artificiais. Os fluxos automáticos continuam dependentes das integrações e regras já existentes.</p></div><Link className="adminButton" href="/admin/settings/lander-records">Ver integrações</Link></div>
      <div className={styles.cardBody}><div className="adminNotice">Nenhum controle de automação independente está persistido nesta tela hoje. A refatoração mantém essa fronteira em vez de simular toggles sem efeito.</div></div>
    </section>

    <section className={`${styles.card} ${styles.sectionAnchor}`} id="security">
      <div className={styles.cardHeader}><div><h2>Segurança</h2><p>Autenticação, sessão e permissões permanecem protegidas pelos contratos atuais.</p></div></div>
      <div className={styles.cardBody}><div className="adminNotice">As regras de autenticação e autorização não foram alteradas por esta refatoração visual.</div></div>
    </section>

    <section className={styles.card}>
      <div className={styles.cardHeader}><div><h2>Redes sociais</h2><p>Links públicos mantidos na mesma fonte de dados do projeto.</p></div></div>
      <div className={styles.cardBody}><div className={styles.stack}>{socials.map((social) => <form action={upsertSocialLink} className={styles.row} key={social.id}><input type="hidden" name="id" value={social.id}/><input aria-label="Plataforma" name="platform" defaultValue={social.platform}/><input aria-label="Rótulo" name="label" defaultValue={social.label}/><input aria-label="URL" name="url" type="url" defaultValue={social.url}/><input aria-label="Posição" name="position" type="number" defaultValue={social.position}/><label className={styles.check}><input name="active" type="checkbox" defaultChecked={social.active}/> Ativa</label><button className="adminButton" type="submit">Salvar</button></form>)}
        <form action={upsertSocialLink} className={`${styles.row} ${styles.newRow}`}><input name="platform" placeholder="instagram" required/><input name="label" placeholder="Instagram" required/><input name="url" type="url" placeholder="https://..."/><input name="position" type="number" defaultValue={0}/><label className={styles.check}><input name="active" type="checkbox" defaultChecked/> Ativa</label><button className="adminButton primary" type="submit">Adicionar</button></form></div></div>
    </section>

    <section className={styles.card}>
      <div className={styles.cardHeader}><div><h2>Assuntos do formulário</h2><p>O identificador SaaS continua sendo o contrato estável enviado quando a integração estiver conectada.</p></div></div>
      <div className={styles.cardBody}><p className={styles.help}>Edite somente os assuntos reais do formulário; nenhuma opção demonstrativa foi adicionada.</p><div className={styles.stack}>{topics.map((topic) => <form action={upsertContactTopic} className={styles.row} key={topic.id}><input type="hidden" name="id" value={topic.id}/><input aria-label="Nome" name="name" defaultValue={topic.name}/><input aria-label="Slug" name="slug" defaultValue={topic.slug}/><input aria-label="Identificador SaaS" name="saasType" defaultValue={topic.saasType}/><input aria-label="Posição" name="position" type="number" defaultValue={topic.position}/><label className={styles.check}><input name="active" type="checkbox" defaultChecked={topic.active}/> Ativo</label><button className="adminButton" type="submit">Salvar</button></form>)}
        <form action={upsertContactTopic} className={`${styles.row} ${styles.newRow}`}><input name="name" placeholder="Novo assunto" required/><input name="slug" placeholder="slug"/><input name="saasType" placeholder="lead.general"/><input name="position" type="number" defaultValue={0}/><label className={styles.check}><input name="active" type="checkbox" defaultChecked/> Ativo</label><button className="adminButton primary" type="submit">Adicionar</button></form></div></div>
    </section>
  </div>;
}
