BEGIN;

-- Forward-only convergence. Existing values are copied before constraints change;
-- no current metric or storage provenance is rewritten or deleted here.
ALTER TABLE artist_metrics
  ADD COLUMN IF NOT EXISTS source varchar(40) NOT NULL DEFAULT 'legacy';

ALTER TABLE artist_metrics DROP CONSTRAINT IF EXISTS artist_metrics_pkey;
ALTER TABLE artist_metrics
  ADD CONSTRAINT artist_metrics_pkey PRIMARY KEY (artist_id, platform, source);

CREATE INDEX IF NOT EXISTS artist_metrics_source_idx ON artist_metrics(source);

CREATE TABLE IF NOT EXISTS artist_metric_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  platform varchar(80) NOT NULL,
  value bigint NOT NULL CHECK (value >= 0),
  source varchar(40) NOT NULL,
  observed_at timestamptz,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS artist_metric_history_lookup_idx
  ON artist_metric_history(artist_id, platform, source, recorded_at DESC);

INSERT INTO artist_metric_history (artist_id, platform, value, source, observed_at, recorded_at)
SELECT artist_id, platform, value, source, updated_at, updated_at
FROM artist_metrics current_metric
WHERE NOT EXISTS (
  SELECT 1 FROM artist_metric_history history
  WHERE history.artist_id = current_metric.artist_id
    AND history.platform = current_metric.platform
    AND history.source = current_metric.source
    AND history.value = current_metric.value
    AND history.recorded_at = current_metric.updated_at
);

ALTER TABLE media_assets
  ALTER COLUMN storage_provider SET DEFAULT 'supabase_storage';

COMMIT;
