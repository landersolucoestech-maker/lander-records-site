BEGIN;

-- The Home belongs to Lander Records. The initial seed inherited a Portal Lander
-- eyebrow in the news block; keep Portal Lander references only where they are
-- intentional ecosystem/company content, never as the Home editorial identity.
UPDATE page_sections AS ps
SET eyebrow = 'LANDER RECORDS',
    updated_at = now()
FROM pages AS p
WHERE p.id = ps.page_id
  AND p.key = 'home'
  AND ps.section_key = 'news'
  AND ps.eyebrow IS DISTINCT FROM 'LANDER RECORDS';

COMMIT;
