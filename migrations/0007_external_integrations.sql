BEGIN;

CREATE TABLE IF NOT EXISTS lander_records_integration_settings (
  key varchar(40) PRIMARY KEY,
  instagram_url text NOT NULL DEFAULT '',
  youtube_url text NOT NULL DEFAULT '',
  spotify_playlist_url text NOT NULL DEFAULT '',
  spotify_playlist_id varchar(80) NOT NULL DEFAULT '',
  spotify_playlist_snapshot_id varchar(180) NOT NULL DEFAULT '',
  spotify_user_id varchar(180) NOT NULL DEFAULT '',
  spotify_refresh_token_encrypted text NOT NULL DEFAULT '',
  spotify_connected_at timestamptz,
  spotify_last_synced_at timestamptz,
  spotify_last_error text NOT NULL DEFAULT '',
  soundcharts_artist_uuid varchar(80) NOT NULL DEFAULT '',
  soundcharts_resolution_status varchar(40) NOT NULL DEFAULT 'unresolved',
  soundcharts_matched_via varchar(120) NOT NULL DEFAULT '',
  soundcharts_last_resolved_at timestamptz,
  soundcharts_last_synced_at timestamptz,
  soundcharts_last_error text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO lander_records_integration_settings (key)
VALUES ('lander_records')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS artist_external_identities (
  artist_id uuid PRIMARY KEY REFERENCES artists(id) ON DELETE CASCADE,
  soundcharts_artist_uuid varchar(80) NOT NULL DEFAULT '',
  resolution_status varchar(40) NOT NULL DEFAULT 'unresolved',
  matched_via_platform varchar(80) NOT NULL DEFAULT '',
  matched_via_identifier text NOT NULL DEFAULT '',
  last_resolved_at timestamptz,
  last_synced_at timestamptz,
  last_error text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS artist_external_identities_soundcharts_idx
  ON artist_external_identities(soundcharts_artist_uuid)
  WHERE soundcharts_artist_uuid <> '';

CREATE TABLE IF NOT EXISTS integration_metric_cache (
  entity_type varchar(40) NOT NULL,
  entity_id varchar(100) NOT NULL,
  platform varchar(80) NOT NULL,
  metric varchar(80) NOT NULL,
  value bigint NOT NULL CHECK (value >= 0),
  source varchar(40) NOT NULL DEFAULT 'soundcharts',
  observed_at timestamptz,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_type, entity_id, platform, metric)
);

CREATE INDEX IF NOT EXISTS integration_metric_cache_fetched_idx
  ON integration_metric_cache(fetched_at);

-- Mark all pre-integration artist metrics as legacy. The migration runner intentionally
-- replays SQL files, so only non-Soundcharts rows are removed on later executions.
ALTER TABLE artist_metrics ADD COLUMN IF NOT EXISTS source varchar(40) NOT NULL DEFAULT 'legacy';
DELETE FROM artist_metrics WHERE source <> 'soundcharts';

CREATE TABLE IF NOT EXISTS spotify_release_cache (
  position integer PRIMARY KEY CHECK (position BETWEEN 1 AND 5),
  playlist_id varchar(80) NOT NULL,
  album_id varchar(80) NOT NULL,
  title varchar(300) NOT NULL,
  artist_name varchar(300) NOT NULL,
  cover_url text NOT NULL DEFAULT '',
  spotify_url text NOT NULL,
  release_date varchar(10) NOT NULL,
  release_date_precision varchar(16) NOT NULL,
  playlist_added_at timestamptz,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS spotify_oauth_states (
  state_hash varchar(64) PRIMARY KEY,
  admin_user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS spotify_oauth_states_expiry_idx ON spotify_oauth_states(expires_at);

COMMIT;
