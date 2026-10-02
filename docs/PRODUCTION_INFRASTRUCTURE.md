# Production infrastructure readiness

Status: **NOT READY — deployment blocked**. Este documento descreve os requisitos mínimos do repositório; ele não autoriza deploy, DNS, acesso de produção, restart, backup ou migração.

## O que é conhecido

- A aplicação usa Next.js 16 com `output: "standalone"` e Node.js 24.
- PostgreSQL é o banco transacional do CMS.
- Supabase Storage é o provider de mídia; não substitui o PostgreSQL da aplicação.
- O repositório contém exemplos de Linux, Nginx e systemd como templates operacionais, não como dependência obrigatória.
- O ambiente real de produção, suas políticas de acesso, rede, backup, PITR, TLS, observabilidade e rollback precisam ser inventariados antes de qualquer deploy.

## Arquitetura de referência

Para um host Linux convencional:

```text
Internet :80/:443 -> reverse proxy -> 127.0.0.1:3000 -> Next.js standalone
                                                |
                                                +-> PostgreSQL
                                                +-> Supabase Storage
```

Referência segura:

- usuário de serviço dedicado, sem execução como root;
- releases imutáveis por SHA;
- ponteiro/symlink atômico para a release ativa quando o host suportar esse modelo;
- secrets em arquivo `0600` ou secret store equivalente;
- porta interna restrita a loopback/rede privada;
- TLS terminado pelo proxy ou plataforma gerenciada;
- evidências de release e rollback preservadas fora da release ativa.

Plataformas gerenciadas, containers e outros runtimes podem usar mecanismo diferente, desde que preservem as mesmas propriedades: isolamento de secrets, promoção atômica/reversível, health check, logs, rollback e controle explícito de migrations.

## Matriz de readiness

| Recurso | Obrigatório | Critério seguro |
|---|---:|---|
| Runtime de produção | Sim | Node.js 24 + suporte completo a Next.js server-side |
| Política de deploy | Sim | SHA exato, aprovação explícita e CI verde |
| Secrets | Sim | Secret store server-side, sem exposição client-side |
| PostgreSQL | Sim | TLS/rede privada, least privilege, backup e restore testados |
| Supabase Storage | Para mídia | Bucket e service role somente no servidor |
| Domínio/TLS | Sim | Origem canônica HTTPS validada antes da promoção |
| Observabilidade | Sim | Health, logs, falhas de processo, disco e certificados |
| Rollback | Sim | Release anterior identificada e restauração demonstrável |

## Baseline de inventário

Antes do primeiro deploy, registrar runtime, sistema operacional/plataforma, arquitetura, rede, portas expostas, proxy, processo da aplicação, diretórios/volumes persistentes, política de secrets, banco, backup/PITR, TLS, DNS, logs e mecanismo de rollback.

Em hosts próprios, a porta da aplicação não deve ficar pública quando houver reverse proxy. O banco remoto deve exigir TLS ou roteamento privado e restringir origem.

## GitHub e automação

A branch `dev` não deve publicar automaticamente em produção. Qualquer workflow futuro de produção precisa:

- operar sobre SHA exato já validado pelo CI;
- usar Environment protegido com reviewers quando disponível;
- não imprimir secrets;
- separar deploy de autorização de migration;
- executar health check e smoke pós-promoção;
- falhar fechado quando inventário, approval ou rollback estiverem ausentes.

## DNS e HTTPS

Nenhuma alteração de DNS é implícita por este repositório. Antes do cutover, capturar registros atuais, TTL e origem ativa, validar TLS no candidate e manter um caminho de rollback documentado.
