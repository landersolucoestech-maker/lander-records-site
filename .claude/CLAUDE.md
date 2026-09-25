# Lander Records Autonomous Product Engineering OS

Single target: **lander-records-site** (this repository). Nothing here depends on, references or integrates with any other repository or product. The site's own code, schema, tests and config are the only source of truth.

## What this is

`.claude/` is the complete, self-contained engineering OS for this site (ADR-0005): kernel, runtime, contracts, agents, subagents, skills, workflows, policies, rules, gates, sensors, state, findings, evidence and knowledge all live here and run natively in Claude Code with Node (no extra dependencies beyond the repository's own `node_modules`). It has no dependency on any other directory's tooling; if something is missing, implement it here.

## Default loop

`AUDIT → IDENTIFY → TRACE → DIAGNOSE → ROOT CAUSE → PLAN → CORRECT → TEST → ADVERSARIAL REVIEW → REAUDIT → COMMIT → CONTINUE`

Finding a defect creates work; it never completes work. Continue while any finding is `READY` (`node .claude/runtime/controller.mjs next`). Stop only for: a real product decision, destructive/data-loss risk, an unavailable external system/credential, unresolvable ambiguity, an irreversible architectural change, or contradictory requirements — and record each as a finding/decision with evidence.

## Entry points

| Need | Go to |
|---|---|
| Autonomous loop, state machine | `kernel/autonomous-controller.md`, `kernel/state-machine.md` |
| What exists / who owns it | `control-plane/registry.json` (single registry; validated by `runtime/pack.mjs`) |
| Real architecture & flows | `knowledge/architecture.md`, `knowledge/flows.md`, `graphs/` (regenerate: `node .claude/runtime/graph.mjs`) |
| Open work | `node .claude/runtime/findings.mjs list --status READY` (records in `findings/`) |
| Integrations | `integrations/<provider>/` + `state/integrations.yml` |
| Contact/lead pipeline | `leads/` + `state/leads.yml` |
| Identity rules | `identity/identity-policy.md` |
| Health signals | `node .claude/runtime/sensors.mjs run` (DB sensors are read-only and need `DATABASE_URL`) |
| Gates | `node .claude/runtime/gate.mjs <gate-id>` |

## Commands (real, from package.json)

- `npm run lint` · `npm run typecheck` · `npm test` · `npm run build` · `npm run smoke`
- `npm run test:integration` — needs `DATABASE_URL` to a local `*_test` database (`npm run db:migrate` first)
- `npm run test:browser` — needs a running server (`PLAYWRIGHT_BASE_URL`); the contact spec writes data and runs only with `E2E_CONTACT_SUBMIT=1`
- `npm run os:validate` · `npm run test:claude-os` — this pack's own checks

Known baseline failures are listed with evidence in `state/known-failures.yml`; do not reclassify a failure as pre-existing without reproducing it on the base commit.

## Non-negotiable invariants

1. **NO EVIDENCE = NO CLAIM.** "fixed", "healthy", "delivered", "no regression" require evidence from `runtime/evidence.mjs` — a real test/probe that names the finding for RESOLVED, the declared verify command for a criterion. Completion re-executes those commands (ADR-0007); records are an audit trail anchored in git, not proof by themselves.
2. **ZERO ≠ NULL ≠ ERROR ≠ STALE ≠ WRONG IDENTITY.** Never `value || 0`; render unavailable (`—`) when no verified value exists.
3. **Identities never merge by text similarity.** `artists.id` ≠ Soundcharts UUID ≠ Spotify artist ID ≠ platform URLs. Only deterministic resolution in `lib/integrations/soundcharts.ts` + identifier verification may link them.
4. **Leads are never lost.** Contact submissions persist before any delivery; delivery goes through `integration_outbox` (bounded retry → `dead_letter`).
5. **Secrets stay server-side.** No `NEXT_PUBLIC_*` secret; OAuth refresh tokens encrypted (AES-256-GCM, `lib/integrations/secrets.ts`); never print credentials.
6. **No silent architectural drift.** The top-level `.claude/` layout is frozen; structural change requires an ADR in `decisions/`.
7. **Git safety.** No `reset --hard`, `clean -f*`, force-push or history rewrite; stage only the current cluster; `git diff --cached --check` before each atomic commit.
8. Code/identifiers in English; user-facing text in correct PT-BR; never leak enum values into UI.
