BEGIN;

-- Existing public media is registered as a real static asset. New uploads use object storage.
INSERT INTO media_assets (id, storage_provider, storage_key, url, mime_type, byte_size, alt_text, original_filename)
VALUES (
  '10000000-0000-4000-8000-000000000001',
  'static_public',
  'public/dj-stay-home-card.webp',
  '/dj-stay-home-card.webp',
  'image/webp',
  14464,
  'DJ Stay',
  'dj-stay-home-card.webp'
) ON CONFLICT (storage_key) DO NOTHING;

INSERT INTO site_settings (
  id, brand_name, tagline, contact_email, contact_phone, location, address, hours,
  default_seo_title, default_seo_description
) VALUES (
  'site',
  'Lander Records',
  'Gravadora, produtora musical e gestão artística 360°.',
  'contato@landerrecords.com',
  '+55 33 99856 1526',
  'Governador Valadares · MG',
  'Rua Joaquim Pereira Duarte Nº 58 · Vila Império · Governador Valadares · MG · 35050-560',
  'Seg–Sex · 08:00–17:00',
  'Lander Records',
  'Gravadora, produtora musical e gestão artística 360°.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO social_links (id, platform, label, url, position, active) VALUES
  ('11000000-0000-4000-8000-000000000001','instagram','Instagram','',1,true),
  ('11000000-0000-4000-8000-000000000002','youtube','YouTube','',2,true),
  ('11000000-0000-4000-8000-000000000003','tiktok','TikTok','',3,true),
  ('11000000-0000-4000-8000-000000000004','spotify','Spotify','',4,true),
  ('11000000-0000-4000-8000-000000000005','soundcloud','SoundCloud','',5,true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO artist_categories (id,name,slug,position,active,show_as_filter) VALUES
  ('20000000-0000-4000-8000-000000000001','DJ','dj',1,true,true),
  ('20000000-0000-4000-8000-000000000002','MC','mc',2,true,true),
  ('20000000-0000-4000-8000-000000000003','Pagodão Baiano','pagodao-baiano',3,true,true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO artists (
  id,name,slug,eyebrow,short_bio,biography,card_media_id,hero_media_id,
  is_published,published_at,feature_on_home,home_position,list_position,seo_title,seo_description
) VALUES (
  '21000000-0000-4000-8000-000000000001',
  'DJ Stay',
  'dj-stay',
  'DJ · PRODUTOR MUSICAL',
  'DJ Stay integra o casting da Lander Records com foco em funk, produção musical e construção de identidade artística.',
  'DJ Stay integra o casting da Lander Records com foco em funk, produção musical e construção de identidade artística.',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  true,
  now(),
  true,
  1,
  1,
  'DJ Stay',
  'DJ Stay integra o casting da Lander Records com foco em funk, produção musical e construção de identidade artística.'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO artist_category_relations (artist_id,category_id,is_primary,position)
VALUES ('21000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',true,1)
ON CONFLICT DO NOTHING;

INSERT INTO post_categories (id,name,slug,position,active,show_as_filter) VALUES
  ('30000000-0000-4000-8000-000000000001','Bastidores','bastidores',1,true,true),
  ('30000000-0000-4000-8000-000000000002','Lançamentos','lancamentos',2,true,true),
  ('30000000-0000-4000-8000-000000000003','Notícias','noticias',3,true,true),
  ('30000000-0000-4000-8000-000000000004','Entretenimento','entretenimento',4,true,true),
  ('30000000-0000-4000-8000-000000000005','Mercado','mercado',5,true,true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO posts (
  id,title,slug,excerpt,content_markdown,author_name,category_id,status,featured_on_home,home_position,published_at,seo_title,seo_description
) VALUES
(
 '31000000-0000-4000-8000-000000000001',
 'DJ Stay prepara nova fase de lançamentos com a Lander Records',
 'dj-stay-lancamento-lander',
 'Nova etapa reúne produção, estratégia digital e distribuição em um calendário integrado.',
 E'A Lander Records inicia uma nova fase de planejamento para os próximos lançamentos de DJ Stay, reunindo produção musical, conteúdo e distribuição em uma mesma estratégia.\n\nO projeto reforça a proposta da gravadora de trabalhar carreira e catálogo de forma integrada, conectando criação, posicionamento e crescimento de audiência.\n\nNovos conteúdos e informações sobre os lançamentos serão publicados no portal oficial da Lander Records.',
 'Lander Records',
 '30000000-0000-4000-8000-000000000002',
 'published',true,1,'2026-08-15T12:00:00Z',
 'DJ Stay prepara nova fase de lançamentos com a Lander Records',
 'Nova etapa reúne produção, estratégia digital e distribuição em um calendário integrado.'
),
(
 '31000000-0000-4000-8000-000000000002',
 'Por dentro do processo de produção musical da Lander Records',
 'bastidores-producao-musical',
 'Da ideia inicial ao master, conheça as etapas que estruturam uma produção dentro da Lander.',
 E'Cada produção começa com direção artística, repertório e definição de objetivo para o lançamento.\n\nA partir disso, produção, gravação, mixagem e masterização são conduzidas de forma conectada, preservando identidade e consistência sonora.\n\nO processo também considera distribuição, conteúdo e estratégia de comunicação desde as primeiras etapas.',
 'Lander Records',
 '30000000-0000-4000-8000-000000000001',
 'published',true,2,'2026-08-12T12:00:00Z',
 'Por dentro do processo de produção musical da Lander Records',
 'Da ideia inicial ao master, conheça as etapas que estruturam uma produção dentro da Lander.'
),
(
 '31000000-0000-4000-8000-000000000003',
 'O que significa gestão artística 360° na prática',
 'gestao-artistica-360',
 'Estratégia, operação e acompanhamento contínuo para transformar oportunidades em carreira.',
 E'Gestão artística 360° significa olhar para a carreira como um sistema completo, e não como ações isoladas.\n\nAgenda, contratos, repertório, lançamentos, presença digital, conteúdo e posicionamento precisam trabalhar na mesma direção.\n\nEsse modelo permite decisões mais consistentes e uma construção de longo prazo para artistas e projetos.',
 'Equipe Lander',
 '30000000-0000-4000-8000-000000000005',
 'published',true,3,'2026-08-08T12:00:00Z',
 'O que significa gestão artística 360° na prática',
 'Estratégia, operação e acompanhamento contínuo para transformar oportunidades em carreira.'
)
ON CONFLICT (slug) DO NOTHING;

-- No release rows are seeded: the current synchronized Spotify source is empty.

INSERT INTO pages (id,key,title,slug,enabled,seo_title,seo_description) VALUES
  ('50000000-0000-4000-8000-000000000001','home','Início','',true,'Lander Records','Gravadora e produtora musical com foco em funk.'),
  ('50000000-0000-4000-8000-000000000002','about','Sobre Nós','sobre-nos',true,'Sobre Nós','Uma estrutura criada para desenvolver música, carreira e negócios de forma integrada.'),
  ('50000000-0000-4000-8000-000000000003','artists','Artistas','artistas',true,'Artistas','Conheça os artistas do casting da Lander Records.'),
  ('50000000-0000-4000-8000-000000000004','news','Portal de Notícias','noticias',true,'Portal de Notícias','Lançamentos, bastidores, mercado e novidades do nosso universo.'),
  ('50000000-0000-4000-8000-000000000005','contact','Contato','contato',true,'Contato','Contratação, produção musical, distribuição, audiovisual, marketing ou parcerias.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO page_sections (id,page_id,section_key,type,eyebrow,title,subtitle,body,position,enabled) VALUES
 ('51000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','hero','hero','','LANDER','Gravadora e produtora musical com foco em funk.','',1,true),
 ('51000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000001','intro','split','LANDER RECORDS',E'Produtora artística e\ngravadora musical','',E'A Lander Records reúne produção, desenvolvimento artístico, distribuição e estratégia em uma operação focada em música e carreira.\n\nDa criação ao lançamento, cada projeto recebe acompanhamento próximo e execução profissional.',2,true),
 ('51000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000001','shortcuts','shortcut_grid','','','','',3,true),
 ('51000000-0000-4000-8000-000000000004','50000000-0000-4000-8000-000000000001','artists','artist_feed','','NOSSOS ARTISTAS','Conheça os talentos que fazem parte do nosso time.','',4,true),
 ('51000000-0000-4000-8000-000000000005','50000000-0000-4000-8000-000000000001','releases','release_feed','','ÚLTIMOS LANÇAMENTOS','','',5,true),
 ('51000000-0000-4000-8000-000000000006','50000000-0000-4000-8000-000000000001','news','post_feed','PORTAL LANDER','ÚLTIMAS NOVIDADES','','',6,true),

 ('52000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000002','hero','hero','LANDER RECORDS','Sobre Nós','Uma estrutura criada para desenvolver música, carreira e negócios de forma integrada.','',1,true),
 ('52000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000002','history','split','NOSSA HISTÓRIA','Nossa História','LANDER RECORDS · BRASIL','A trajetória de Deyvisson Lander Andrade começou no setor de transporte internacional, atendendo empresas fora do Brasil. Em 2022, decidiu seguir sua verdadeira paixão: a música. Primeiro como sócio-investidor e, em 2023, fundou a Lander Records, uma gravadora criada para inovar, valorizar a autenticidade e oferecer suporte real aos artistas.',2,true),
 ('52000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000002','identity','cards','IDENTIDADE','Missão, visão e valores.','','',3,true),
 ('52000000-0000-4000-8000-000000000004','50000000-0000-4000-8000-000000000002','pillars','cards','NOSSOS PILARES','Uma operação 360°.','Seis frentes que trabalham juntas para transformar música em carreira, catálogo e negócio.','',4,true),
 ('52000000-0000-4000-8000-000000000005','50000000-0000-4000-8000-000000000002','companies','tabs','ECOSSISTEMA LANDER','Empresas do Grupo Lander.','Conheça as frentes que formam o ecossistema e atuam de forma complementar em música, audiovisual e conteúdo.','',5,true),
 ('52000000-0000-4000-8000-000000000006','50000000-0000-4000-8000-000000000002','methodology','numbered_list','METODOLOGIA','Gestão Artística 360°.','Nossa atuação conecta todas as etapas do desenvolvimento artístico em um único ecossistema, da criação ao posicionamento no mercado.','',6,true),

 ('53000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000003','hero','hero','CASTING','Artistas','Conheça os talentos que fazem parte da Lander Records.','',1,true),
 ('54000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000004','hero','hero','LANDER RECORDS','Portal de Notícias','Lançamentos, bastidores, mercado e novidades do nosso universo.','',1,true),
 ('55000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000005','hero','hero','CONTATO','Entre em contato','Contratação, produção musical, distribuição, audiovisual, marketing ou parcerias.','',1,true),
 ('55000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000005','intro','contact_intro','LANDER RECORDS','Vamos falar sobre o seu projeto.','','Envie os dados do projeto e nossa equipe retorna pelo canal informado.',2,true)
ON CONFLICT (page_id,section_key) DO NOTHING;

INSERT INTO page_section_items (id,section_id,item_key,title,label,url,position,enabled) VALUES
 ('56000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000001','primary','Fale conosco','Fale conosco','/contato',1,true),
 ('56000000-0000-4000-8000-000000000002','51000000-0000-4000-8000-000000000001','secondary','Conheça nossos artistas','Conheça nossos artistas','/artistas',2,true),
 ('56000000-0000-4000-8000-000000000003','51000000-0000-4000-8000-000000000002','about','Conheça a Lander','Conheça a Lander','/sobre-nos',1,true),
 ('56000000-0000-4000-8000-000000000004','51000000-0000-4000-8000-000000000003','booking','Contrate para shows','Contrate para shows','/artistas/dj-stay',1,true),
 ('56000000-0000-4000-8000-000000000005','51000000-0000-4000-8000-000000000003','production','Produza sua música','Produza sua música','/sobre-nos#metodologia',2,true),
 ('56000000-0000-4000-8000-000000000006','51000000-0000-4000-8000-000000000003','distribution','Edição & distribuição','Edição & distribuição','/sobre-nos#metodologia',3,true),
 ('56000000-0000-4000-8000-000000000007','51000000-0000-4000-8000-000000000003','portal','Portal Lander','Portal Lander','/noticias',4,true),
 ('56000000-0000-4000-8000-000000000008','51000000-0000-4000-8000-000000000005','spotify','Spotify','Ver no Spotify','https://open.spotify.com',1,true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO page_section_items (id,section_id,item_key,title,body,subtitle,position,enabled) VALUES
 ('57000000-0000-4000-8000-000000000001','52000000-0000-4000-8000-000000000003','mission','Missão','Desenvolver artistas e projetos com estrutura, estratégia e visão de longo prazo.','',1,true),
 ('57000000-0000-4000-8000-000000000002','52000000-0000-4000-8000-000000000003','vision','Visão','Construir uma operação musical relevante, conectada ao mercado e à cultura.','',2,true),
 ('57000000-0000-4000-8000-000000000003','52000000-0000-4000-8000-000000000003','values','Valores','Transparência, criatividade, disciplina, parceria e compromisso com resultado.','',3,true),

 ('57000000-0000-4000-8000-000000000011','52000000-0000-4000-8000-000000000004','artist','Artista','O artista está no centro da operação. Identidade, repertório, posicionamento e objetivos orientam todas as decisões.','',1,true),
 ('57000000-0000-4000-8000-000000000012','52000000-0000-4000-8000-000000000004','strategy','Estratégia','Planejamento de carreira, lançamentos, público, calendário e oportunidades com visão de curto, médio e longo prazo.','',2,true),
 ('57000000-0000-4000-8000-000000000013','52000000-0000-4000-8000-000000000004','production','Produção','Direção artística, produção musical, audiovisual e conteúdo conectados à proposta de cada projeto.','',3,true),
 ('57000000-0000-4000-8000-000000000014','52000000-0000-4000-8000-000000000004','distribution','Distribuição','Organização de catálogo, metadados, direitos e presença nas plataformas para ampliar alcance e monetização.','',4,true),
 ('57000000-0000-4000-8000-000000000015','52000000-0000-4000-8000-000000000004','content','Conteúdo','Narrativas, campanhas e formatos pensados para transformar música em presença cultural e relacionamento com audiência.','',5,true),
 ('57000000-0000-4000-8000-000000000016','52000000-0000-4000-8000-000000000004','management','Gestão','Agenda, contratos, operação, parceiros e indicadores acompanhados de forma integrada para sustentar crescimento.','',6,true),

 ('57000000-0000-4000-8000-000000000021','52000000-0000-4000-8000-000000000005','records','Lander Records','Gravadora e produtora musical dedicada ao desenvolvimento artístico, produção, lançamentos, distribuição, conteúdo e gestão de carreira.','LANDER RECORDS · GRAVADORA · PRODUTORA',1,true),
 ('57000000-0000-4000-8000-000000000022','52000000-0000-4000-8000-000000000005','cine','Lander Cine','Frente audiovisual do grupo voltada a videoclipes, campanhas, conteúdos digitais, direção criativa e produção de imagem para artistas e marcas.','LANDER CINE · AUDIOVISUAL',2,true),
 ('57000000-0000-4000-8000-000000000023','52000000-0000-4000-8000-000000000005','portal','Portal Lander','Plataforma editorial do ecossistema Lander para notícias, lançamentos, bastidores, entretenimento e cobertura do mercado musical.','PORTAL LANDER · MÍDIA · CONTEÚDO',3,true),

 ('57000000-0000-4000-8000-000000000031','52000000-0000-4000-8000-000000000006','music-audiovisual','Produção musical e audiovisual','Criação e produção de conteúdo musical e visual de alta qualidade.','',1,true),
 ('57000000-0000-4000-8000-000000000032','52000000-0000-4000-8000-000000000006','branding','Branding e identidade artística','Desenvolvimento e fortalecimento da marca pessoal do artista.','',2,true),
 ('57000000-0000-4000-8000-000000000033','52000000-0000-4000-8000-000000000006','marketing','Marketing e lançamentos digitais','Estratégias de divulgação e promoção em plataformas digitais.','',3,true),
 ('57000000-0000-4000-8000-000000000034','52000000-0000-4000-8000-000000000006','career','Planejamento de carreira e repertório','Definição de metas claras e seleção estratégica de conteúdo.','',4,true),
 ('57000000-0000-4000-8000-000000000035','52000000-0000-4000-8000-000000000006','booking','Agenciamento de shows e parcerias','Negociação e gestão de apresentações ao vivo e colaborações.','',5,true),
 ('57000000-0000-4000-8000-000000000036','52000000-0000-4000-8000-000000000006','legal','Assessoria jurídica e estratégica','Suporte em questões legais e tomadas de decisão importantes.','',6,true),
 ('57000000-0000-4000-8000-000000000037','52000000-0000-4000-8000-000000000006','distribution','Distribuição musical e editorial','Gestão dos direitos autorais e distribuição em plataformas digitais.','',7,true),
 ('57000000-0000-4000-8000-000000000038','52000000-0000-4000-8000-000000000006','summary','Estratégia integrada.','Todos os setores trabalham conectados por metas, dados e decisões compartilhadas para construir carreiras consistentes e sustentáveis.','',8,true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO navigation_items (id,menu_key,label,url,link_type,position,enabled,new_tab) VALUES
 ('60000000-0000-4000-8000-000000000001','primary','Início','/','internal',1,true,false),
 ('60000000-0000-4000-8000-000000000002','primary','Sobre Nós','/sobre-nos','internal',2,true,false),
 ('60000000-0000-4000-8000-000000000003','primary','Artistas','/artistas','internal',3,true,false),
 ('60000000-0000-4000-8000-000000000004','primary','Notícias','/noticias','internal',4,true,false),
 ('60000000-0000-4000-8000-000000000005','primary','Contato','/contato','internal',5,true,false),
 ('60000000-0000-4000-8000-000000000011','footer','Início','/','internal',1,true,false),
 ('60000000-0000-4000-8000-000000000012','footer','Sobre','/sobre-nos','internal',2,true,false),
 ('60000000-0000-4000-8000-000000000013','footer','Artistas','/artistas','internal',3,true,false),
 ('60000000-0000-4000-8000-000000000014','footer','Metodologia','/sobre-nos#metodologia','internal',4,true,false),
 ('60000000-0000-4000-8000-000000000015','footer','Notícias','/noticias','internal',5,true,false),
 ('60000000-0000-4000-8000-000000000016','footer','Quero Contratar','/contato','internal',6,true,false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO contact_topics (id,name,slug,saas_type,position,active) VALUES
 ('70000000-0000-4000-8000-000000000001','Contratação de artista','contratacao-de-artista','lead.artist_booking',1,true),
 ('70000000-0000-4000-8000-000000000002','Produção musical','producao-musical','lead.music_production',2,true),
 ('70000000-0000-4000-8000-000000000003','Edição e distribuição','edicao-e-distribuicao','lead.distribution',3,true),
 ('70000000-0000-4000-8000-000000000004','Produção audiovisual','producao-audiovisual','lead.audiovisual',4,true),
 ('70000000-0000-4000-8000-000000000005','Marketing artístico','marketing-artistico','lead.artist_marketing',5,true),
 ('70000000-0000-4000-8000-000000000006','Parceria','parceria','lead.partnership',6,true),
 ('70000000-0000-4000-8000-000000000007','Imprensa','imprensa','lead.press',7,true),
 ('70000000-0000-4000-8000-000000000008','Outro','outro','lead.other',8,true)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
