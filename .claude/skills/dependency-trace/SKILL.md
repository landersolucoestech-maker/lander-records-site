---
name: dependency-trace
description: Claude Code skill for dependency trace in LANDER RECORDS SITE.
---
# dependency-trace
## Purpose
Execute dependency trace deterministically using Claude Code.
## Trigger
Use when routed or explicitly required.
## Inputs
Current state, domain contract, permissions where applicable, acceptance criteria and exact target.
## Procedure
1. Read CLAUDE.md and applicable rules.
2. Verify dev and preserve main.
3. Inspect current state and dependencies.
4. Validate authorization, invariants and provider capability.
5. Execute the smallest complete action through existing boundaries.
6. Run applicable validation and verify result.
7. Record evidence and blockers.
## Approval
Human approval before destructive, publishing, credential/permission, billing or irreversible external actions.
## Failure / recovery
Preserve safe state; classify and evidence failure; retry only when safe/idempotent; otherwise recover. Missing providers are CAPABILITY_UNAVAILABLE.
## Forbidden
No Codex runtime dependency, fabricated PASS/provider success, secrets, force push, auth bypass or LANDER CREATORS workflows.
## Completion
Expected state verified with evidence and no introduced residue.
