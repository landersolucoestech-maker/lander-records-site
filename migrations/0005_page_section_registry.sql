BEGIN;

CREATE TABLE IF NOT EXISTS section_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key varchar(120) NOT NULL UNIQUE,
  name varchar(180) NOT NULL,
  type varchar(80) NOT NULL,
  description text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS page_section_bindings (
  page_section_id uuid NOT NULL REFERENCES page_sections(id) ON DELETE CASCADE,
  definition_id uuid NOT NULL REFERENCES section_definitions(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (page_section_id, definition_id)
);

INSERT INTO section_definitions (key, name, type, description, active)
SELECT DISTINCT
  section_key,
  initcap(replace(section_key, '_', ' ')),
  type,
  'Seção cadastrada no catálogo do CMS e vinculável às páginas públicas.',
  true
FROM page_sections
ON CONFLICT (key) DO UPDATE SET type = EXCLUDED.type, active = true, updated_at = now();

INSERT INTO page_section_bindings (page_section_id, definition_id)
SELECT ps.id, sd.id
FROM page_sections ps
JOIN section_definitions sd ON sd.key = ps.section_key
ON CONFLICT DO NOTHING;

INSERT INTO section_definitions (key, name, type, description, active) VALUES
  ('artist_filters','Filtros/Categorias de Artistas','artist_filters','Filtros dinâmicos e categorias da página geral de Artistas.',true),
  ('artist_list','Listagem de Artistas','artist_feed','Listagem pública de artistas conforme destinos de publicação.',true),
  ('artist_cta','CTA de Artistas','cta','Chamada comercial complementar da página de Artistas.',true),
  ('news_categories','Categorias de Notícias','post_filters','Filtros dinâmicos e categorias da página geral de Notícias.',true),
  ('news_list','Listagem de Notícias','post_feed','Listagem pública de notícias publicadas.',true)
ON CONFLICT (key) DO UPDATE SET name=EXCLUDED.name,type=EXCLUDED.type,description=EXCLUDED.description,active=true,updated_at=now();

COMMIT;
