# Auditoria SITE LANDER RECORDS → CMS

Data da auditoria: 2026-09-16  
Fonte de verdade: implementação pública existente em `app/(public)`, componentes públicos, módulos de domínio, assets e dados persistidos do próprio projeto Lander Records.

## Regra arquitetural

O Portal Lander pode orientar shell administrativo, navegação, densidade, padrões de formulário, tabs, preview e demais decisões de UX do painel. Ele não define páginas, seções, campos, textos, assets, CTAs ou comportamento público da Lander Records.

O contrato executável desta auditoria está em `app/admin/(protected)/pages/site-page-contract.ts`. Uma seção ou campo só deve aparecer no editor quando existe um consumidor público identificado ou quando o contrato registra explicitamente o módulo de domínio responsável.

## Mapa público canônico

| Página | Rota | Seções na ordem pública | Fonte principal |
| --- | --- | --- | --- |
| Página inicial | `/` | Hero Section → Apresentação institucional → Atalhos de serviços → Artistas em destaque → Últimos lançamentos → Anuncie com a Lander → Últimas novidades | `app/(public)/page.tsx` |
| Sobre Nós | `/sobre-nos` | Hero institucional → Nossa História → Missão, visão e valores → Gestão Artística 360° → Empresas do Grupo Lander | `app/(public)/sobre-nos/page.tsx` |
| Artistas | `/artistas` | Hero do casting → Filtros de artistas → Catálogo de artistas | `app/(public)/artistas/page.tsx` + `ArtistFilterGrid.tsx` |
| Notícias | `/noticias` | Hero de notícias → Categorias de notícias → Lista de notícias | `app/(public)/noticias/page.tsx` + módulo de posts |
| Contato | `/contato` | Hero de contato → Apresentação de contato | `app/(public)/contato/page.tsx` |
| Política de Privacidade | `/politica-de-privacidade` | Cabeçalho da política → Conteúdo da política | `app/(public)/politica-de-privacidade/page.tsx` |
| Termos e Condições | `/termos-e-condicoes` | Cabeçalho dos termos → Conteúdo dos termos | `app/(public)/termos-e-condicoes/page.tsx` |

As rotas dinâmicas `/artistas/[slug]` e `/noticias/[slug]` são templates de entidades de domínio. Seus registros são administrados pelos módulos **Artistas** e **Conteúdos**, não devem ser convertidos artificialmente em páginas estáticas do módulo Páginas.

## Campos e consumidores reais

### Página inicial

| Seção | Campos de seção | Itens | Consumidor / observação |
| --- | --- | --- | --- |
| Hero Section | `title`, `subtitle` | CTA: `label`, `url`, ordem, ativo | `.homeHero`; não existe imagem/vídeo de Hero persistido atualmente. O fundo é CSS do site. |
| Apresentação institucional | `title`, `body` | um link `label`, `url` | `.homeIntroCard`; métricas de Instagram/YouTube vêm das integrações sociais. |
| Atalhos de serviços | — | `label`, `url`, ordem, ativo | `.homeShortcutRow` |
| Artistas em destaque | `title`, `subtitle` | — | cards vêm de `getPublishedArtists(true)`; conteúdo individual pertence ao módulo Artistas. |
| Últimos lançamentos | `title` | um link Spotify `label`, `url` | cards vêm de `getCachedSpotifyReleases()`. |
| Anuncie com a Lander | — | asset de imagem | o banner público existente foi registrado em `media_assets` e passa a ser consumido pelo CMS. |
| Últimas novidades | `eyebrow`, `title` | — | cards vêm de `getPublishedPosts(true)`; matérias pertencem ao módulo Conteúdos. |

### Sobre Nós

| Seção | Campos de seção | Itens |
| --- | --- | --- |
| Hero institucional | `eyebrow`, `title`, `subtitle` | — |
| Nossa História | `eyebrow`, `title`, `subtitle`, `body` | — |
| Missão, visão e valores | `eyebrow`, `title` | `title`, `body`, ordem, ativo |
| Gestão Artística 360° | `eyebrow`, `title`, `subtitle` | `title`, `body`, ordem, ativo |
| Empresas do Grupo Lander | `eyebrow`, `title`, `subtitle` | `label`, `subtitle`, `body`, ordem, ativo |

A antiga seção `pillars` existia no seed, mas não tinha consumidor no frontend público. Ela foi removida da composição e sua definição foi desativada. A ordem persistida de `methodology` e `companies` foi reconciliada com o renderer público.

### Artistas e Notícias

As seções `artist_filters`, `artist_list`, `news_categories` e `news_list` são seções estruturais ligadas a módulos de domínio. Elas não recebem campos editoriais inventados no módulo Páginas. O editor informa a fonte responsável e direciona para o módulo correspondente.

### Contato

O Hero consome `eyebrow`, `title` e `subtitle`. A apresentação consome `eyebrow`, `title` e `body`. E-mail e localização vêm das configurações globais do site. Os assuntos do formulário vêm dos tópicos de contato. Esses dados não devem ser duplicados em `page_sections`.

### Páginas legais

A Política de Privacidade e os Termos e Condições já eram páginas públicas reais, porém o texto estava codificado diretamente no frontend. A migração `0012_lander_site_cms_alignment.sql` cria as páginas no registro CMS e migra cabeçalhos e cláusulas para `page_sections` / `page_section_items`; os renderers públicos passam a consumir `getPageContent`.

## Divergências encontradas e correções

| ID | Divergência | Correção |
| --- | --- | --- |
| CMS-LR-01 | Preview e conteúdo do editor de páginas reproduziam Hero/editorial do Portal Lander. | Preview sintético removido. O painel agora usa `iframe` da rota pública real da Lander Records. |
| CMS-LR-02 | Home no preview administrativo era substituída por 10 seções do Portal (`Mais Lidas`, `Publicidade Lateral`, `Em Alta`, `Agenda`, `Newsletter` etc.). | Overlay de referência removido. O módulo lista somente a estrutura Lander Records persistida/contratada. |
| CMS-LR-03 | Editor exibia “Imagem de Fundo” na Hero sem consumidor correspondente no site Lander Records. | Mídia só é exibida em contratos com consumidor real. A Hero atual expõe título, subtítulo e CTAs. |
| CMS-LR-04 | Banner “Anuncie com a gente” existia no frontend como asset hardcoded, fora do CMS. | Criada seção `advertise_banner`, asset registrado em `media_assets` e renderer alterado para consumir a mídia do CMS. |
| CMS-LR-05 | `pillars` existia no banco da página Sobre Nós sem ser renderizado. | Seção removida/desativada e ordem real reconciliada. |
| CMS-LR-06 | Política de Privacidade e Termos eram páginas reais, mas ausentes do registro Páginas. | Ambas adicionadas ao CMS e textos migrados para seções/itens persistidos. |
| CMS-LR-07 | Seções ligadas a Artistas/Conteúdos podiam sugerir campos editoriais de página sem consumidor. | Contrato marca essas seções como fontes de domínio e não inventa campos. |
| CMS-LR-08 | Página canônica podia ser tratada como estrutura arbitrária. | Estruturas conhecidas são vinculadas ao contrato público; exclusão/criação arbitrária de seção não é oferecida no overview canônico. |
| CMS-LR-09 | Ordem exibida pelo CMS podia divergir da ordem codificada no renderer. | Overview usa `sectionOrder` do contrato canônico; migração alinha posições persistidas. |

## Preview e persistência

O painel usa a rota pública real como preview. Campos não salvos não são falsamente simulados em uma réplica administrativa; após persistência e revalidação, o preview mostra o mesmo renderer utilizado pelos visitantes.

Ações de escrita continuam protegidas por `requirePersistentAdmin`. O principal sintético usado no Dev Preview não recebe permissão de mutação persistente.

## Escopo global fora de Páginas

Cabeçalho, navegação, rodapé, contatos globais e redes sociais são consumidores de Configurações/Navegação e não devem ser duplicados em páginas. Métricas sociais, Spotify e demais dados sincronizados permanecem sob Integrações. Isso preserva uma única fonte de verdade por conceito.
