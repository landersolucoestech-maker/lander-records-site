ALTER TABLE media_assets ALTER COLUMN storage_provider SET DEFAULT 'local';

-- Change only the default for future rows. Existing provider values are provenance
-- and must remain untouched, including external and Supabase-backed assets.
