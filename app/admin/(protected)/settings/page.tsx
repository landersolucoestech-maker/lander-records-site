import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { contactTopics, mediaAssets, siteSettings, socialLinks } from "../../../../lib/db/schema";
import { updateSiteSettings, upsertContactTopic, upsertSocialLink } from "../../actions";

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

  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">CONFIGURAÇÃO</p><h1>Site</h1><p>Identidade, contato, SEO padrão, redes sociais e assuntos do formulário.</p></div></header>
      <section className="adminPanel"><h2>Informações gerais</h2><form action={updateSiteSettings} className="adminForm"><div className="adminFormGrid">
        <label>Marca<input name="brandName" defaultValue={settings.brandName}/></label><label>Tagline<input name="tagline" defaultValue={settings.tagline}/></label>
        <label>E-mail<input name="contactEmail" type="email" defaultValue={settings.contactEmail}/></label><label>Telefone<input name="contactPhone" defaultValue={settings.contactPhone}/></label>
        <label>Localização<input name="location" defaultValue={settings.location}/></label><label>Horário<input name="hours" defaultValue={settings.hours}/></label>
        <label className="full">Endereço<textarea name="address" defaultValue={settings.address}/></label>
        <label>Título SEO padrão<input name="defaultSeoTitle" defaultValue={settings.defaultSeoTitle}/></label><label>Logo<select name="logoMediaId" defaultValue={settings.logoMediaId || ""}><option value="">Logo estático atual</option>{media.map((m)=><option key={m.id} value={m.id}>{m.originalFilename}</option>)}</select></label>
        <label className="full">Descrição SEO padrão<textarea name="defaultSeoDescription" defaultValue={settings.defaultSeoDescription}/></label>
        <label>Imagem social padrão<select name="socialImageMediaId" defaultValue={settings.socialImageMediaId || ""}><option value="">Nenhuma</option>{media.map((m)=><option key={m.id} value={m.id}>{m.originalFilename}</option>)}</select></label>
      </div><button className="adminButton primary" type="submit">Salvar configurações</button></form></section>

      <section className="adminPanel adminStack"><h2>Redes sociais</h2>{socials.map((social) => <form action={upsertSocialLink} className="adminInlineForm" key={social.id}><input type="hidden" name="id" value={social.id}/><input name="platform" defaultValue={social.platform}/><input name="label" defaultValue={social.label}/><input name="url" type="url" defaultValue={social.url}/><input name="position" type="number" defaultValue={social.position}/><label className="adminCheck"><input name="active" type="checkbox" defaultChecked={social.active}/> Ativa</label><span/><button className="adminButton" type="submit">Salvar</button></form>)}
        <form action={upsertSocialLink} className="adminInlineForm"><input name="platform" placeholder="instagram" required/><input name="label" placeholder="Instagram" required/><input name="url" type="url" placeholder="https://..."/><input name="position" type="number" defaultValue={0}/><label className="adminCheck"><input name="active" type="checkbox" defaultChecked/> Ativa</label><span/><button className="adminButton primary" type="submit">Adicionar</button></form>
      </section>

      <section className="adminPanel adminStack"><h2>Assuntos do formulário</h2><p>O campo <code>saasType</code> é o identificador estável enviado ao SaaS quando a integração for conectada.</p>
        {topics.map((topic) => <form action={upsertContactTopic} className="adminInlineForm" key={topic.id}><input type="hidden" name="id" value={topic.id}/><input name="name" defaultValue={topic.name}/><input name="slug" defaultValue={topic.slug}/><input name="saasType" defaultValue={topic.saasType}/><input name="position" type="number" defaultValue={topic.position}/><label className="adminCheck"><input name="active" type="checkbox" defaultChecked={topic.active}/> Ativo</label><span/><button className="adminButton" type="submit">Salvar</button></form>)}
        <form action={upsertContactTopic} className="adminInlineForm"><input name="name" placeholder="Novo assunto" required/><input name="slug" placeholder="slug"/><input name="saasType" placeholder="lead.general"/><input name="position" type="number" defaultValue={0}/><label className="adminCheck"><input name="active" type="checkbox" defaultChecked/> Ativo</label><span/><button className="adminButton primary" type="submit">Adicionar</button></form>
      </section>
    </div>
  );
}
