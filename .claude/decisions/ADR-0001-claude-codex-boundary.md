# ADR-0001 — [SUPERSEDED] Boundary between `.claude/` and `.codex/`

> **SUPERSEDED — NON-OPERATIONAL.** This decision (delegating mechanics to `.codex/`) was invalidated by the operator. See `ADR-0005-self-contained-claude-os.md`. Kept only as audit trail.

- Status: SUPERSEDED by ADR-0005 (2026-09-25)
- NON-OPERATIONAL: historical record only. Nothing in this ADR may be executed, referenced by runtime, or used for routing.
- Date: 2026-09-25
- Scope: lander-records-site only

## Context

The repository already ships `.codex/`, a project-agnostic Engineering OS runtime (`engineering-os.json` declares `projectAgnostic: true`): preflight, mission/run state (in `.local/engineering-os-state/`, git-ignored), requirement/criterion records, command evidence bound to a workspace fingerprint, policy gate, completion gate, localhost guardian. CI runs `.codex/runtime/validate-pack.mjs` and `self-test.mjs`.

The mission requires a Lander-Records-specific autonomous product engineering OS under `.claude/` with a frozen top-level layout (kernel, control-plane, agents, integrations, leads, identity, findings, state, …). Two packs could easily become two sources of truth for the same concepts.

## Decision

| Concern | Authoritative location | The other layer |
|---|---|---|
| Mission run state, requirements, acceptance criteria, criterion evidence, completion gate, preflight, localhost continuity | `.codex/runtime/*` | `.claude/kernel` calls these; never reimplements them |
| Generic reviewer roles (security, adversarial, regression, …) | `.codex/agents/specialists/*` | `.claude/reviewers/*` add Lander-specific checklists and name the `.codex` role they extend |
| Product knowledge (architecture, flows, integrations, identities, lead pipeline, metrics semantics) | `.claude/knowledge`, `.claude/integrations`, `.claude/identity`, `.claude/leads` | — |
| Product findings (durable defects with evidence, lifecycle, priority) | `.claude/findings/*.json` | `.codex` findings remain per-mission, ephemeral |
| Durable product evidence (proof a finding was fixed / a flow is healthy) | `.claude/evidence/*.json` | `.codex` evidence proves a criterion inside one mission run |
| Product health state, integration/identity/lead state | `.claude/state/*.yml` | — |
| Domain routing (which lead/auditor/subagent owns a signal) | `.claude/control-plane/registry.json` | `.codex/agents/registry.json` stays the generic role registry |

## Consequences

- `.claude/runtime/*` only implements what `.codex` does not: pack validation, finding lifecycle, sensors, gates over product signals, knowledge-graph extraction, next-action controller.
- A mission uses both: `.codex/runtime/preflight.mjs` before the first mutation, `.claude/runtime/controller.mjs next` to pick work, `.codex` evidence for mission criteria, `.claude/evidence` for durable finding closure, `.codex/runtime/completion-gate.mjs` before claiming completion.
- Any future capability must be placed by this table; a capability that fits neither column requires a new ADR.
