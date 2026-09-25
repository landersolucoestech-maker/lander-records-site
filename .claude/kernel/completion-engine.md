# Completion engine

Implementation: `runtime/lib/completion.mjs#evaluateCompletion` — the only producer of a verdict (`completion.mjs` prints it; `mission.mjs close` refuses to close on D and never accepts a caller verdict).

Conditions: active mission with ≥1 requirement, each with criteria; every criterion closed by fresh executed PASS evidence (reviews do not close criteria); findings valid (contract + history replay); evidence hash chain intact; no READY or in-flight findings; findings worked in the mission RESOLVED with fresh PASS evidence naming them; latest fresh `adversarial-reviewer` review PASS (+ `security-reviewer` when a mission finding is L5); no unanswered fresh FAIL review; fresh `regression` gate PASS recorded in state/validation-history.yml for the current fingerprint; pack integrity; changes committed.

Verdict: D if any condition fails; otherwise C when NEEDS_PRODUCT_DECISION findings exist, B when only BLOCKED_EXTERNAL remain, A when nothing is parked.
