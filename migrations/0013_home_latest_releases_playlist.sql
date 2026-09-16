BEGIN;

-- Últimos Lançamentos is a fixed Home section backed exclusively by the
-- configured Spotify playlist. Release cards are never authored manually.
UPDATE section_definitions
SET name = 'Últimos Lançamentos',
    type = 'release_feed',
    description = 'Feed automático com no máximo 5 faixas da playlist Spotify configurada para a Home.',
    active = true,
    updated_at = now()
WHERE key = 'releases';

UPDATE page_sections
SET position = 4,
    updated_at = now()
WHERE page_id = '50000000-0000-4000-8000-000000000001'
  AND section_key = 'artists';

UPDATE page_sections
SET type = 'release_feed',
    title = 'Últimos Lançamentos',
    subtitle = 'Os lançamentos mais recentes da playlist oficial da Lander Records.',
    position = 5,
    enabled = true,
    updated_at = now()
WHERE page_id = '50000000-0000-4000-8000-000000000001'
  AND section_key = 'releases';

UPDATE page_sections
SET position = 6,
    updated_at = now()
WHERE page_id = '50000000-0000-4000-8000-000000000001'
  AND section_key = 'advertise_banner';

UPDATE page_sections
SET position = 7,
    updated_at = now()
WHERE page_id = '50000000-0000-4000-8000-000000000001'
  AND section_key = 'news';

-- Remove the legacy manually-authored Spotify CTA/item. The playlist URL in
-- lander_records_integration_settings is now the single source of truth.
DELETE FROM page_section_items
WHERE section_id IN (
  SELECT id
  FROM page_sections
  WHERE page_id = '50000000-0000-4000-8000-000000000001'
    AND section_key = 'releases'
);

COMMIT;
