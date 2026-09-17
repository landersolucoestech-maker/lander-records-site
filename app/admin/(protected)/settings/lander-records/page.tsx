import Link from "next/link";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../../../../../lib/auth";
import { hasMinimumRole } from "../../../../../lib/auth/policy";
import { getDb } from "../../../../../lib/db";
import { integrationMetricCache, landerRecordsIntegrationSettings } from "../../../../../lib/db/integration-schema";
import { soundchartsCredentialsConfigured } from "../../../../../lib/integrations/soundcharts";
import { spotifyCredentialsConfigured } from "../../../../../lib/integrations/spotify";
import { saveLanderRecordsIntegrationSettings, syncLanderRecordsIntegrationsAction } from "../../../integration-actions";
import { AdminIcon } from "../../../components/AdminIcon";
import settingsStyles from "../Settings.module.css";
import styles from "./Integrations.module.css";

export const dynamic = "force-dynamic";

function dateLabel(value: Date | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(value) : "Nunca";
}

function Status({ ready, label }: { ready: boolean; label: string }) {
  return <span className={`${styles.status} ${ready ? styles.connected : styles.pending}`}><i aria-hidden="true" />{label}</span>;
}

export default async function LanderRecordsIntegrationSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; synced?: string; spotify?: string }> }) {
  const session = await requireAdmin();
  const persistent = session.source === "session";
  const canEdit = persistent && hasMinimumRole(session.user.role, "editor");
  const canManageUsers = persistent && session.user.role === "owner";
  const db = getDb();
  const [rows, metricRows] = await Promise.all([
    db.select().from(landerRecordsIntegrationSettings).where(eq(landerRecordsIntegrationSettings.key, "lander_records")).limit(1),
    db.select().from(integrationMetricCache).where(eq(integrationMetricCache.entityType, "lander_records")),
  ]);
  const settings = rows[0] || {
    instagramUrl: "", youtubeUrl: "", spotifyPlaylistUrl: "", spotifyPlaylistId: "", spotifyUserId: "", spotifyConnectedAt: null, spotifyLastSyncedAt: null, spotifyLastError: "", soundchartsArtistUuid: "", soundchartsResolutionStatus: "unresolved", soundchartsMatchedVia: "", soundchartsLastSyncedAt: null, soundchartsLastError: "",
  };
  const metrics = Object.fromEntries(metricRows.map((row) => [`${row.platform}:${row.metric}`, row.value]));
  const params = await searchParams;
  const spotifyReady = spotifyCredentialsConfigured() && Boolean(process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY?.trim());
  const soundchartsReady = soundchartsCredentialsConfigured();
  const spotifyConnected = spotifyReady && Boolean(settings.spotifyConnectedAt);
  const soundchartsConnected = soundchartsReady && settings.soundchartsResolutionStatus === "resolved";

  return <div className={styles.page}>
    <nav aria-label="Seções de configurações" className={settingsStyles.tabs}>
      <Link href="/admin/settings"><AdminIcon name="home" size={15}/>Empresa</Link>
      <Link href="/admin/settings#identity"><AdminIcon name="media" size={15}/>Identidade do Site</Link>
      <Link href="/admin/settings#automations"><AdminIcon name="activity" size={15}/>Automações</Link>
      <Link href="/admin/settings#security"><AdminIcon name="shield" size={15}/>Segurança</Link>
      <Link aria-current="page" href="/admin/settings/lander-records"><AdminIcon name="integration" size={15}/>Integrações</Link>
      {canManageUsers ? <Link href="/admin/users"><AdminIcon name="users" size={15}/>Usuários</Link> : null}
    </nav>

    {params.saved === "1" ? <div className="adminNotice">Configurações salvas.</div> : null}
    {params.synced === "1" ? <div className="adminNotice">Sincronização executada. Consulte os estados abaixo.</div> : null}
    {params.spotify === "connected" ? <div className="adminNotice">Conta Spotify conectada com sucesso.</div> : null}
    {params.spotify === "error" ? <div className="adminNotice error">Não foi possível concluir a conexão com o Spotify.</div> : null}
    {!canEdit ? <div className="adminNotice">Integrações em modo somente leitura para esta sessão.</div> : null}

    <section className={styles.card}>
      <header><div><h2>Identidade e destinos externos</h2><p>URLs oficiais utilizadas pelas integrações. Credenciais permanecem exclusivamente no servidor.</p></div>{!canEdit ? <span className="adminBadge">Somente leitura</span> : null}</header>
      <div className={styles.cardBody}><form action={saveLanderRecordsIntegrationSettings} className={styles.form}><div className={styles.grid}>
        <label><span>Instagram da Lander Records</span><input disabled={!canEdit} name="instagramUrl" type="url" defaultValue={settings.instagramUrl} placeholder="https://instagram.com/..." /></label>
        <label><span>YouTube da Lander Records</span><input disabled={!canEdit} name="youtubeUrl" type="url" defaultValue={settings.youtubeUrl} placeholder="https://youtube.com/@..." /></label>
        <label className={styles.wide}><span>Playlist da seção “Últimos Lançamentos”</span><input disabled={!canEdit} name="spotifyPlaylistUrl" type="url" defaultValue={settings.spotifyPlaylistUrl} placeholder="https://open.spotify.com/playlist/..." /><small>Fonte única da seção da página inicial. O site lê automaticamente a playlist e exibe no máximo 5 faixas, usando capa, título, artista, data de lançamento e link oficial do Spotify. Não cadastre lançamentos manualmente.</small></label>
      </div>{canEdit ? <div className={styles.actions}><button className={styles.primaryButton} type="submit">Salvar configurações</button></div> : null}</form></div>
    </section>

    <section className={styles.card}>
      <header><div><h2>Integrações</h2><p>Conecte serviços externos e acompanhe o estado real de sincronização do projeto.</p></div></header>
      <div className={styles.cardBody}><div className={styles.integrationGroups}>
        <section><h3>Streaming & audiência</h3><div className={styles.integrationList}>
          <article><div className={styles.logo}>SP</div><div className={styles.integrationCopy}><strong>Spotify · Últimos Lançamentos</strong><p>A playlist configurada acima alimenta automaticamente a seção logo abaixo de Artistas na Home. A sincronização é renovada quando o cache expira e também pode ser forçada manualmente.</p><div className={styles.meta}><span>Última sincronização: {dateLabel(settings.spotifyLastSyncedAt)}</span><span>Playlist: {settings.spotifyPlaylistId || "não resolvida"}</span></div></div><Status ready={spotifyConnected} label={spotifyConnected ? "Conectado" : spotifyReady ? "Aguardando conexão" : "Credenciais pendentes"}/>{canEdit && spotifyReady ? <a className={styles.outlineButton} href="/api/integrations/spotify/connect">{settings.spotifyConnectedAt ? "Reconectar" : "Conectar"}</a> : <span />}</article>
          <article><div className={styles.logo}>SC</div><div className={styles.integrationCopy}><strong>Soundcharts</strong><p>Matching determinístico por URL/ID oficial, mantendo IDs de provider separados do artista interno.</p><div className={styles.meta}><span>Última sincronização: {dateLabel(settings.soundchartsLastSyncedAt)}</span><span>UUID: {settings.soundchartsArtistUuid || "não resolvido"}</span></div></div><Status ready={soundchartsConnected} label={soundchartsReady ? soundchartsConnected ? "Resolvido" : "Pendente" : "Credenciais pendentes"}/><span className={styles.metricPair}>{metrics["instagram:followers"]?.toLocaleString("pt-BR") || "—"}<small>seguidores</small></span></article>
        </div></section>
      </div>
      {settings.spotifyLastError ? <div className="adminNotice error">Spotify: {settings.spotifyLastError}</div> : null}
      {settings.soundchartsLastError ? <div className="adminNotice error">Soundcharts: {settings.soundchartsLastError}</div> : null}
    </div></section>

    <section className={styles.card}>
      <header><div><h2>Sincronização</h2><p>A Home atualiza automaticamente o feed quando necessário. Use esta ação somente para forçar uma atualização imediata das fontes conectadas.</p></div>{!canEdit ? <span className="adminBadge">Somente leitura</span> : null}</header>
      <div className={styles.cardBody}>{canEdit ? <form action={syncLanderRecordsIntegrationsAction}><button className={styles.primaryButton} type="submit"><AdminIcon name="activity" size={15}/>Sincronizar integrações agora</button></form> : <p className={settingsStyles.help}>A sincronização manual exige uma sessão administrativa persistente com permissão de edição.</p>}</div>
    </section>
  </div>;
}
