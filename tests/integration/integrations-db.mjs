import assert from "node:assert/strict";
import postgres from "postgres";
import { randomUUID } from "node:crypto";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");

const client = postgres(databaseUrl, { max: 1 });
const suffix = randomUUID().slice(0, 8);
const artistSlug = `integration-soundcharts-${suffix}`;
const playlistId = `playlist-${suffix}`;
const rollback = new Error("ROLLBACK_INTEGRATION_TEST");

try {
  await client.begin(async (sql) => {
  const settings = await sql`SELECT key FROM lander_records_integration_settings WHERE key='lander_records'`;
  assert.equal(settings.length, 1, "Lander Records integration settings must be seeded exactly once");

  await sql`
    UPDATE lander_records_integration_settings
    SET instagram_url='https://instagram.com/integration-test',
        youtube_url='https://youtube.com/@integration-test',
        spotify_playlist_url='https://open.spotify.com/playlist/integrationtest',
        spotify_playlist_id='integrationtest',
        updated_at=now()
    WHERE key='lander_records'
  `;
  const persistedSettings = await sql`
    SELECT instagram_url, youtube_url, spotify_playlist_id
    FROM lander_records_integration_settings WHERE key='lander_records'
  `;
  assert.equal(persistedSettings[0].instagram_url, "https://instagram.com/integration-test");
  assert.equal(persistedSettings[0].youtube_url, "https://youtube.com/@integration-test");
  assert.equal(persistedSettings[0].spotify_playlist_id, "integrationtest");

  await sql`
    INSERT INTO integration_metric_cache (entity_type, entity_id, platform, metric, value, source, observed_at, fetched_at)
    VALUES ('lander_records','lander_records','instagram','followers',123,'soundcharts',now(),now())
    ON CONFLICT (entity_type, entity_id, platform, metric)
    DO UPDATE SET value=EXCLUDED.value, source=EXCLUDED.source, observed_at=EXCLUDED.observed_at, fetched_at=EXCLUDED.fetched_at
  `;
  const metric = await sql`
    SELECT value::bigint AS value, source FROM integration_metric_cache
    WHERE entity_type='lander_records' AND entity_id='lander_records' AND platform='instagram' AND metric='followers'
  `;
  assert.equal(Number(metric[0].value), 123, "Soundcharts Lander Records metric cache must persist numeric values");
  assert.equal(metric[0].source, "soundcharts", "Social metric cache source must remain Soundcharts");

  const artist = await sql`
    INSERT INTO artists (name, slug, short_bio, biography, is_published)
    VALUES ('Soundcharts Integration Test', ${artistSlug}, '', '', false)
    RETURNING id
  `;
  await sql`
    INSERT INTO artist_external_identities (
      artist_id, soundcharts_artist_uuid, resolution_status, matched_via_platform, matched_via_identifier, last_resolved_at, last_synced_at
    ) VALUES (
      ${artist[0].id}, '00000000-0000-4000-8000-000000000001', 'resolved', 'spotify', 'spotify-test-id', now(), now()
    )
  `;
  const artistIdentity = await sql`SELECT resolution_status, matched_via_platform FROM artist_external_identities WHERE artist_id=${artist[0].id}`;
  assert.equal(artistIdentity.length, 1, "Artist Soundcharts identity must persist separately from public platform links");
  assert.equal(artistIdentity[0].resolution_status, "resolved");
  assert.equal(artistIdentity[0].matched_via_platform, "spotify");

  await sql`
    INSERT INTO integration_metric_cache (entity_type, entity_id, platform, metric, value, source, fetched_at)
    VALUES ('artist', ${artist[0].id}::text, 'youtube', 'subscribers', 456, 'soundcharts', now())
  `;
  const artistMetric = await sql`
    SELECT value::bigint AS value, source FROM integration_metric_cache
    WHERE entity_type='artist' AND entity_id=${artist[0].id}::text AND platform='youtube' AND metric='subscribers'
  `;
  assert.equal(Number(artistMetric[0].value), 456);
  assert.equal(artistMetric[0].source, "soundcharts");

  await sql`DELETE FROM spotify_release_cache`;
  for (let position = 1; position <= 5; position += 1) {
    await sql`
      INSERT INTO spotify_release_cache (
        position, playlist_id, album_id, title, artist_name, cover_url, spotify_url,
        release_date, release_date_precision, fetched_at, expires_at
      ) VALUES (
        ${position}, ${playlistId}, ${`album-${position}-${suffix}`}, ${`Release ${position}`}, 'Integration Artist',
        'https://i.scdn.co/image/test', ${`https://open.spotify.com/album/album${position}`},
        ${`2026-08-${String(21 - position).padStart(2, "0")}`}, 'day', now(), now() + interval '6 hours'
      )
    `;
  }
  const releases = await sql`SELECT position, playlist_id, title FROM spotify_release_cache ORDER BY position`;
  assert.equal(releases.length, 5, "Spotify Home cache must contain exactly five card positions after a successful sync");
  assert.deepEqual(releases.map((row) => row.position), [1, 2, 3, 4, 5], "Spotify release cache positions must map deterministically to the five existing cards");
  assert.ok(releases.every((row) => row.playlist_id === playlistId));

  await sql`DELETE FROM artists WHERE id=${artist[0].id}`;
  const cascadedIdentity = await sql`SELECT artist_id FROM artist_external_identities WHERE artist_id=${artist[0].id}`;
  assert.equal(cascadedIdentity.length, 0, "Deleting an artist must cascade its Soundcharts identity mapping");

  await sql`DELETE FROM integration_metric_cache WHERE entity_type IN ('artist','lander_records')`;
  await sql`DELETE FROM spotify_release_cache`;
  await sql`
    UPDATE lander_records_integration_settings
    SET instagram_url='', youtube_url='', spotify_playlist_url='', spotify_playlist_id='',
        spotify_playlist_snapshot_id='', spotify_last_synced_at=NULL, spotify_last_error='',
        soundcharts_artist_uuid='', soundcharts_resolution_status='unresolved', soundcharts_matched_via='',
        soundcharts_last_resolved_at=NULL, soundcharts_last_synced_at=NULL, soundcharts_last_error='', updated_at=now()
    WHERE key='lander_records'
  `;

  console.log("Integration persistence checks passed: Lander settings, Soundcharts identities/metrics, and five-position Spotify cache.");
  throw rollback;
  });
} catch (error) {
  if (error !== rollback) throw error;
} finally {
  await client.end({ timeout: 5 });
}
