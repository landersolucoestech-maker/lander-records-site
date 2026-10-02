# Localhost Continuity Invariant

For any mission in a repository with a local development server, localhost availability is an operational invariant, not a convenience.

## Mandatory behavior
1. Before the first mutation, run `node .codex/runtime/preflight.mjs`.
2. Preflight must start or attach the Localhost Guardian.
3. Never intentionally stop the guardian-owned development server during ordinary work. If a restart is necessary, perform it through the guardian so downtime is minimized and recovery is observed.
4. If health is lost, treat it as an incident: diagnose, recover, and re-verify before continuing completion-sensitive work.
5. Before completion, `completion-gate.mjs` must observe a healthy guardian whenever localhost continuity is required.
6. A healthy TCP listener with a failing HTTP probe is degraded evidence; diagnose the route, but do not misreport the process as absent.
7. Never terminate a foreign process just because it occupies the configured port.

## Configuration
Use `.codex/localhost-guardian.json`. Prefer explicit command/port for unusual stacks. When omitted, the runtime detects common Node/Python development stacks.
