# Conteúdo editável — Lander Records

Esta pasta é a fonte de conteúdo preparada para o CMS.

## Arquivos

- `artists.json`: artistas, categoria, bio e imagens do card/hero.
- `site.json`: nome da empresa, contato, endereço, horário e links das redes.

## Regra

Componentes não devem receber novos textos, URLs de redes ou caminhos de imagem hardcoded quando o dado for administrável. Novos campos devem ser adicionados primeiro nesta camada e depois consumidos pela interface.

## Próxima etapa: CMS

A persistência administrativa será feita por um backend autenticado (Supabase dedicado ao Lander Records). O painel deverá permitir criar, editar, ordenar, publicar/despublicar e remover artistas, notícias, serviços, imagens, links, embeds e copywriting sem editar código.

Nunca colocar service-role key, token pessoal do GitHub ou segredo de API em código do navegador.
