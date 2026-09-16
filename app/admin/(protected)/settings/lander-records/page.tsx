import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../../lib/db";
import { integrationMetricCache, landerRecordsIntegrationSettings } from "../../../../../lib/db/integration-schema";
import { soundchartsCredentialsConfigured } from "../../../../../lib/integrations/soundcharts";
import { spotifyCredentialsConfigured } from "../../../../../lib/integrations/spotify";
import { saveLanderRecordsIntegrationSettings, syncLanderRecordsIntegrationsAction } from "../../../integration-actions";
import { AdminIcon } from "../../../components/AdminIcon";

export const dynamic = "force-dynamic";

function dateLabel(value: Date | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(value) : "Nunca";
}

function Status({ ready, label }: { ready: boolean; label: string }) {
  return <span className={ready ? "adminBadge live" : "adminBadge draft"}><i aria-hidden="true" />{label}</span>;
}

export default async function LanderRecordsIntegrationSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; synced?: string; spotify?: string }> }) {
  const db = getDb();
  const [rows, metricRows] = await Promise.all([
    db.select().from(landerRecordsIntegrationSettings).where(eq(landerRecordsIntegrationSettings.key, "lander_records")).limit(1),
    db.select().from(integrationMetricCache).where(eq(integrationMetricCache.entityType, "lander_records")),
  ]);
  const settings = rows[0] || {
    instagramUrl: "",
    youtubeUrl: "",
    spotifyPlaylistUrl: "",
    spotifyPlaylistId: "",
    spotifyUserId: "",
    spotifyConnectedAt: null,
    spotifyLastSyncedAt: null,
    spotifyLastError: "",
    soundchartsArtistUuid: "",
    soundchartsResolutionStatus: "unresolved",
    soundchartsMatchedVia: "",
    soundchartsLastSyncedAt: null,
    soundchartsLastError: "",
  };
  const metrics = Object.fromEntries(metricRows.map((row) => [`${row.platform}:${row.metric}`, row.value]));
  const params = await searchParams;
  const spotifyReady = spotifyCredentialsConfigured() && Boolean(process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY?.trim());
  const soundchartsReady = soundchartsCredentialsConfigured();

  return <div className="adminPage">
    <nav aria-label="Seções de configurações" className="adminTabs">
      <Link href="/admin/settings">Empresa</Link><Link href="/admin/settings#identity">Identidade do Site</Link><Link href="/admin/settings#automations">Automações</Link><Link href="/admin/settings#security">Segurança</Link><Link aria-current="page" href="/admin/settings/lander-records">Integrações</Link><Link href="/admin/users">Usuários</Link>
    </nav>

    {params.saved === "1" ? <div className="adminNotice">Configurações salvas.</div> : null}
    {params.synced === "1" ? <div className="adminNotice">Sincronização executada. Consulte os estados abaixo.</div> : null}
    {params.spotify === "connected" ? <div className="adminNotice">Conta Spotify conectada com sucesso.</div> : null}
    {params.spotify === "error" ? <div className="adminNotice error">Não foi possível concluir a conexão com o Spotify.</div> : null}

    <section className="adminPanel">
      <div className="adminSectionHeader"><div><h2>Identidade e destinos externos</h2><p>URLs oficiais utilizadas pelas integrações. Credenciais permanecem exclusivamente no servidor.</p></div></div>
      <form action={saveLanderRecordsIntegrationSettings} className="adminForm"><div className="adminFormGrid">
        <label>Instagram da Lander Records<input name="instagramUrl" type="url" defaultValue={settings.instagramUrl} placeholder="https://instagram.com/..." /></label>
        <label>YouTube da Lander Records<input name="youtubeUrl" type="url" defaultValue={settings.youtubeUrl} placeholder="https://youtube.com/@..." /></label>
        <label className="full">Playlist Spotify — 5 últimos lançamentos<input name="spotifyPlaylistUrl" type="url" defaultValue={settings.spotifyPlaylistUrl} placeholder="https://open.spotify.com/playlist/..." /></label>
      </div><div className="adminActions"><button className="adminButton primary" type="submit">Salvar configurações</button></div></form>
    </section>

    <section className="adminPanel adminStack">
      <div className="adminSectionHeader"><div><h2>Spotify</h2><p>Conexão autorizada e sincronização da playlist configurada.</p></div><Status ready={spotifyReady && Boolean(settings.spotifyConnectedAt)} label={spotifyReady && settings.spotifyConnectedAt ? "Conectado" : spotifyReady ? "Aguardando conexão" : "Credenciais pendentes"} /></div>
      <div className="adminFormGrid">
        <div className="adminSectionCard"><strong>Credenciais server-side</strong><p>{spotifyReady ? "Configuradas" : "Pendentes"}</p></div>
        <div className="adminSectionCard"><strong>Conta conectada</strong><p>{settings.spotifyConnectedAt ? `Sim · ${settings.spotifyUserId || "conta autorizada"}` : "Não"}</p></div>
        <div className="adminSectionCard"><strong>Playlist ID resolvido</strong><p className="adminCode">{settings.spotifyPlaylistId || "—"}</p></div>
        <div className="adminSectionCard"><strong>Última sincronização</strong><p>{dateLabel(settings.spotifyLastSyncedAt)}</p></div>
      </div>
      {settings.spotifyLastError ? <div className="adminNotice error">Spotify: {settings.spotifyLastError}</div> : null}
      <div className="adminActions">{spotifyReady ? <a className="adminButton" href="/api/integrations/spotify/connect"><AdminIcon name="integration" size={15} />{settings.spotifyConnectedAt ? "Reconectar Spotify" : "Conectar Spotify"}</a> : <span className="adminCode">Configure as credenciais do Spotify para habilitar a conexão.</span>}</div>
    </section>

    <section className="adminPanel adminStack">
      <div className="adminSectionHeader"><div><h2>Soundcharts</h2><p>Matching determinístico por URL/ID oficial, sem associação automática por nome.</p></div><Status ready={soundchartsReady && settings.soundchartsResolutionStatus === "resolved"} label={soundchartsReady ? settings.soundchartsResolutionStatus === "resolved" ? "Resolvido" : "Pendente de resolução" : "Credenciais pendentes"} /></div>
      <div className="adminFormGrid">
        <div className="adminSectionCard"><strong>Credenciais server-side</strong><p>{soundchartsReady ? "Configuradas" : "Pendentes"}</p></div>
        <div className="adminSectionCard"><strong>Resolução</strong><p>{settings.soundchartsResolutionStatus}</p></div>
        <div className="adminSectionCard"><strong>Soundcharts Artist UUID</strong><p className="adminCode">{settings.soundchartsArtistUuid || "—"}</p></div>
        <div className="adminSectionCard"><strong>Correspondência</strong><p className="adminCode">{settings.soundchartsMatchedVia || "—"}</p></div>
        <div className="adminSectionCard"><strong>Instagram — seguidores</strong><p>{metrics["instagram:followers"]?.toLocaleString("pt-BR") || "—"}</p></div>
        <div className="adminSectionCard"><strong>YouTube — inscritos</strong><p>{metrics["youtube:subscribers"]?.toLocaleString("pt-BR") || "—"}</p></div>
        <div className="adminSectionCard"><strong>Última sincronização</strong><p>{dateLabel(settings.soundchartsLastSyncedAt)}</p></div>
      </div>
      {settings.soundchartsLastError ? <div className="adminNotice error">Soundcharts: {settings.soundchartsLastError}</div> : null}
    </section>

    <section className="adminPanel">
      <div className="adminSectionHeader"><div><h2>Sincronização</h2><p>Spotify usa cache de 6 horas; Soundcharts mantém último dado válido e janela de 24 horas.</p></div></div>
      <form action={syncLanderRecordsIntegrationsAction}><button className="adminButton primary" type="submit"><AdminIcon name="activity" size={15} />Sincronizar integrações agora</button></form>
    </section>
  </div>;
}
