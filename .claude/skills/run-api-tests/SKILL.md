---
name: run-api-tests
description: Claude Code skill for run api tests in LANDER RECORDS SITE.
---
# run-api-tests
## Purpose
Execute run api tests deterministically for LANDER RECORDS SITE using Claude Code.
## Trigger
Use only when selected by the task/capability routing or explicitly required.
## Inputs
Current repository/entity state, relevant domain contract, actor/permission context when applicable, acceptance criteria and exact target.
## Procedure
1. Read CLAUDE.md and applicable .claude rules.
2. Verify dev branch and keep main untouched for code changes.
3. Inspect current state; never infer destructive targets.
4. Validate authorization, data/domain invariants and external capability.
5. Execute the smallest complete action through existing project boundaries.
6. Run applicable targeted tests/gates and verify resulting state.
7. Record evidence, audit context and blockers.
## Approval
Before destructive, publishing, credential/permission, billing or irreversible external side effects, route through human approval.
## Failure / recovery
Preserve safe state, classify failure, record evidence, retry only when safe/idempotent, otherwise route to recovery. Missing providers are CAPABILITY_UNAVAILABLE, never simulated.
## Forbidden
No Codex runtime dependency, fabricated PASS/provider success, secrets, force push, auth bypass or LANDER CREATORS workflow invention.
## Completion
Expected state verified with evidence and no introduced residue.
