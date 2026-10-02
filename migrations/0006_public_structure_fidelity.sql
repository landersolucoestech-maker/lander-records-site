BEGIN;

-- Preserve the public copy and section structure that already exists in the original site.
UPDATE page_sections
SET title = 'Nosso Elenco',
    subtitle = 'Conheça os artistas que fazem parte da Lander Records.',
    updated_at = now()
WHERE page_id = '50000000-0000-4000-8000-000000000003' AND section_key = 'hero';

INSERT INTO page_sections (page_id, section_key, type, position, enabled)
VALUES
  ('50000000-0000-4000-8000-000000000003','artist_filters','artist_filters',2,true),
  ('50000000-0000-4000-8000-000000000003','artist_list','artist_feed',3,true),
  ('50000000-0000-4000-8000-000000000004','news_categories','post_filters',2,true),
  ('50000000-0000-4000-8000-000000000004','news_list','post_feed',3,true)
ON CONFLICT (page_id, section_key) DO UPDATE SET type=EXCLUDED.type, position=EXCLUDED.position, enabled=true, updated_at=now();

INSERT INTO page_section_bindings (page_section_id, definition_id)
SELECT ps.id, sd.id
FROM page_sections ps
JOIN section_definitions sd ON sd.key = ps.section_key
WHERE ps.page_id IN ('50000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000004')
ON CONFLICT DO NOTHING;

COMMIT;
