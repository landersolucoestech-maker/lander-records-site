# ADR-0005 — Claude Engineering OS is self-contained and independent from Codex

- Status: ACCEPTED
- Date: 2026-09-25
- Supersedes: ADR-0001

## Title

Claude Engineering OS is self-contained and independent from Codex.

## Decision

`.claude/` is the canonical and complete runtime for the Lander Records Autonomous Product Engineering OS. `.claude/CLAUDE.md` is its only entry point. Kernel (`kernel/`), runtime (`runtime/`), contracts, agents, subagents, skills, workflows, policies, rules, gates, sensors, state, findings, evidence, schemas and knowledge all live inside the canonical `.claude/` layout and are implemented natively for Claude Code.

Capabilities previously considered for delegation are reimplemented natively and adapted to this site:

| Capability | Native implementation |
|---|---|
| Preflight (git baseline, dirty-tree capture) | `runtime/preflight.mjs` → `state/.run/preflight.json` (volatile, git-ignored) |
| Mission / requirement / acceptance criterion state | `runtime/mission.mjs` → `state/mission.yml` |
| Command evidence bound to workspace fingerprint | `runtime/evidence.mjs run` → `evidence/EV-*.json` |
| Finding lifecycle and priority | `runtime/findings.mjs` → `findings/F-*.json`, `state/findings.yml` |
| Gates | `runtime/gate.mjs` over `gates/*.json` |
| Completion gate | `runtime/lib/completion.mjs` (the only verdict producer; used by `completion.mjs` and `mission.mjs close`) |
| Role launch | `runtime/dispatch.mjs <role>` |
| Guardian enforcement | `settings.json` PreToolUse hook → `runtime/hooks/guard-bash.mjs` (ADR-0006) |
| Pack integrity | `runtime/pack.mjs` |

## Consequences

- No dependency on `.codex/`: nothing under `.claude/` imports, spawns, reads, symlinks, wraps or falls back to it.
- No runtime delegation, no shared state, no shared governance, no compatibility requirement.
- The pack works if `.codex/` does not exist; `runtime/tests/independence.test.mjs` proves it by running the runtime with `.codex/` hidden and by scanning `.claude/` for operational references.
- `.codex/` is outside this architecture. It is not deleted or modified by the pack.
