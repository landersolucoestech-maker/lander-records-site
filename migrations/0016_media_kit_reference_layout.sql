BEGIN;

UPDATE media_kit_sections
SET settings = '{"coverSideNote":"O SOM DE NOVAS POSSIBILIDADES.","mockupLabel":"MÚSICA MOVE PESSOAS."}'::jsonb
WHERE id = '61000000-0000-4000-8000-000000000001'
  AND settings = '{}'::jsonb;

UPDATE media_kit_sections
SET settings = '{"sideTitle":"MÚSICA, NEGÓCIOS, TENDÊNCIAS E OPORTUNIDADES EM UM SÓ LUGAR.","sideCaption":"TALENTOS HOJE. GRANDES AMANHÃ.","bannerTitle":"VISIBILIDADE, CREDIBILIDADE E RELEVÂNCIA PARA ARTISTAS E MARCAS.","bannerNote":"MÚSICA · CULTURA · OPORTUNIDADES"}'::jsonb
WHERE id = '61000000-0000-4000-8000-000000000002'
  AND settings = '{}'::jsonb;

UPDATE media_kit_sections
SET settings = '{"dataNote":"DADOS DE AUDIÊNCIA · PREENCHA APENAS MÉTRICAS VERIFICADAS"}'::jsonb
WHERE id = '61000000-0000-4000-8000-000000000003'
  AND settings = '{}'::jsonb;

UPDATE media_kit_sections
SET settings = '{"footerNote":"PARCERIAS QUE AMPLIFICAM"}'::jsonb
WHERE id = '61000000-0000-4000-8000-000000000004'
  AND settings = '{}'::jsonb;

UPDATE media_kit_sections
SET settings = '{"featuredLabel":"ARTISTA EM DESTAQUE","quote":"Mais que uma gravadora, é uma parceira de verdade.","quoteAuthor":"Depoimento / crédito a definir","footerNote":"TALENTOS QUE MOVEM O AMANHÃ"}'::jsonb
WHERE id = '61000000-0000-4000-8000-000000000005'
  AND settings = '{}'::jsonb;

UPDATE media_kit_sections
SET settings = '{"nextStepsTitle":"PRÓXIMOS PASSOS","nextStepsBody":"Seguimos evoluindo para criar mais oportunidades, conectar talentos e levar a música ainda mais longe.","closingSlogan":"MÚSICA QUE APROXIMA PESSOAS."}'::jsonb
WHERE id = '61000000-0000-4000-8000-000000000006'
  AND settings = '{}'::jsonb;

UPDATE media_kit_items
SET enabled = false
WHERE id IN (
  '62000000-0000-4000-8000-000000000021',
  '62000000-0000-4000-8000-000000000022',
  '62000000-0000-4000-8000-000000000023',
  '62000000-0000-4000-8000-000000000024',
  '62000000-0000-4000-8000-000000000025'
) AND metadata = '{}'::jsonb;

INSERT INTO media_kit_items
(id, section_id, kind, title, subtitle, body, label, value, url, source_key, icon, position, enabled, metadata)
VALUES
('63000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000003','metric','Mulheres','','','','','','static','users',1,true,'{"group":"gender","percentage":0}'::jsonb),
('63000000-0000-4000-8000-000000000002','61000000-0000-4000-8000-000000000003','metric','Homens','','','','','','static','users',2,true,'{"group":"gender","percentage":0}'::jsonb),

('63000000-0000-4000-8000-000000000011','61000000-0000-4000-8000-000000000003','metric','13–17','','','','','','static','chart',10,true,'{"group":"age","percentage":0}'::jsonb),
('63000000-0000-4000-8000-000000000012','61000000-0000-4000-8000-000000000003','metric','18–24','','','','','','static','chart',11,true,'{"group":"age","percentage":0}'::jsonb),
('63000000-0000-4000-8000-000000000013','61000000-0000-4000-8000-000000000003','metric','25–34','','','','','','static','chart',12,true,'{"group":"age","percentage":0}'::jsonb),
('63000000-0000-4000-8000-000000000014','61000000-0000-4000-8000-000000000003','metric','35–44','','','','','','static','chart',13,true,'{"group":"age","percentage":0}'::jsonb),
('63000000-0000-4000-8000-000000000015','61000000-0000-4000-8000-000000000003','metric','45+','','','','','','static','chart',14,true,'{"group":"age","percentage":0}'::jsonb),

('63000000-0000-4000-8000-000000000021','61000000-0000-4000-8000-000000000003','bullet','Música e novos artistas','','','','','','static','media',20,true,'{"group":"interest","percentage":0}'::jsonb),
('63000000-0000-4000-8000-000000000022','61000000-0000-4000-8000-000000000003','bullet','Entretenimento e cultura','','','','','','static','activity',21,true,'{"group":"interest","percentage":0}'::jsonb),
('63000000-0000-4000-8000-000000000023','61000000-0000-4000-8000-000000000003','bullet','Shows e festivais','','','','','','static','calendar',22,true,'{"group":"interest","percentage":0}'::jsonb),
('63000000-0000-4000-8000-000000000024','61000000-0000-4000-8000-000000000003','bullet','Moda e lifestyle','','','','','','static','users',23,true,'{"group":"interest","percentage":0}'::jsonb),
('63000000-0000-4000-8000-000000000025','61000000-0000-4000-8000-000000000003','bullet','Tecnologia e inovação','','','','','','static','chart',24,true,'{"group":"interest","percentage":0}'::jsonb),
('63000000-0000-4000-8000-000000000026','61000000-0000-4000-8000-000000000003','bullet','Viagens e experiências','','','','','','static','target',25,true,'{"group":"interest","percentage":0}'::jsonb),

('63000000-0000-4000-8000-000000000031','61000000-0000-4000-8000-000000000003','bullet','Cidade principal','','','','','','static','target',30,true,'{"group":"city","percentage":0}'::jsonb),
('63000000-0000-4000-8000-000000000032','61000000-0000-4000-8000-000000000003','bullet','2ª cidade','','','','','','static','target',31,true,'{"group":"city","percentage":0}'::jsonb),
('63000000-0000-4000-8000-000000000033','61000000-0000-4000-8000-000000000003','bullet','3ª cidade','','','','','','static','target',32,true,'{"group":"city","percentage":0}'::jsonb),
('63000000-0000-4000-8000-000000000034','61000000-0000-4000-8000-000000000003','bullet','4ª cidade','','','','','','static','target',33,true,'{"group":"city","percentage":0}'::jsonb),
('63000000-0000-4000-8000-000000000035','61000000-0000-4000-8000-000000000003','bullet','5ª cidade','','','','','','static','target',34,true,'{"group":"city","percentage":0}'::jsonb),
('63000000-0000-4000-8000-000000000036','61000000-0000-4000-8000-000000000003','bullet','Outras','','','','','','static','target',35,true,'{"group":"city","percentage":0}'::jsonb)
ON CONFLICT (id) DO NOTHING;

COMMIT;
