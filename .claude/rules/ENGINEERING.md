# Engineering Rules

- Inspect before edit; no architecture assumptions.
- Preserve domain boundaries and existing conventions.
- Scope changes to the requested mission.
- No silent destructive changes.
- Schema changes require migration safety and data-integrity review.
- Auth changes require authentication + authorization tests.
- Integration changes require timeout, retry, rate-limit, credential and failure-mode review.
- UI changes require responsive, accessibility and browser/runtime verification.
- New dependencies require necessity, supply-chain and maintenance review.
- Secrets never enter source, logs, prompts or evidence.
- All completion claims require executable evidence.
- Failures block completion until fixed or explicitly accepted by the human owner.
