# Documentation index

Use this as a map, not a manual. Load only what the current task needs.

- `rules/00-execution-protocol.md`: lifecycle, planning, execution, repair, completion.
- `rules/agent-orchestration.md`: role selection, writer ownership, reviewer independence.
- `rules/evidence-governance.md`: evidence freshness and workspace binding.
- `rules/requirements-traceability.md`: requirement → criterion → evidence closure.
- `rules/security.md`: security trust boundaries and review triggers.
- `rules/testing.md`: validation strategy and test evidence.
- `rules/localhost-continuity.md`: mandatory localhost supervision, health and recovery invariant.
- `rules/git-safety.md`: dirty worktree, diff and scope safety.
- `rules/scope-control.md`: no silent scope expansion.
- `rules/database.md`, `frontend.md`, `backend.md`, `architecture.md`, `integrations.md`, `supply-chain.md`, `incident-recovery.md`: domain rules.
- `agents/registry.json`: all available role contracts and activation signals.
- `policies/*.json`: deterministic policy inputs.
- `workflows/*.json`: execution graph templates.
- `contracts/*.schema.json`: structured state/evidence contracts.

- `runtime/aceo.mjs`: canonical deterministic control-plane CLI.
- `runtime/review.mjs`: fingerprint-bound independent review ledger.
- `runtime/ownership.mjs`: writer ownership lease enforcement.
- `runtime/policy-gate.mjs`: authority gate.
- `runtime/execution-graph.mjs`: dependency/cycle/parallel-writer validation.
