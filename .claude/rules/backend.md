# backend rules (lander-records-site)

Derived from the repository as discovered on 2026-09-25. If code proves a rule wrong, fix the rule with evidence.

- Route handlers: zod safeParse first → 422 with details; PT-BR error messages; configuration errors 503; generic 500 without internals.
- Side effects that must be atomic go in one db.transaction.
- Server actions call requireAdmin(minRole) before any read of protected data and write audit_logs for privileged changes.
- Pure decision logic lives in small modules testable without DB (lib/contact-outbox-policy.ts, lib/contact-client-ip.ts, lib/auth/policy.ts).
