# ADR-0007 — Trust model: re-execution and git anchoring, not local record integrity

- Status: ACCEPTED
- Date: 2026-09-25
- Context: two independent reviews (reports/reviews/*os-pack*.md) showed that any record a local writer can create — evidence, review reports, gate history, finding histories — can be forged, and a secretless hash chain can be recomputed. Loop breaker: a third round of record validation would fail the same way.

## Decision
1. **Completion re-executes.** `lib/completion.mjs` never accepts a recorded PASS by itself. It re-runs each criterion's *declared* verify command (declared at `mission.mjs criterion --verify`), the proof command of every finding resolved in the mission, and every check of `gates/regression.json`, against the current workspace. A forged record cannot make a failing command pass.
2. **Proof commands are real checks.** Evidence that names a finding must run a test suite, OS probe or schema audit (`PROOF_COMMAND` in lib/evidence.mjs); criteria can only be closed by their declared command; evidence is bound to the active mission.
3. **Git anchors records.** Once committed, evidence is immutable and a finding's history is append-only; new history entries cannot be marked `reconstructed` (pack.mjs `gitAnchorErrors`). Rewriting them requires rewriting git history, which the guard hook blocks and a PR reviewer sees.
4. **Hash chain = tamper evidence for edits, not authenticity.** It detects accidental/edit-in-place changes and ordering breaks; it does not prove who wrote a record.
5. **Reviews are attestations bound to a ticket.** `dispatch.mjs` mints a ticket (role + workspace fingerprint). A PASS review must quote it, match the role, match the current workspace and be single-use. The latest review of every role must not be FAIL, regardless of later edits. The OS cannot prove a report was written by an independent agent: reviewer authenticity rests on the operator's session and the pull-request review.
6. **The guard hook is a guardrail, not a sandbox.** It fails closed on unreadable input and parses common shell forms; unusual constructs can still evade it. Server-side protection (branch protection, CI) remains the durable boundary.

## Consequences
Completion is slower (it runs suites) and needs the environment those commands need (e.g. `DATABASE_URL`, a running server for browser criteria). Documentation must not claim more than this ADR.
