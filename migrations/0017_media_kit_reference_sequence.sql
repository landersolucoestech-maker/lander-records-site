BEGIN;

-- Align the persisted canonical Media Kit with the six-page editorial reference.
-- Preserve user-created sections/items outside the canonical seed ids.

UPDATE media_kit_sections
SET
  eyebrow = 'COMERCIAL',
  title = 'FORMATOS DE PUBLICIDADE',
  body = 'A Lander Records oferece diferentes espaços para marcas, integrados à estrutura editorial, artística e aos nossos canais, garantindo presença qualificada e conexão direta com o público.',
  settings = COALESCE(settings, '{}'::jsonb) || '{"footerNote":"FORMATOS COMERCIAIS"}'::jsonb,
  updated_at = now()
WHERE id = '61000000-0000-4000-8000-000000000004';

UPDATE media_kit_items
SET title = 'Banner topo',
    body = 'Exibição em área nobre, com alta visibilidade para campanhas, lançamentos e ativações.',
    icon = 'media',
    updated_at = now()
WHERE id = '62000000-0000-4000-8000-000000000031';

UPDATE media_kit_items
SET title = 'Publicidade lateral',
    body = 'Inserção contextual em páginas editoriais e áreas de navegação do site.',
    icon = 'pages',
    updated_at = now()
WHERE id = '62000000-0000-4000-8000-000000000032';

UPDATE media_kit_items
SET title = 'Anuncie aqui',
    body = 'Área dedicada com chamada direta para anunciantes, marcas e parceiros.',
    icon = 'plus',
    updated_at = now()
WHERE id = '62000000-0000-4000-8000-000000000033';

UPDATE media_kit_items
SET title = 'Página de conteúdo',
    body = 'Conteúdo de marca integrado ao fluxo editorial e à experiência da audiência.',
    icon = 'document',
    updated_at = now()
WHERE id = '62000000-0000-4000-8000-000000000034';

UPDATE media_kit_items
SET title = 'Newsletter',
    body = 'Presença de marca em comunicação direta para uma audiência segmentada.',
    icon = 'mail',
    updated_at = now()
WHERE id = '62000000-0000-4000-8000-000000000035';

UPDATE media_kit_items
SET title = 'Redes sociais',
    body = 'Divulgação nos canais oficiais com formatos adaptados para cada plataforma.',
    icon = 'smartphone',
    updated_at = now()
WHERE id = '62000000-0000-4000-8000-000000000036';

UPDATE media_kit_sections
SET
  type = 'application',
  theme = 'light',
  eyebrow = 'APLICAÇÃO',
  title = 'EXEMPLO DE APLICAÇÃO',
  subtitle = '',
  body = 'Veja como sua marca pode estar presente de forma natural e estratégica, integrada ao conteúdo e à experiência da audiência.',
  cta_label = '',
  cta_url = '',
  settings = COALESCE(settings, '{}'::jsonb)
    - 'featuredLabel'
    - 'quote'
    - 'quoteAuthor'
    || '{"footerNote":"APLICAÇÃO COMERCIAL"}'::jsonb,
  updated_at = now()
WHERE id = '61000000-0000-4000-8000-000000000005';

UPDATE media_kit_items
SET
  kind = 'item',
  title = 'Banner Topo',
  body = '',
  label = '',
  value = '',
  source_key = 'static',
  icon = 'plus',
  position = 1,
  enabled = true,
  metadata = '{}'::jsonb,
  updated_at = now()
WHERE id = '62000000-0000-4000-8000-000000000041';

UPDATE media_kit_items
SET
  kind = 'item',
  title = 'Publicidade Lateral',
  body = '',
  label = '',
  value = '',
  source_key = 'static',
  icon = 'plus',
  position = 2,
  enabled = true,
  metadata = '{}'::jsonb,
  updated_at = now()
WHERE id = '62000000-0000-4000-8000-000000000042';

UPDATE media_kit_items
SET
  kind = 'item',
  title = 'Anuncie Aqui',
  body = '',
  label = '',
  value = '',
  source_key = 'static',
  icon = 'plus',
  position = 3,
  enabled = true,
  metadata = '{}'::jsonb,
  updated_at = now()
WHERE id = '62000000-0000-4000-8000-000000000043';

UPDATE media_kit_items
SET
  kind = 'item',
  title = 'Conteúdo Editorial',
  body = '',
  label = '',
  value = '',
  source_key = 'static',
  icon = 'plus',
  position = 4,
  enabled = true,
  metadata = '{}'::jsonb,
  updated_at = now()
WHERE id = '62000000-0000-4000-8000-000000000044';

UPDATE media_kit_items
SET enabled = false, updated_at = now()
WHERE id IN (
  '62000000-0000-4000-8000-000000000045',
  '62000000-0000-4000-8000-000000000046'
);

UPDATE media_kit_sections
SET
  eyebrow = 'CONTATO',
  title = 'VAMOS CONSTRUIR ALGO GRANDE JUNTOS?',
  body = 'Sua marca ou projeto merece estratégia, repertório e oportunidades. Fale com nossa equipe e descubra as melhores soluções para o seu objetivo.',
  cta_label = 'ENTRE EM CONTATO',
  settings = COALESCE(settings, '{}'::jsonb)
    || '{"nextStepsTitle":"PRÓXIMOS PASSOS","nextStepsBody":"Seguimos evoluindo para oferecer mais conteúdo, formatos e oportunidades. A cobertura de eventos, ativações com artistas e projetos especiais fazem parte da nossa expansão.","closingSlogan":"MÚSICA QUE APROXIMA PESSOAS.","footerNote":"LANDER RECORDS · 2026"}'::jsonb,
  updated_at = now()
WHERE id = '61000000-0000-4000-8000-000000000006';

COMMIT;
