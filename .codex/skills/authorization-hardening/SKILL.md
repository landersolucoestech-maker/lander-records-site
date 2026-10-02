---
name: authorization-hardening
description: Harden authentication-to-authorization boundaries across application guards, database privileges, tests and release evidence.
---

# authorization-hardening

Use this skill whenever a change touches authentication, authorization, administrative roles, privileged mutations, database grants, session trust, or another path that can alter effective authority.

## Procedure

1. Identify protected assets, actors, trust boundaries and every path capable of producing the privileged side effect.
2. Locate the authoritative server-side authorization decision. Authentication alone is never sufficient.
3. Require fail-closed handling for missing sessions, expired/inactive sessions, malformed or unknown roles, and mandatory credential-change states.
4. Verify privileged mutations perform authorization before database, filesystem, network, storage or integration side effects.
5. Inspect the database boundary for implicit privileges, owner/superuser runtime assumptions, PUBLIC grants and alternate write paths. Never invent production credentials or deployment-specific LOGIN roles.
6. Preserve least privilege. Destructive or authority-expanding changes require the appropriate authority level and rollback/recovery analysis.
7. Add executable negative tests that prove unauthorized paths are denied, not merely positive tests that authorized paths succeed.
8. Ensure the relevant tests are mandatory in CI; a test that is never gated is not completion evidence.
9. Route the completed change through `security-reviewer`; add `database-reviewer` whenever database privileges, schema authorization or migrations are affected.
10. Record evidence with exact repository state and do not claim production enforcement until environment identity and runtime credentials are independently verified.

## Completion conditions

Authorization hardening is incomplete if any privileged path is unguarded, any unknown authority state fails open, database/public privileges create an alternate write path, relevant negative tests are absent from CI, independent review is missing, or production identity is assumed rather than evidenced.
