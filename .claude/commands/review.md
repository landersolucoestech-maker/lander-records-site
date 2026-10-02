# /review
Route through `lander-records-site-orchestrator`.

## Flow
pre-task → investigate current state → scope/blast radius → route registered agents/skills → execute bounded action → validate → evidence → completion-gate.

## Required gates
Repository identity; `dev` branch; domain/authorization boundary; relevant tests; evidence. For destructive, publishing, credential/permission, billing or irreversible external actions, require human approval before execution.

## Failure
Route failure to root-cause/recovery. Retry only when safe and idempotent. Never fabricate completion or provider success.
