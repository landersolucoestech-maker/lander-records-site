# Runtime deployment

Este projeto exige runtime dinâmico e não deve ser publicado como export estático.

1. Construa um artefato imutável com Node.js 24, `npm ci` e `npm run build`.
2. Em host que use `output: "standalone"`, publique `.next/standalone`, `.next/static` e `public` conforme o modelo da plataforma.
3. Injete secrets somente no runtime server-side.
4. Mantenha a aplicação atrás do mecanismo de exposição seguro da plataforma; em host próprio, prefira loopback + reverse proxy.
5. Preserve migrations atrás do gate independente em `docs/runbooks/DB_0010_RELEASE.md`; build ou deploy da aplicação nunca implica autorização de migration.
6. Execute health check e `npm run smoke` após a promoção.
7. Mantenha a release anterior identificada e reversível.

O contrato completo de variáveis está em `docs/ENVIRONMENT_CONTRACT.md`. O ambiente real deve ser inventariado antes de instalar ou adaptar qualquer exemplo de `infra/`.
