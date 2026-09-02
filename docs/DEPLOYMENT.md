# Deployment / Cutover

## Runtime obrigatório

Este projeto exige execução server-side e não suporta produção como export estático.

Capacidades obrigatórias:

- runtime compatível com Next.js e Node.js 24;
- PostgreSQL acessível por `DATABASE_URL`;
- HTTPS;
- armazenamento persistente de mídia via Supabase Storage;
- secret store server-side;
- capacidade de executar a migração aprovada antes do tráfego público.

## Arquitetura de dados

O PostgreSQL é o banco transacional e a fonte de dados do CMS. O acesso é feito por Drizzle ORM e `postgres-js`.

O Supabase não é o banco da aplicação neste projeto. Ele é utilizado como provider de object storage para mídia. `SUPABASE_SERVICE_ROLE_KEY` é credencial exclusivamente server-side e nunca pode ser exposta ao bundle do navegador.

## Alvo de produção

O repositório é provider-neutral. O alvo pode ser VPS, cloud, container ou plataforma gerenciada, desde que cumpra o contrato de runtime e os controles de segurança descritos em:

- `PRODUCTION_INFRASTRUCTURE.md`;
- `ENVIRONMENT_CONTRACT.md`;
- `DEPLOYMENT_RUNBOOK.md`;
- `ROLLBACK_RUNBOOK.md`.

Nenhum workflow deste repositório publica automaticamente em produção. A ativação de um pipeline de deploy exige inventário do ambiente real, política de aprovação, rollback validado e implementação atômica revisada.

## Variáveis obrigatórias

Consulte `.env.example` e `ENVIRONMENT_CONTRACT.md`.

Antes de tráfego público:

- `DATABASE_URL`;
- `NEXT_PUBLIC_SITE_URL`;
- `CONTACT_IP_HASH_SALT`.

Antes de uploads administrativos:

- `SUPABASE_URL`;
- `SUPABASE_SERVICE_ROLE_KEY`;
- `SUPABASE_STORAGE_BUCKET=media`.

Variáveis de integrações externas permanecem opcionais até os respectivos serviços serem habilitados.

## Sequência de cutover

1. provisionar um runtime dinâmico compatível com Next.js;
2. provisionar ou conectar o PostgreSQL de produção;
3. configurar variáveis e secrets server-side;
4. concluir o gate de banco em `docs/runbooks/DB_0010_RELEASE.md` quando a release exigir migração;
5. criar o primeiro owner em operação única e autorizada, removendo as variáveis de bootstrap após o uso;
6. criar ou validar o bucket Supabase Storage `media`;
7. publicar o SHA aprovado em ambiente de preview/candidate;
8. validar rotas públicas, `/api/health` e fail-closed do `/admin`;
9. validar CRUD e publicação no CMS;
10. validar upload real de mídia;
11. validar submissão real de contato;
12. validar domínio e TLS;
13. promover a release somente após todos os gates.

## SaaS webhook

Não configure URL fictícia. Quando o endpoint SaaS existir, configure URL e segredo reais, envie uma submissão controlada, valide HMAC/idempotência e confirme a transição do evento de outbox para `delivered`.
