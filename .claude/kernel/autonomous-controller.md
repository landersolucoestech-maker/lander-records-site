# Autonomous controller

The core loop. Runs inside Claude Code; every step is a runtime command or a registered agent/skill.

```
DISCOVER → AUDIT → FIND → TRACE → ROOT CAUSE → PLAN → CORRECT → TEST → ADVERSARIAL REVIEW → REAUDIT → COMMIT → CONTINUE
```

## Each iteration
1. **State** — `node .claude/runtime/preflight.mjs` (git baseline; never discard pre-existing work) and `node .claude/runtime/controller.mjs status`.
2. **Mission** — continue `state/mission.yml` or `mission.mjs start --objective ...`; formalize requirements/non-requirements and acceptance criteria (`mission.mjs requirement|criterion`).
3. **Context** — load only: CLAUDE.md, the routed domain's rules, knowledge/architecture.md, the finding, graphs for touched files (context-controller).
4. **Audit** — choose auditors from the mission scope (routing-engine) and run sensors (`sensors.mjs run --emit-findings`).
5. **Findings** — dedupe (finding-engine), triage to READY / NEEDS_PRODUCT_DECISION / BLOCKED_EXTERNAL with evidence.
6. **Pick** — `controller.mjs next` → highest-priority READY finding not blocked by dependencies (priority-engine).
7. **Risk** — impact level L0–L5 (risk-engine) decides reviewers and gates.
8. **Route** — owner lead + subagents + reviewers + workflow from control-plane/registry.json routing.
9. **Correct** — correction-engine: root cause first, minimal correct fix, tests red→green.
10. **Validate** — validation-engine: targeted test, suites, gates (`gate.mjs <id> --record`).
11. **Review** — independent reviewer(s); record with `evidence.mjs review`.
12. **Reaudit** — rerun the auditor/sensor that found it; transition to RESOLVED with evidence.
13. **Commit** — atomic commit per cluster (git-guardian).
14. **Continue** — back to Pick while READY work exists; otherwise completion-engine.

## Stop conditions (only these)
Product decision · destructive/data-loss risk · unavailable external system or credential · ambiguity unresolvable from repo/docs/history/tests · irreversible architectural change · contradictory requirements. Each stop is recorded (finding status + DEC/evidence) and the loop continues with other READY work before ending.
