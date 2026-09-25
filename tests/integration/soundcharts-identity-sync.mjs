import assert from "node:assert/strict";
import { register } from "node:module";
import { randomUUID } from "node:crypto";
import postgres from "postgres";

register("../support/ts-resolve-hooks.mjs", import.meta.url);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");
process.env.SOUNDCHARTS_CLIENT_ID = "integration-client";
process.env.SOUNDCHARTS_CLIENT_SECRET = "integration-secret";

const OLD_UUID = "11111111-1111-4111-8111-111111111111";
const NEW_UUID = "22222222-2222-4222-8222-222222222222";
const suffix = randomUUID().slice(0, 8);
const oldUrl = `https://instagram.com/identity-old-${suffix}`;
const newUrl = `https://instagram.com/identity-new-${suffix}`;

// Provider double: only the HTTP boundary is replaced; persistence runs against real PostgreSQL.
let provider = { resolveTo: null, metrics: {}, failMetrics: false };
let metricsLatch = null; // when set, audience/listening requests wait for it (simulates a slow in-flight fetch)
const seenSignals = [];
globalThis.fetch = async (input, init = {}) => {
  seenSignals.push(init.signal);
  const url = new URL(String(input));
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  if (url.hostname === "account.soundcharts.com") return json(200, { access_token: "token", expires_in: 3600 });
  if (url.pathname === "/api/v2/search/external/url") {
    return provider.resolveTo ? json(200, { items: [{ type: "artist", uuid: provider.resolveTo }] }) : json(404, {});
  }
  if (url.pathname.endsWith("/identifiers")) return json(200, { items: [{ url: newUrl }] });
  const audience = url.pathname.match(/\/audience\/(\w+)$/);
  if (audience || url.pathname.endsWith("/streaming/spotify/listening")) {
    if (metricsLatch) await metricsLatch.promise;
    if (provider.failMetrics) return json(503, {});
    const platform = audience ? audience[1] : "spotify";
    const value = provider.metrics[platform];
    return typeof value === "number" ? json(200, { items: [{ date: "2026-09-01T00:00:00Z", followerCount: value, listeners: value }] }) : json(404, {});
  }
  throw new Error(`Unexpected provider request in test: ${url}`);
};

const { syncArtistSoundcharts, syncLanderRecordsSoundcharts } = await import("../../lib/integrations/sync.ts");
const client = postgres(databaseUrl, { max: 1 });
let artistId;
let landerSnapshot;

async function metricRows() {
  return [...await client`SELECT platform, value FROM artist_metrics WHERE artist_id=${artistId} AND source='soundcharts' ORDER BY platform`];
}
async function cacheRows() {
  return [...await client`SELECT platform, value FROM integration_metric_cache WHERE entity_type='artist' AND entity_id=${artistId} ORDER BY platform`];
}
async function seedOldIdentity() {
  await client`DELETE FROM artist_metrics WHERE artist_id=${artistId}`;
  await client`DELETE FROM integration_metric_cache WHERE entity_type='artist' AND entity_id=${artistId}`;
  await client`
    INSERT INTO artist_external_identities (artist_id, soundcharts_artist_uuid, resolution_status, matched_via_platform, matched_via_identifier, last_resolved_at, last_synced_at)
    VALUES (${artistId}, ${OLD_UUID}, 'resolved', 'instagram', ${oldUrl}, now(), now() - interval '2 days')
    ON CONFLICT (artist_id) DO UPDATE SET soundcharts_artist_uuid=EXCLUDED.soundcharts_artist_uuid, resolution_status='resolved',
      matched_via_platform='instagram', matched_via_identifier=EXCLUDED.matched_via_identifier, last_synced_at=EXCLUDED.last_synced_at
  `;
  for (const [platform, value] of [["instagram", 5000], ["youtube", 700]]) {
    await client`INSERT INTO artist_metrics (artist_id, platform, value, source) VALUES (${artistId}, ${platform}, ${value}, 'soundcharts')`;
    await client`INSERT INTO integration_metric_cache (entity_type, entity_id, platform, metric, value, source) VALUES ('artist', ${artistId}, ${platform}, 'followers', ${value}, 'soundcharts')`;
  }
}
async function setLink(url) {
  await client`DELETE FROM artist_links WHERE artist_id=${artistId}`;
  if (url) await client`INSERT INTO artist_links (artist_id, platform, label, url) VALUES (${artistId}, 'instagram', 'Instagram', ${url})`;
}

try {
  const artist = await client`
    INSERT INTO artists (name, slug, short_bio, biography, is_published)
    VALUES ('Identity Sync Test', ${`identity-sync-${suffix}`}, '', '', false) RETURNING id
  `;
  artistId = artist[0].id;

  // 1. Link changed and no deterministic identity exists: the old identity's metrics must be withdrawn.
  await seedOldIdentity();
  await setLink(newUrl);
  provider = { resolveTo: null, metrics: {}, failMetrics: false };
  assert.equal((await syncArtistSoundcharts(artistId, true)).status, "unresolved");
  assert.deepEqual(await metricRows(), [], "metrics of an invalidated identity must not stay published");
  assert.deepEqual(await cacheRows(), []);
  const [unresolved] = await client`SELECT soundcharts_artist_uuid, resolution_status FROM artist_external_identities WHERE artist_id=${artistId}`;
  assert.equal(unresolved.soundcharts_artist_uuid, "");
  assert.equal(unresolved.resolution_status, "needs_review");

  // 2. Link resolves to a different Soundcharts artist: metrics missing for the new identity must not be inherited.
  await seedOldIdentity();
  provider = { resolveTo: NEW_UUID, metrics: { instagram: 42 }, failMetrics: false };
  assert.equal((await syncArtistSoundcharts(artistId, true)).status, "synced");
  assert.deepEqual((await metricRows()).map((row) => [row.platform, Number(row.value)]), [["instagram", 42]]);
  assert.deepEqual((await cacheRows()).map((row) => row.platform), ["instagram"]);

  // 3. Same identity, provider outage: last known values are preserved (documented stale fallback).
  await seedOldIdentity();
  await setLink(oldUrl);
  provider = { resolveTo: OLD_UUID, metrics: {}, failMetrics: true };
  await assert.rejects(() => syncArtistSoundcharts(artistId, true), /Soundcharts respondeu 503/);
  assert.deepEqual((await metricRows()).map((row) => [row.platform, Number(row.value)]), [["instagram", 5000], ["youtube", 700]]);

  // 4. All links removed: identity and its metrics are withdrawn together.
  await seedOldIdentity();
  await setLink("");
  assert.equal((await syncArtistSoundcharts(artistId, true)).status, "not_configured");
  assert.deepEqual(await metricRows(), []);

  // 5. Home social metrics follow the same rule for the Lander Records identity.
  [landerSnapshot] = await client`SELECT * FROM lander_records_integration_settings WHERE key='lander_records'`;
  const landerCache = [...await client`SELECT * FROM integration_metric_cache WHERE entity_type='lander_records'`];
  landerSnapshot = { settings: landerSnapshot, cache: landerCache };
  await client`
    UPDATE lander_records_integration_settings
    SET instagram_url=${newUrl}, youtube_url='', soundcharts_artist_uuid=${OLD_UUID}, soundcharts_resolution_status='resolved',
        soundcharts_matched_via=${`instagram:${oldUrl}`}, soundcharts_last_synced_at=now() - interval '2 days'
    WHERE key='lander_records'
  `;
  await client`
    INSERT INTO integration_metric_cache (entity_type, entity_id, platform, metric, value, source)
    VALUES ('lander_records','lander_records','youtube','subscribers', 999, 'soundcharts')
    ON CONFLICT (entity_type, entity_id, platform, metric) DO UPDATE SET value=999
  `;
  provider = { resolveTo: null, metrics: {}, failMetrics: false };
  assert.equal((await syncLanderRecordsSoundcharts(true)).status, "unresolved");
  const landerRows = [...await client`SELECT 1 FROM integration_metric_cache WHERE entity_type='lander_records' AND source='soundcharts'`];
  assert.equal(landerRows.length, 0, "Home must render the unavailable state instead of metrics from an invalidated identity");

  // 6. Lander identity re-resolves to a different artist but the metrics fetch fails: the old identity's
  //    values must already be withdrawn, and a later success must not resurrect them.
  await client`
    UPDATE lander_records_integration_settings
    SET instagram_url=${newUrl}, youtube_url='', soundcharts_artist_uuid=${OLD_UUID}, soundcharts_resolution_status='resolved',
        soundcharts_matched_via=${`instagram:${oldUrl}`}, soundcharts_last_synced_at=now() - interval '2 days'
    WHERE key='lander_records'
  `;
  for (const [platform, metric, value] of [["youtube", "subscribers", 999], ["instagram", "followers", 5000]]) {
    await client`
      INSERT INTO integration_metric_cache (entity_type, entity_id, platform, metric, value, source)
      VALUES ('lander_records','lander_records',${platform},${metric},${value},'soundcharts')
      ON CONFLICT (entity_type, entity_id, platform, metric) DO UPDATE SET value=EXCLUDED.value
    `;
  }
  provider = { resolveTo: NEW_UUID, metrics: {}, failMetrics: true };
  await assert.rejects(() => syncLanderRecordsSoundcharts(true), /Soundcharts respondeu 503/);
  const [repointed] = await client`SELECT soundcharts_artist_uuid FROM lander_records_integration_settings WHERE key='lander_records'`;
  assert.equal(repointed.soundcharts_artist_uuid, NEW_UUID);
  assert.equal([...await client`SELECT 1 FROM integration_metric_cache WHERE entity_type='lander_records'`].length, 0, "old identity values withdrawn before the failed fetch");
  provider = { resolveTo: NEW_UUID, metrics: { instagram: 42 }, failMetrics: false };
  assert.equal((await syncLanderRecordsSoundcharts(true)).status, "synced");
  const landerAfter = [...await client`SELECT platform, value FROM integration_metric_cache WHERE entity_type='lander_records' ORDER BY platform`];
  assert.deepEqual(landerAfter.map((r) => [r.platform, Number(r.value)]), [["instagram", 42]], "no old-identity youtube value may survive");

  // 7. Same for an artist: links re-resolve to another identity, fetch fails, then succeeds.
  await seedOldIdentity();
  await setLink(newUrl);
  provider = { resolveTo: NEW_UUID, metrics: {}, failMetrics: true };
  await assert.rejects(() => syncArtistSoundcharts(artistId, true), /Soundcharts respondeu 503/);
  assert.deepEqual(await metricRows(), [], "artist: old identity metrics withdrawn before the failed fetch");
  const [artistIdentity] = await client`SELECT soundcharts_artist_uuid, last_synced_at FROM artist_external_identities WHERE artist_id=${artistId}`;
  assert.equal(artistIdentity.soundcharts_artist_uuid, NEW_UUID);
  assert.equal(artistIdentity.last_synced_at, null);
  provider = { resolveTo: NEW_UUID, metrics: { instagram: 7 }, failMetrics: false };
  assert.equal((await syncArtistSoundcharts(artistId, false)).status, "synced", "unsynced identity is not considered fresh");
  assert.deepEqual((await metricRows()).map((row) => [row.platform, Number(row.value)]), [["instagram", 7]]);

  // 8. The admin save clears the URLs (state written by saveLanderRecordsIntegrationSettings before this fix:
  //    UUID already '' but cache still populated): the next sync must withdraw the metrics.
  await client`
    UPDATE lander_records_integration_settings
    SET instagram_url='', youtube_url='', soundcharts_artist_uuid='', soundcharts_resolution_status='unresolved', soundcharts_matched_via=''
    WHERE key='lander_records'
  `;
  await client`
    INSERT INTO integration_metric_cache (entity_type, entity_id, platform, metric, value, source)
    VALUES ('lander_records','lander_records','youtube','subscribers', 999, 'soundcharts')
    ON CONFLICT (entity_type, entity_id, platform, metric) DO UPDATE SET value=999
  `;
  assert.equal((await syncLanderRecordsSoundcharts(false)).status, "not_configured");
  assert.equal([...await client`SELECT 1 FROM integration_metric_cache WHERE entity_type='lander_records'`].length, 0, "cleared URLs must withdraw Home metrics");

  // 9. Race: a sync fetches for identity X; meanwhile the identity is re-pointed to Y (admin save + forced sync).
  //    The in-flight result for X must not be published under Y.
  await client`
    UPDATE lander_records_integration_settings
    SET instagram_url=${newUrl}, soundcharts_artist_uuid=${NEW_UUID}, soundcharts_resolution_status='resolved',
        soundcharts_matched_via=${`instagram:${newUrl}`}, soundcharts_last_synced_at=now() - interval '2 days'
    WHERE key='lander_records'
  `;
  let release;
  metricsLatch = { promise: new Promise((resolve) => { release = resolve; }) };
  provider = { resolveTo: NEW_UUID, metrics: { instagram: 5000, youtube: 999 }, failMetrics: false };
  const inFlight = syncLanderRecordsSoundcharts(true);
  await new Promise((resolve) => setTimeout(resolve, 150));
  await client`UPDATE lander_records_integration_settings SET soundcharts_artist_uuid=${OLD_UUID}, soundcharts_matched_via=${`instagram:${newUrl}`} WHERE key='lander_records'`;
  await client`DELETE FROM integration_metric_cache WHERE entity_type='lander_records'`;
  await client`INSERT INTO integration_metric_cache (entity_type, entity_id, platform, metric, value, source) VALUES ('lander_records','lander_records','instagram','followers', 42, 'soundcharts')`;
  release();
  metricsLatch = null;
  assert.equal((await inFlight).status, "superseded");
  const raced = [...await client`SELECT platform, value FROM integration_metric_cache WHERE entity_type='lander_records' ORDER BY platform`];
  assert.deepEqual(raced.map((r) => [r.platform, Number(r.value)]), [["instagram", 42]], "stale in-flight values must not be published");

  // 10. Without provider credentials, changed URLs still withdraw the invalidated identity's metrics.
  await client`
    UPDATE lander_records_integration_settings
    SET instagram_url=${newUrl}, soundcharts_artist_uuid=${OLD_UUID}, soundcharts_resolution_status='resolved', soundcharts_matched_via=${`instagram:${oldUrl}`}
    WHERE key='lander_records'
  `;
  await client`INSERT INTO integration_metric_cache (entity_type, entity_id, platform, metric, value, source) VALUES ('lander_records','lander_records','youtube','subscribers', 999, 'soundcharts') ON CONFLICT (entity_type, entity_id, platform, metric) DO UPDATE SET value=999`;
  const savedSecret = process.env.SOUNDCHARTS_CLIENT_SECRET;
  delete process.env.SOUNDCHARTS_CLIENT_SECRET;
  try {
    assert.equal((await syncLanderRecordsSoundcharts(false)).status, "credentials_missing");
  } finally { process.env.SOUNDCHARTS_CLIENT_SECRET = savedSecret; }
  assert.equal([...await client`SELECT 1 FROM integration_metric_cache WHERE entity_type='lander_records'`].length, 0, "withdrawal must not depend on provider credentials");

  // 11. Every provider request is bounded by a timeout signal.
  assert.ok(seenSignals.length > 0);
  assert.ok(seenSignals.every((signal) => signal instanceof AbortSignal), "every Soundcharts request must carry an AbortSignal timeout");

  console.log("Soundcharts identity sync checks passed: invalidated/replaced identities withdraw metrics, same-identity outages keep last known values, requests are time-bounded.");
} finally {
  if (landerSnapshot) {
    const settings = landerSnapshot.settings;
    await client`
      UPDATE lander_records_integration_settings
      SET instagram_url=${settings.instagram_url}, youtube_url=${settings.youtube_url}, soundcharts_artist_uuid=${settings.soundcharts_artist_uuid},
          soundcharts_resolution_status=${settings.soundcharts_resolution_status}, soundcharts_matched_via=${settings.soundcharts_matched_via},
          soundcharts_last_resolved_at=${settings.soundcharts_last_resolved_at}, soundcharts_last_synced_at=${settings.soundcharts_last_synced_at},
          soundcharts_last_error=${settings.soundcharts_last_error}, updated_at=${settings.updated_at}
      WHERE key='lander_records'
    `;
    await client`DELETE FROM integration_metric_cache WHERE entity_type='lander_records'`;
    for (const row of landerSnapshot.cache) {
      await client`
        INSERT INTO integration_metric_cache (entity_type, entity_id, platform, metric, value, source, observed_at, fetched_at)
        VALUES (${row.entity_type}, ${row.entity_id}, ${row.platform}, ${row.metric}, ${row.value}, ${row.source}, ${row.observed_at}, ${row.fetched_at})
      `;
    }
  }
  if (artistId) {
    // Mirrors deleteArtistAction: the metric cache has no FK to artists.
    await client`DELETE FROM integration_metric_cache WHERE entity_type='artist' AND entity_id=${artistId}`;
    await client`DELETE FROM artists WHERE id=${artistId}`;
  }
  await client.end();
  await globalThis.__landerRecordsDb?.client?.end();
}
