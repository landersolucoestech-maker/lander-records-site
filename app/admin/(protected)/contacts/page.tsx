import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { contactSubmissions, contactTopics, integrationOutbox } from "../../../../lib/db/schema";
import { retryContactDelivery, updateContactStatus } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const db = getDb();
  const [contacts, topics, outbox] = await Promise.all([
    db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt)).limit(250),
    db.select().from(contactTopics),
    db.select().from(integrationOutbox).where(eq(integrationOutbox.aggregateType, "contact_submission")).orderBy(desc(integrationOutbox.createdAt)).limit(250),
  ]);
  const topicMap = new Map(topics.map((topic) => [topic.id, topic]));
  const outboxMap = new Map(outbox.map((event) => [event.aggregateId, event]));

  return (
    <div className="adminPage">
      <header className="adminPageHeader"><div><p className="adminEyebrow">CRM INTAKE</p><h1>Contatos / Leads</h1><p>Submissões persistidas, atribuição, consentimento e status de entrega ao SaaS.</p></div></header>
      <section className="adminPanel adminStack">
        {contacts.length === 0 ? <div className="adminEmpty">Nenhum contato recebido.</div> : contacts.map((contact) => {
          const topic = contact.topicId ? topicMap.get(contact.topicId) : null;
          const event = outboxMap.get(contact.id);
          return <article className="adminSectionCard" key={contact.id}>
            <div className="adminPageHeader"><div><strong>{contact.name}</strong><div><a href={`mailto:${contact.email}`}>{contact.email}</a>{contact.phone ? ` · ${contact.phone}` : ""}</div></div><span className="adminBadge">{contact.status}</span></div>
            <div><strong>Assunto:</strong> {topic?.name || "—"} <span className="adminCode">{topic?.saasType || ""}</span></div>
            <p>{contact.message}</p>
            <div><strong>Origem:</strong> {contact.source} · {contact.pagePath || "—"} · referrer {contact.referrer || "—"}</div>
            <div><strong>UTM:</strong> source={contact.utmSource || "—"} medium={contact.utmMedium || "—"} campaign={contact.utmCampaign || "—"}</div>
            <div><strong>Consentimento:</strong> {contact.consent ? "Sim" : "Não"} · versão {contact.consentVersion} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(contact.consentAt)}</div>
            <div><strong>Integração SaaS:</strong> <span className={`adminBadge ${event?.status === "delivered" ? "live" : event?.status === "failed" ? "archived" : "draft"}`}>{event?.status || "sem evento"}</span> {event?.lastError ? <span>{event.lastError}</span> : null}</div>
            <div className="adminActions">
              {["new","processing","exported","spam","archived"].map((status) => <form action={updateContactStatus} key={status}><input type="hidden" name="id" value={contact.id}/><input type="hidden" name="status" value={status}/><button className="adminButton" type="submit">{status}</button></form>)}
              {event && event.status !== "delivered" ? <form action={retryContactDelivery}><input type="hidden" name="outboxId" value={event.id}/><button className="adminButton primary" type="submit">Tentar integração novamente</button></form> : null}
            </div>
          </article>;
        })}
      </section>
    </div>
  );
}
