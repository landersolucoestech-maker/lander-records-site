import { eq } from "drizzle-orm";
import { getDb } from "../../../../../lib/db";
import { integrationMetricCache, landerRecordsIntegrationSettings } from "../../../../../lib/db/integration-schema";
import { soundchartsCredentialsConfigured } from "../../../../../lib/integrations/soundcharts";
import { spotifyCredentialsConfigured } from "../../../../../lib/integrations/spotify";
import { saveLanderRecordsIntegrationSettings, syncLanderRecordsIntegrationsAction } from "../../../integration-actions";

export const dynamic = "force-dynamic";

function dateLabel(value: Date | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(value) : "Nunca";
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

  return (
    <div className="adminPage">
      <header className="adminPageHeader">
        <div><p className="adminEyebrow">INTEGRAÇÕES</p><h1>Configurações da Lander Records</h1><p>URLs institucionais e identidade externa usadas pelo Spotify e Soundcharts. Credenciais permanecem exclusivamente no servidor.</p></div>
      </header>

      {params.saved === "1" ? <div className="adminNotice">Configurações salvas.</div> : null}
      {params.synced === "1" ? <div className="adminNotice">Sincronização executada. Consulte os estados abaixo.</div> : null}
      {params.spotify === "connected" ? <div className="adminNotice">Conta Spotify conectada com sucesso.</div> : null}
      {params.spotify === "error" ? <div className="adminNotice">Não foi possível concluir a conexão com o Spotify.</div> : null}

      <section className="adminPanel adminStack">
        <div className="adminPageHeader"><div><h2>Identidade e playlist</h2><p>Informe somente URLs oficiais. Os IDs técnicos são resolvidos e armazenados internamente.</p></div></div>
        <form action={saveLanderRecordsIntegrationSettings} className="adminForm">
          <div className="adminFormGrid">
            <label>Instagram da Lander Records<input name="instagramUrl" type="url" defaultValue={settings.instagramUrl} placeholder="https://instagram.com/..." /></label>
            <label>YouTube da Lander Records<input name="youtubeUrl" type="url" defaultValue={settings.youtubeUrl} placeholder="https://youtube.com/@..." /></label>
            <label className="full">Playlist Spotify — 5 últimos lançamentos<input name="spotifyPlaylistUrl" type="url" defaultValue={settings.spotifyPlaylistUrl} placeholder="https://open.spotify.com/playlist/..." /></label>
          </div>
          <button className="adminButton primary" type="submit">Salvar configurações</button>
        </form>
      </section>

      <section className="adminPanel adminStack">
        <div className="adminPageHeader"><div><h2>Spotify</h2><p>A API atual do Spotify exige uma conta autorizada que seja proprietária ou colaboradora da playlist configurada.</p></div></div>
        <div className="adminFormGrid">
          <div><strong>Credenciais server-side</strong><p>{spotifyReady ? "Configuradas" : "Pendentes"}</p></div>
          <div><strong>Conta conectada</strong><p>{settings.spotifyConnectedAt ? `Sim · ${settings.spotifyUserId || "conta autorizada"}` : "Não"}</p></div>
          <div><strong>Playlist ID resolvido</strong><p className="adminCode">{settings.spotifyPlaylistId || "—"}</p></div>
          <div><strong>Última sincronização</strong><p>{dateLabel(settings.spotifyLastSyncedAt)}</p></div>
        </div>
        {settings.spotifyLastError ? <div className="adminNotice">Spotify: {settings.spotifyLastError}</div> : null}
        <div className="adminActions">
          {spotifyReady ? <a className="adminButton" href="/api/integrations/spotify/connect">{settings.spotifyConnectedAt ? "Reconectar Spotify" : "Conectar Spotify"}</a> : <span className="adminCode">Configure as credenciais do Spotify para habilitar a conexão.</span>}
        </div>
      </section>

      <section className="adminPanel adminStack">
        <div className="adminPageHeader"><div><h2>Soundcharts</h2><p>Matching determinístico por URL/ID oficial. Nenhuma associação é feita escolhendo automaticamente o primeiro resultado por nome.</p></div></div>
        <div className="adminFormGrid">
          <div><strong>Credenciais server-side</strong><p>{soundchartsReady ? "Configuradas" : "Pendentes"}</p></div>
          <div><strong>Resolução</strong><p>{settings.soundchartsResolutionStatus}</p></div>
          <div><strong>Soundcharts Artist UUID</strong><p className="adminCode">{settings.soundchartsArtistUuid || "—"}</p></div>
          <div><strong>Correspondência</strong><p className="adminCode">{settings.soundchartsMatchedVia || "—"}</p></div>
          <div><strong>Instagram — seguidores</strong><p>{metrics["instagram:followers"]?.toLocaleString("pt-BR") || "—"}</p></div>
          <div><strong>YouTube — inscritos</strong><p>{metrics["youtube:subscribers"]?.toLocaleString("pt-BR") || "—"}</p></div>
          <div><strong>Última sincronização</strong><p>{dateLabel(settings.soundchartsLastSyncedAt)}</p></div>
        </div>
        {settings.soundchartsLastError ? <div className="adminNotice">Soundcharts: {settings.soundchartsLastError}</div> : null}
      </section>

      <section className="adminPanel adminStack">
        <div className="adminPageHeader"><div><h2>Sincronização</h2><p>Spotify usa cache de 6 horas; Soundcharts usa último dado válido e janela de sincronização de 24 horas.</p></div></div>
        <form action={syncLanderRecordsIntegrationsAction}><button className="adminButton primary" type="submit">Sincronizar integrações agora</button></form>
      </section>
    </div>
  );
}
