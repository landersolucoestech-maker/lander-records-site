# Skill: Deterministic Control Plane

Use the runtime instead of prose-only claims for mission-critical state.

Canonical entry point: `node .codex/runtime/aceo.mjs <command>`.

Required records:
- `mission`: mission lifecycle and requirements.
- `evidence`: acceptance-criterion evidence bound to workspace fingerprint.
- `review`: independent read-only review records bound to fingerprint.
- `finding`: defects and risk findings.
- `side-effect`: external or irreversible operation journal.
- `ownership`: writer leases and overlap blocking.
- `policy`: authority decision.
- `graph`: execution graph validation.
- `checkpoint`: durable mission checkpoint.
- `guardian`: localhost continuity.
- `gate`: final deterministic completion decision.

Never substitute a chat assertion for a runtime record when a record type exists.
