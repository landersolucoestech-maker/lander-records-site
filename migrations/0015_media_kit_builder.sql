BEGIN;

CREATE TABLE IF NOT EXISTS media_kit_settings (
  id varchar(40) PRIMARY KEY DEFAULT 'default',
  document_title varchar(180) NOT NULL DEFAULT 'Mídia Kit',
  edition varchar(80) NOT NULL DEFAULT '2026',
  footer_website text NOT NULL DEFAULT 'landerrecords.com',
  show_page_numbers boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media_kit_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type varchar(40) NOT NULL DEFAULT 'custom',
  theme varchar(20) NOT NULL DEFAULT 'light',
  eyebrow varchar(180) NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  cta_label varchar(180) NOT NULL DEFAULT '',
  cta_url text NOT NULL DEFAULT '',
  media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  position integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media_kit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES media_kit_sections(id) ON DELETE CASCADE,
  kind varchar(40) NOT NULL DEFAULT 'card',
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  value text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  source_key varchar(80) NOT NULL DEFAULT 'static',
  icon varchar(80) NOT NULL DEFAULT '',
  media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  position integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_kit_sections_position_idx ON media_kit_sections(position, created_at);
CREATE INDEX IF NOT EXISTS media_kit_items_section_position_idx ON media_kit_items(section_id, position, created_at);

INSERT INTO media_kit_settings (id, document_title, edition, footer_website, show_page_numbers)
VALUES ('default', 'Mídia Kit', '2026', 'landerrecords.com', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO media_kit_sections (id, type, theme, eyebrow, title, subtitle, body, cta_label, cta_url, position, enabled) VALUES
('61000000-0000-4000-8000-000000000001','cover','dark','LANDER RECORDS · 2026','CONECTANDO ARTISTAS, MÚSICA E OPORTUNIDADES.','Gravadora, produtora musical e gestão artística 360°.','Mais que uma gravadora. Um ecossistema para talentos, marcas, projetos e boas ideias.','','',1,true),
('61000000-0000-4000-8000-000000000002','editorial','light','INSTITUCIONAL','SOBRE A LANDER RECORDS','','A Lander Records atua como gravadora, produtora musical e estrutura de gestão artística 360°, conectando desenvolvimento de carreira, produção, conteúdo, posicionamento e oportunidades comerciais.\n\nNosso objetivo é transformar música em projetos consistentes, aproximando artistas, público e parceiros em experiências relevantes e sustentáveis.','','',2,true),
('61000000-0000-4000-8000-000000000003','audience','light','AUDIÊNCIA','NOSSA AUDIÊNCIA','Dados e perfil de público','A estrutura está pronta para receber métricas verificadas das integrações e também conteúdo editorial manual.','','',3,true),
('61000000-0000-4000-8000-000000000004','cards','light','COMERCIAL','FORMATOS DE PARCERIA','','Soluções para marcas que desejam se conectar com música, cultura e artistas dentro do ecossistema Lander Records.','','',4,true),
('61000000-0000-4000-8000-000000000005','artists','light','CASTING','ARTISTAS & DESTAQUES','','Talentos, lançamentos e possibilidades de exposição reunidos em uma página editorial de alto impacto.','','',5,true),
('61000000-0000-4000-8000-000000000006','contact','light','CONTATO COMERCIAL','VAMOS CONSTRUIR ALGO GRANDE JUNTOS?','','Seja para desenvolver uma campanha, apoiar um artista, patrocinar um projeto ou criar uma iniciativa especial, estamos prontos para conversar.','ENTRE EM CONTATO','mailto:contato@landerrecords.com',6,true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO media_kit_items (id, section_id, kind, title, subtitle, body, label, value, url, source_key, icon, position, enabled) VALUES
('62000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000001','metric','ARTISTAS','Talentos reais','','','', '', 'artists_total','artists',1,true),
('62000000-0000-4000-8000-000000000002','61000000-0000-4000-8000-000000000001','metric','LANÇAMENTOS','Novos sons','','','', '', 'releases_total','media',2,true),
('62000000-0000-4000-8000-000000000003','61000000-0000-4000-8000-000000000001','metric','PARCERIAS','Marcas e projetos','','','', '', 'static','users',3,true),
('62000000-0000-4000-8000-000000000004','61000000-0000-4000-8000-000000000001','metric','PRESENÇA DIGITAL','Audiência em crescimento','','','', '', 'static','chart',4,true),

('62000000-0000-4000-8000-000000000011','61000000-0000-4000-8000-000000000002','metric','ARTISTAS NO CAST','','','','', '', 'artists_total','artists',1,true),
('62000000-0000-4000-8000-000000000012','61000000-0000-4000-8000-000000000002','metric','LANÇAMENTOS','','','','', '', 'releases_total','media',2,true),
('62000000-0000-4000-8000-000000000013','61000000-0000-4000-8000-000000000002','metric','PUBLICAÇÕES','','','','', '', 'posts_total','posts',3,true),
('62000000-0000-4000-8000-000000000014','61000000-0000-4000-8000-000000000002','metric','ALCANCE MENSAL','','','','A integrar', '', 'static','chart',4,true),
('62000000-0000-4000-8000-000000000015','61000000-0000-4000-8000-000000000002','metric','SEGUIDORES','','','','A integrar', '', 'static','users',5,true),

('62000000-0000-4000-8000-000000000021','61000000-0000-4000-8000-000000000003','metric','PERFIL DO PÚBLICO','','','','A integrar', '', 'static','users',1,true),
('62000000-0000-4000-8000-000000000022','61000000-0000-4000-8000-000000000003','metric','FAIXA ETÁRIA','','','','A integrar', '', 'static','chart',2,true),
('62000000-0000-4000-8000-000000000023','61000000-0000-4000-8000-000000000003','bullet','Música e lançamentos','','','','', '', 'static','media',3,true),
('62000000-0000-4000-8000-000000000024','61000000-0000-4000-8000-000000000003','bullet','Shows e experiências','','','','', '', 'static','calendar',4,true),
('62000000-0000-4000-8000-000000000025','61000000-0000-4000-8000-000000000003','contact','PRESENÇA GEOGRÁFICA','','','','', '', 'location','target',5,true),

('62000000-0000-4000-8000-000000000031','61000000-0000-4000-8000-000000000004','card','Patrocínio','','Presença de marca em projetos, lançamentos e iniciativas especiais.','','', '', 'static','target',1,true),
('62000000-0000-4000-8000-000000000032','61000000-0000-4000-8000-000000000004','card','Publieditorial','','Conteúdo editorial integrado ao ecossistema da Lander Records.','','', '', 'static','posts',2,true),
('62000000-0000-4000-8000-000000000033','61000000-0000-4000-8000-000000000004','card','Campanhas digitais','','Campanhas multiplataforma pensadas para música, cultura e comunidade.','','', '', 'static','chart',3,true),
('62000000-0000-4000-8000-000000000034','61000000-0000-4000-8000-000000000004','card','Redes sociais','','Conteúdo nativo, menções e ativações nos canais oficiais.','','', '', 'static','smartphone',4,true),
('62000000-0000-4000-8000-000000000035','61000000-0000-4000-8000-000000000004','card','Eventos','','Shows, showcases, listening parties e experiências de marca.','','', '', 'static','artists',5,true),
('62000000-0000-4000-8000-000000000036','61000000-0000-4000-8000-000000000004','card','Newsletter','','Comunicação direta com uma base qualificada quando o canal estiver conectado.','','', '', 'static','mail',6,true),

('62000000-0000-4000-8000-000000000041','61000000-0000-4000-8000-000000000005','bullet','Sua marca no projeto','','','','', '', 'static','plus',1,true),
('62000000-0000-4000-8000-000000000042','61000000-0000-4000-8000-000000000005','bullet','Citação em redes sociais','','','','', '', 'static','plus',2,true),
('62000000-0000-4000-8000-000000000043','61000000-0000-4000-8000-000000000005','bullet','Branding em shows','','','','', '', 'static','plus',3,true),
('62000000-0000-4000-8000-000000000044','61000000-0000-4000-8000-000000000005','bullet','Ações com fãs','','','','', '', 'static','plus',4,true),
('62000000-0000-4000-8000-000000000045','61000000-0000-4000-8000-000000000005','bullet','Conteúdo exclusivo','','','','', '', 'static','plus',5,true),
('62000000-0000-4000-8000-000000000046','61000000-0000-4000-8000-000000000005','bullet','Projetos especiais','','','','', '', 'static','plus',6,true),

('62000000-0000-4000-8000-000000000051','61000000-0000-4000-8000-000000000006','contact','E-mail','','','','', '', 'contact_email','mail',1,true),
('62000000-0000-4000-8000-000000000052','61000000-0000-4000-8000-000000000006','contact','Telefone','','','','', '', 'contact_phone','smartphone',2,true),
('62000000-0000-4000-8000-000000000053','61000000-0000-4000-8000-000000000006','contact','Instagram','','','','', '', 'instagram','users',3,true),
('62000000-0000-4000-8000-000000000054','61000000-0000-4000-8000-000000000006','contact','Site','','','','', '', 'website','external',4,true),
('62000000-0000-4000-8000-000000000055','61000000-0000-4000-8000-000000000006','contact','Localização','','','','', '', 'location','target',5,true)
ON CONFLICT (id) DO NOTHING;

COMMIT;
