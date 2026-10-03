import { desc, eq, sql } from "drizzle-orm";
import { requireAdmin } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { mockDataEnabled } from "../../../../lib/mocks";
import { contactSubmissions, contactTopics } from "../../../../lib/db/schema";
import { updateContactSubmissionStatus } from "../../actions";
import { AdminIcon } from "../../components/AdminIcon";
import styles from "../DashboardCrud.module.css";

export const dynamic = "force-dynamic";

const statusLabels = { new: "Novo", processing: "Em atendimento", exported: "Exportado", spam: "Spam", archived: "Arquivado" } as const;
type ContactStatus = keyof typeof statusLabels;

function Metric({ label, value, hint }: { label: string; value: number; hint: string }) {
  return <article className="adminMetricCard"><span className="adminMetricIcon"><AdminIcon name="mail" size={24}/></span><div className="adminMetricCopy"><span>{label}</span><strong>{new Intl.NumberFormat("pt-BR").format(value)}</strong><small>{hint}</small></div></article>;
}

export default async function ContactsPage() {
  const session = await requireAdmin();
  const mockMode = mockDataEnabled();
  const canEdit = !mockMode && session.source === "session" && session.user.role !== "viewer";
  if (mockMode) {
    return <div className="adminDashboard" data-testid="contacts-manager"><section className={`adminDashboardPanel ${styles.panel}`}><div className="adminAnalyticsPanelHeading"><div className="adminPanelHeadingIdentity"><span className="adminPanelHeadingIcon"><AdminIcon name="mail" size={20}/></span><div><h2>Contatos recebidos</h2><p>O preview usa dados descartáveis e não expõe mensagens reais.</p></div></div></div><div className={styles.empty}>Nenhum contato persistente é carregado no modo de demonstração.</div></section></div>;
  }
  const db = getDb();
  const [rows, counts] = await Promise.all([
    db.select({ submission: contactSubmissions, topicName: contactTopics.name }).from(contactSubmissions).leftJoin(contactTopics, eq(contactSubmissions.topicId, contactTopics.id)).orderBy(desc(contactSubmissions.createdAt)).limit(500),
    db.select({ status: contactSubmissions.status, count: sql<number>`count(*)::int` }).from(contactSubmissions).groupBy(contactSubmissions.status),
  ]);
  const totals = Object.fromEntries(counts.map((item) => [item.status, item.count])) as Partial<Record<ContactStatus, number>>;

  return <div className="adminDashboard" data-testid="contacts-manager">
    <section className="adminMetricGrid" aria-label="Resumo de contatos">
      <Metric label="Novos" value={totals.new || 0} hint="aguardando atendimento"/>
      <Metric label="Em atendimento" value={totals.processing || 0} hint="em acompanhamento"/>
      <Metric label="Exportados" value={totals.exported || 0} hint="encaminhados à operação"/>
      <Metric label="Arquivados / spam" value={(totals.archived || 0) + (totals.spam || 0)} hint="fora da fila ativa"/>
    </section>

    <section className={`adminDashboardPanel ${styles.panel}`}>
      <div className="adminAnalyticsPanelHeading"><div className="adminPanelHeadingIdentity"><span className="adminPanelHeadingIcon"><AdminIcon name="mail" size={20}/></span><div><h2>Contatos recebidos</h2><p>Mensagens persistidas pelo formulário público, com consentimento e atribuição de origem.</p></div></div></div>
      {rows.length ? <div className={styles.tableWrap}><table className={styles.table}>
        <thead><tr><th>Data</th><th>Contato</th><th>Assunto</th><th>Mensagem</th><th>Origem</th><th>Status</th></tr></thead>
        <tbody>{rows.map(({ submission, topicName }) => <tr key={submission.id}>
          <td>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(submission.createdAt)}</td>
          <td><strong>{submission.name}</strong><br/><a href={`mailto:${submission.email}`}>{submission.email}</a>{submission.phone ? <><br/><small>{submission.phone}</small></> : null}</td>
          <td>{topicName || "Assunto removido"}</td>
          <td><span title={submission.message}>{submission.message.length > 180 ? `${submission.message.slice(0, 180)}…` : submission.message}</span><br/><small>Consentimento: {submission.consent ? "sim" : "não"} · {submission.consentVersion}</small></td>
          <td>{submission.utmSource || submission.source || "direto"}{submission.utmCampaign ? <><br/><small>{submission.utmCampaign}</small></> : null}{submission.referrer ? <><br/><small title={submission.referrer}>com referência</small></> : null}</td>
          <td>{canEdit ? <form action={updateContactSubmissionStatus}><input type="hidden" name="id" value={submission.id}/><select aria-label={`Status de ${submission.name}`} name="status" defaultValue={submission.status}>{Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><button className="adminButton" type="submit">Salvar</button></form> : <span className="adminBadge">{statusLabels[submission.status]}</span>}</td>
        </tr>)}</tbody>
      </table></div> : <div className={styles.empty}>Nenhum contato recebido até o momento.</div>}
    </section>
  </div>;
}
