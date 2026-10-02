BEGIN;

-- The public Lander Records implementation is the canonical page/section contract.
-- Portal Lander remains an administrative UX reference only.

-- Register the commercial banner that already exists in the public site so the
-- Home can consume it through the CMS instead of a hardcoded asset path.
INSERT INTO media_assets (
  id, storage_provider, storage_key, url, mime_type, byte_size, alt_text, original_filename
) VALUES (
  '10000000-0000-4000-8000-000000000002',
  'static_public',
  'public/lander-records-anuncie-banner.webp',
  '/lander-records-anuncie-banner.webp',
  'image/webp',
  93416,
  'Anuncie com a gente — Lander Records',
  'lander-records-anuncie-banner.webp'
)
ON CONFLICT (storage_key) DO UPDATE SET
  url = EXCLUDED.url,
  mime_type = EXCLUDED.mime_type,
  byte_size = EXCLUDED.byte_size,
  alt_text = EXCLUDED.alt_text,
  original_filename = EXCLUDED.original_filename,
  updated_at = now();

-- Home: the real public composition is Hero → Apresentação → Atalhos → Artistas
-- → Lançamentos → Anuncie com a Lander → Últimas novidades.
INSERT INTO section_definitions (key, name, type, description, active) VALUES
  ('advertise_banner','Anuncie com a Lander','media_banner','Banner comercial existente na Home da Lander Records.',true),
  ('legal_body','Conteúdo legal','legal_body','Cláusulas das páginas legais da Lander Records.',true)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  active = true,
  updated_at = now();

UPDATE page_sections
SET position = 7, updated_at = now()
WHERE page_id = '50000000-0000-4000-8000-000000000001'
  AND section_key = 'news';

INSERT INTO page_sections (
  id, page_id, section_key, type, eyebrow, title, subtitle, body, position, enabled
) VALUES (
  '51000000-0000-4000-8000-000000000007',
  '50000000-0000-4000-8000-000000000001',
  'advertise_banner',
  'media_banner',
  '', '', '', '',
  6,
  true
)
ON CONFLICT (page_id, section_key) DO UPDATE SET
  type = EXCLUDED.type,
  position = EXCLUDED.position,
  enabled = true,
  updated_at = now();

INSERT INTO page_section_bindings (page_section_id, definition_id)
SELECT ps.id, sd.id
FROM page_sections ps
JOIN section_definitions sd ON sd.key = ps.section_key
WHERE ps.page_id = '50000000-0000-4000-8000-000000000001'
  AND ps.section_key = 'advertise_banner'
ON CONFLICT DO NOTHING;

INSERT INTO page_section_items (
  id, section_id, item_key, title, subtitle, body, label, url, media_id, position, enabled
)
SELECT
  '56000000-0000-4000-8000-000000000009',
  ps.id,
  'banner',
  'Anuncie com a Lander Records',
  '', '', '', '',
  '10000000-0000-4000-8000-000000000002',
  1,
  true
FROM page_sections ps
WHERE ps.page_id = '50000000-0000-4000-8000-000000000001'
  AND ps.section_key = 'advertise_banner'
ON CONFLICT (id) DO UPDATE SET
  section_id = EXCLUDED.section_id,
  title = EXCLUDED.title,
  media_id = EXCLUDED.media_id,
  position = EXCLUDED.position,
  enabled = true,
  updated_at = now();

-- About: `pillars` was seeded but has no public consumer. Remove that orphaned
-- CMS section and align persisted order with the actual public renderer.
DELETE FROM page_sections
WHERE page_id = '50000000-0000-4000-8000-000000000002'
  AND section_key = 'pillars';

UPDATE section_definitions
SET active = false, updated_at = now()
WHERE key = 'pillars';

UPDATE page_sections
SET position = 4, updated_at = now()
WHERE page_id = '50000000-0000-4000-8000-000000000002'
  AND section_key = 'methodology';

UPDATE page_sections
SET position = 5, updated_at = now()
WHERE page_id = '50000000-0000-4000-8000-000000000002'
  AND section_key = 'companies';

-- Legal pages are real public routes and therefore belong in Pages CMS.
INSERT INTO pages (id, key, title, slug, enabled, seo_title, seo_description) VALUES
  (
    '50000000-0000-4000-8000-000000000006',
    'privacy',
    'Política de Privacidade',
    'politica-de-privacidade',
    true,
    'Política de Privacidade',
    'Política de Privacidade da Lander Records e informações sobre tratamento de dados pessoais.'
  ),
  (
    '50000000-0000-4000-8000-000000000007',
    'terms',
    'Termos e Condições',
    'termos-e-condicoes',
    true,
    'Termos e Condições',
    'Termos e Condições de uso do site da Lander Records.'
  )
ON CONFLICT (key) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  enabled = true,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  updated_at = now();

INSERT INTO page_sections (
  id, page_id, section_key, type, eyebrow, title, subtitle, body, position, enabled
) VALUES
  ('58000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000006','hero','hero','LANDER RECORDS','Política de Privacidade','Última atualização: 20 de agosto de 2026','',1,true),
  ('58000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000006','legal_body','legal_body','','','','',2,true),
  ('59000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000007','hero','hero','LANDER RECORDS','Termos e Condições','Última atualização: 20 de agosto de 2026','',1,true),
  ('59000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000007','legal_body','legal_body','','','','',2,true)
ON CONFLICT (page_id, section_key) DO UPDATE SET
  type = EXCLUDED.type,
  eyebrow = EXCLUDED.eyebrow,
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  body = EXCLUDED.body,
  position = EXCLUDED.position,
  enabled = true,
  updated_at = now();

INSERT INTO page_section_bindings (page_section_id, definition_id)
SELECT ps.id, sd.id
FROM page_sections ps
JOIN section_definitions sd ON sd.key = ps.section_key
WHERE ps.page_id IN (
  '50000000-0000-4000-8000-000000000006',
  '50000000-0000-4000-8000-000000000007'
)
ON CONFLICT DO NOTHING;

-- Privacy clauses: migrated verbatim from the current public page.
INSERT INTO page_section_items (id, section_id, item_key, title, body, position, enabled)
SELECT v.id, ps.id, v.item_key, v.title, v.body, v.position, true
FROM page_sections ps
CROSS JOIN (VALUES
  ('58100000-0000-4000-8000-000000000001'::uuid,'who-we-are','1. Quem somos','A Lander Records é responsável por este site e pelo tratamento dos dados pessoais coletados por meio de seus canais digitais, formulários e interações relacionadas aos serviços apresentados no site.',1),
  ('58100000-0000-4000-8000-000000000002'::uuid,'data-collected','2. Dados que podemos coletar','Podemos receber dados fornecidos diretamente por você, como nome, telefone, e-mail, empresa, assunto e conteúdo de mensagens enviadas pelos formulários. Também podem ser tratados dados técnicos necessários ao funcionamento e à segurança do site, como endereço IP, tipo de navegador, dispositivo, data e horário de acesso e registros de segurança.',2),
  ('58100000-0000-4000-8000-000000000003'::uuid,'data-use','3. Como utilizamos os dados','Os dados podem ser utilizados para responder contatos, avaliar propostas comerciais, atender solicitações de contratação e parceria, manter a segurança do site, prevenir abusos e fraudes, cumprir obrigações legais e aprimorar nossos serviços e canais de atendimento.',3),
  ('58100000-0000-4000-8000-000000000004'::uuid,'legal-bases','4. Bases legais','O tratamento poderá ocorrer, conforme o caso, com base no consentimento, na execução de procedimentos preliminares ou de contrato, no cumprimento de obrigação legal ou regulatória e em interesses legítimos da Lander Records, sempre observando os direitos do titular previstos na legislação aplicável, incluindo a Lei Geral de Proteção de Dados Pessoais — LGPD.',4),
  ('58100000-0000-4000-8000-000000000005'::uuid,'sharing','5. Compartilhamento de dados','Os dados poderão ser compartilhados somente quando necessário com fornecedores de infraestrutura, hospedagem, armazenamento, segurança, comunicação e demais prestadores que apoiem a operação do site e o atendimento. Também poderemos compartilhar informações quando houver obrigação legal, ordem de autoridade competente ou necessidade de proteção de direitos.',5),
  ('58100000-0000-4000-8000-000000000006'::uuid,'retention','6. Armazenamento e retenção','Mantemos os dados pelo período necessário para cumprir as finalidades informadas, atender obrigações legais, exercer direitos em processos administrativos ou judiciais e preservar registros necessários à segurança e à continuidade das operações.',6),
  ('58100000-0000-4000-8000-000000000007'::uuid,'security','7. Segurança','Adotamos medidas técnicas e administrativas razoáveis para reduzir riscos de acesso não autorizado, perda, alteração, divulgação indevida ou destruição de dados. Nenhum sistema, contudo, pode garantir segurança absoluta em todas as circunstâncias.',7),
  ('58100000-0000-4000-8000-000000000008'::uuid,'rights','8. Direitos do titular','Você pode solicitar, quando aplicável, confirmação de tratamento, acesso, correção, anonimização, bloqueio, eliminação, portabilidade, informações sobre compartilhamento, revisão de decisões automatizadas e revogação do consentimento. As solicitações serão analisadas conforme os limites e requisitos legais.',8),
  ('58100000-0000-4000-8000-000000000009'::uuid,'cookies','9. Cookies e tecnologias semelhantes','O site pode utilizar cookies estritamente necessários e tecnologias similares para funcionamento, segurança, preferências e medição de desempenho. Quando exigido pela legislação, tecnologias opcionais dependerão de consentimento ou de outro fundamento jurídico adequado.',9),
  ('58100000-0000-4000-8000-000000000010'::uuid,'third-party-links','10. Links de terceiros','O site pode conter links para plataformas externas, redes sociais e serviços de terceiros. As práticas de privacidade desses serviços são regidas por suas próprias políticas e não estão sob controle da Lander Records.',10),
  ('58100000-0000-4000-8000-000000000011'::uuid,'changes','11. Alterações desta política','Esta Política de Privacidade poderá ser atualizada para refletir mudanças legais, operacionais ou tecnológicas. A versão vigente será sempre disponibilizada nesta página com a indicação da data da última atualização.',11),
  ('58100000-0000-4000-8000-000000000012'::uuid,'contact','12. Contato','Para dúvidas ou solicitações relacionadas à privacidade e ao tratamento de dados pessoais, utilize os canais disponíveis na página de contato da Lander Records.',12)
) AS v(id,item_key,title,body,position)
WHERE ps.page_id = '50000000-0000-4000-8000-000000000006'
  AND ps.section_key = 'legal_body'
ON CONFLICT (id) DO UPDATE SET
  section_id = EXCLUDED.section_id,
  item_key = EXCLUDED.item_key,
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  position = EXCLUDED.position,
  enabled = true,
  updated_at = now();

-- Terms clauses: migrated verbatim from the current public page.
INSERT INTO page_section_items (id, section_id, item_key, title, body, position, enabled)
SELECT v.id, ps.id, v.item_key, v.title, v.body, v.position, true
FROM page_sections ps
CROSS JOIN (VALUES
  ('59100000-0000-4000-8000-000000000001'::uuid,'acceptance','1. Aceitação dos termos','Ao acessar ou utilizar este site, você declara que leu e concorda com estes Termos e Condições. Caso não concorde com alguma disposição, recomendamos que não utilize o site ou seus recursos interativos.',1),
  ('59100000-0000-4000-8000-000000000002'::uuid,'site-purpose','2. Finalidade do site','O site apresenta informações institucionais, artistas, lançamentos, notícias, serviços, projetos, oportunidades de contratação, publicidade, parceria e canais de contato da Lander Records. O conteúdo poderá ser atualizado, removido ou reorganizado a qualquer momento.',2),
  ('59100000-0000-4000-8000-000000000003'::uuid,'allowed-use','3. Uso permitido','O usuário deve utilizar o site de forma lícita e compatível com sua finalidade. É proibido tentar comprometer a segurança, explorar vulnerabilidades, interferir no funcionamento, automatizar acessos abusivos, introduzir código malicioso ou utilizar o conteúdo para práticas ilegais ou fraudulentas.',3),
  ('59100000-0000-4000-8000-000000000004'::uuid,'intellectual-property','4. Propriedade intelectual','Marcas, logotipos, identidade visual, textos, imagens, fotografias, vídeos, materiais gráficos, nomes artísticos, obras, fonogramas e demais conteúdos exibidos no site podem estar protegidos por direitos autorais, direitos conexos, marcas e outras normas de propriedade intelectual. Nenhum conteúdo poderá ser reproduzido, distribuído, modificado ou explorado comercialmente sem autorização quando essa autorização for exigida por lei.',4),
  ('59100000-0000-4000-8000-000000000005'::uuid,'third-party-content','5. Conteúdo de artistas e terceiros','Determinados materiais podem pertencer a artistas, parceiros, plataformas digitais, produtores, fotógrafos, designers ou outros titulares. A presença desses materiais no site não transfere ao usuário qualquer licença além do acesso normal ao conteúdo publicado.',5),
  ('59100000-0000-4000-8000-000000000006'::uuid,'forms','6. Formulários e contatos','Ao enviar uma mensagem, proposta, solicitação de contratação ou parceria, o usuário declara que as informações fornecidas são verdadeiras e que possui legitimidade para compartilhá-las. O envio de um formulário não cria, por si só, obrigação de contratação, representação, parceria ou resposta comercial.',6),
  ('59100000-0000-4000-8000-000000000007'::uuid,'external-services','7. Links e serviços externos','O site pode direcionar para redes sociais, plataformas de streaming, serviços de vídeo, páginas de artistas e outros ambientes de terceiros. A Lander Records não controla a disponibilidade, segurança, conteúdo ou termos desses serviços externos.',7),
  ('59100000-0000-4000-8000-000000000008'::uuid,'availability','8. Disponibilidade do site','Buscamos manter o site disponível e atualizado, mas não garantimos funcionamento ininterrupto ou livre de falhas. Manutenções, indisponibilidades de fornecedores, eventos de segurança, falhas de rede e outras circunstâncias podem causar interrupções temporárias.',8),
  ('59100000-0000-4000-8000-000000000009'::uuid,'responsibility','9. Responsabilidades','Na medida permitida pela legislação aplicável, a Lander Records não se responsabiliza por danos decorrentes de uso indevido do site, atos de terceiros, indisponibilidade de serviços externos ou decisões tomadas exclusivamente com base em informações que tenham sido alteradas, removidas ou estejam temporariamente indisponíveis.',9),
  ('59100000-0000-4000-8000-000000000010'::uuid,'privacy','10. Privacidade','O tratamento de dados pessoais relacionado ao uso do site é disciplinado pela Política de Privacidade da Lander Records, disponível no rodapé e em página própria.',10),
  ('59100000-0000-4000-8000-000000000011'::uuid,'changes','11. Alterações dos termos','Estes Termos e Condições poderão ser alterados para refletir mudanças no site, nos serviços, nas práticas operacionais ou na legislação. A versão vigente será publicada nesta página com a data da última atualização.',11),
  ('59100000-0000-4000-8000-000000000012'::uuid,'law','12. Legislação aplicável','Estes termos serão interpretados de acordo com a legislação brasileira. Eventuais controvérsias serão tratadas conforme as regras de competência previstas na legislação aplicável, sem prejuízo de direitos assegurados ao usuário por normas obrigatórias.',12),
  ('59100000-0000-4000-8000-000000000013'::uuid,'contact','13. Contato','Para dúvidas sobre estes Termos e Condições, utilize os canais disponíveis na página de contato da Lander Records.',13)
) AS v(id,item_key,title,body,position)
WHERE ps.page_id = '50000000-0000-4000-8000-000000000007'
  AND ps.section_key = 'legal_body'
ON CONFLICT (id) DO UPDATE SET
  section_id = EXCLUDED.section_id,
  item_key = EXCLUDED.item_key,
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  position = EXCLUDED.position,
  enabled = true,
  updated_at = now();

COMMIT;
