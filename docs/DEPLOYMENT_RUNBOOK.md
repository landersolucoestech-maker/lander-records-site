# Production deployment runbook

Este é um runbook de preparação. Qualquer operação que altere produção permanece bloqueada até existir uma mudança separadamente aprovada.

## Stop conditions

Interrompa se o inventário do ambiente estiver incompleto; a política de aprovação estiver ausente; secrets obrigatórios faltarem; o SHA não estiver aprovado; CI não estiver verde; evidência de PITR estiver ausente ou vencida; backup/restore rehearsal falhar; auditoria de schema divergir; TLS/domínio não estiverem resolvidos; ou rollback não puder ser demonstrado.

## Provisionamento de referência

Em host Linux convencional, use usuário dedicado de serviço, releases imutáveis, secret file protegido, porta de aplicação em loopback e reverse proxy já selecionado. Nunca execute a aplicação como root nem use permissões amplas como `777`.

Em runtime gerenciado ou containerizado, adapte o mecanismo preservando as mesmas propriedades de segurança e reversibilidade.

## Sequência atômica da aplicação

1. Aprovar um SHA completo já validado pelo CI.
2. Construir artefato reproduzível com Node.js 24, `npm ci` e `npm run build`.
3. Registrar checksum, SHA, horário e identidade do candidate.
4. Publicar o candidate sem trocar imediatamente o tráfego ativo.
5. Executar health check do candidate.
6. Concluir o gate independente de banco somente quando a release exigir migration.
7. Promover o candidate por mecanismo atômico/reversível da plataforma.
8. Aguardar health check e executar `npm run smoke` contra a origem HTTPS pública.
9. Se a aplicação falhar, restaurar a release anterior sem executar down migration destrutiva.

Nunca use `git pull` como mecanismo de produção nem altere artefatos da release ativa in-place.

## Database gate

Siga `docs/runbooks/DB_0010_RELEASE.md`: evidência atual de PITR vinculada ao alvo, precheck, backup verificável, restore rehearsal em banco separado, auditoria, rehearsal de migration, autorização explícita de escrita em produção, aplicação e post-audit. Nunca sobrescreva produção durante restore rehearsal.

## Post-promotion checks

- `/`, `/artistas/`, `/noticias/`, `/contato/` e `/api/health/` respondem corretamente;
- `/admin/` para visitante falha fechado com redirect/autorização apropriada;
- nenhum secret, SQL sensível ou token aparece em resposta/logs;
- logs não apresentam novos erros fatais;
- registrar SHA promovido, release anterior, checksum, migrations/evidências e aprovação.

## Observabilidade

Monitorar health endpoint, erros do processo, restart loops, pressão de recursos, expiração de certificados, falhas de backup e restore rehearsal. Logs devem redigir authorization headers, cookies, URLs com credenciais e tokens de integração.
