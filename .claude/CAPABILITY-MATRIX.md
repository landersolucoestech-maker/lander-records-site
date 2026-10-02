# Claude Capability Matrix

Status vocabulary: MATERIALIZED = definition exists; TESTED = covered by pack/runtime/CI; OPERATIONAL = backed by a real project boundary; CAPABILITY_AWARE = must refuse/surface unavailable when the application/provider boundary does not exist.

| Family | Materialized | Tested | Operational rule |
|---|---|---|---|
| Orchestration | yes | yes | canonical runtime/state machine/evidence/completion |
| Investigation | yes | yes | repository inspection only; evidence required |
| Engineering | yes | yes | existing application/domain boundaries |
| Quality | yes | yes | CI + preview + targeted gates |
| AI engineering | yes | yes | Claude Code only; no simulated providers |
| Content operations | yes | yes | CMS-backed; publishing requires approval |
| Artist quality | yes | yes | artists/media/link validation boundaries |
| Contact routing | yes | yes | contact/outbox boundary; unsupported assignment is unavailable |
| Integration health | yes | yes | existing sync/cron boundary; no provider-success fabrication |
| Operational recovery | yes | yes | checkpoint/evidence/retry only when safe/idempotent |

## Explicit non-capabilities
Creator marketplace/campaign operations, creator payments/escrow, campaign attribution/waves/CRM, and any external provider action without a real configured boundary are not operational capabilities of this site.
