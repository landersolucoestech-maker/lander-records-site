# Lander Records Site + CMS

Website público e backoffice operacional da Lander Records, mantidos no mesmo projeto e na mesma fonte de dados.

## Stack

- Next.js App Router
- React + TypeScript
- PostgreSQL
- Drizzle ORM
- Supabase Storage para mídia persistente
- Sessões administrativas server-side e RBAC
- CMS estruturado para páginas, notícias, artistas, navegação e configurações
- SEO dinâmico, sitemap e dados estruturados
- Integrações externas com processamento e histórico persistentes
- Engineering OS em `.codex/` para governança, evidências, verificação e segurança operacional

## Desenvolvimento local

```bash
cp .env.example .env.local
npm install
npm run db:migrate
npm run admin:bootstrap
npm run dev
```

Não existe senha administrativa padrão armazenada no repositório.

## Validação

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run smoke
```

O CI executa migrações, testes de integração, typecheck, build e smoke do runtime antes de publicar o status de validação do commit.

## Arquitetura e operação

A aplicação pública e o `/admin` compartilham o mesmo domínio de conteúdo. Uploads de mídia utilizam o provider de storage configurado no servidor; credenciais privilegiadas não pertencem ao bundle do navegador.

Documentação operacional e arquitetural está em `docs/` e `infra/`.

## Política de origem

Este repositório é mantido como código próprio da Lander Records. Branding, badges, links, scripts, dependências, comentários ou metadados de geradores/starter platforms não fazem parte da identidade do projeto e devem ser rejeitados na revisão e no CI.
