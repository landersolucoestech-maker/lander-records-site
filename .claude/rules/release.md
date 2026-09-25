# release rules (lander-records-site)

Derived from the repository as discovered on 2026-09-25. If code proves a rule wrong, fix the rule with evidence.

- CI (.github/workflows/cms-ci.yml) runs: legacy-origin check, npm ci, migrations, npm test, test:integration, typecheck, build, runtime smoke.
- Deploy/rollback runbooks: docs/DEPLOYMENT_RUNBOOK.md, docs/ROLLBACK_RUNBOOK.md; backups infra/backup/*.sh; release scripts scripts/release/*.
- Release gate: gates/release.json.
- Production actions require explicit operator authorization.
