ALTER TABLE media_assets ALTER COLUMN storage_provider SET DEFAULT 'local';

UPDATE media_assets
SET storage_provider = 'local'
WHERE storage_provider <> 'local';