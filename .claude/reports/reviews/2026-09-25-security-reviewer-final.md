# Review — security-reviewer — e673bf9..9f9dad1

REVIEW-TICKET: 48f0ba33377c42002487c1b7d5f90302

Read-only review in a clone pinned to 9f9dad1. Checks: verify-integrity PASS (only package.json and cms-ci.yml entries changed); gate security PASS 8/8; client-ip + outbox policy tests 10/10; hook tests 3/3; scripted guard evaluate() and hook stdin tests; clone-only edit of dev-preview.yml to test the gate.

## Findings
- G-1 MEDIUM (introduced control): gates/security.json preview-bypass checks are string-presence only; step-level `DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}`, `secrets['…']` syntax and `LANDER_MOCK_DATA: "0"` still PASS; bypass function could gain an extra `||` clause; rules/security.md overstates enforcement.
- G-2 MEDIUM (introduced): guard hook allows `git push --force-with-lease` / `--force-if-includes` to protected branches, contradicting ADR-0007 point 3; wrapper bypasses (bash -c, eval, /bin/rm, find -exec, git switch --discard-changes, quoted `.en''v`, node -e process.env, set) accepted per "guardrail not sandbox".
- G-3 LOW: hook missing/crashing exits 1 (non-blocking in Claude Code); false positives: `git restore --staged .`, `.env.*.example` variants.
- G-4 MEDIUM (residual, improved): X-Real-IP trusted unconditionally; safe in reference nginx topology; spoofable where a proxy does not overwrite it; CDN edge shares bucket; 'unknown' shared bucket. Suggest explicit trusted-proxy config failing closed in production; leads/rate-limit.md should say "must overwrite".
- G-5 LOW: dead-letter log includes error.message; malformed webhook URL message includes full URL (token in query would be logged).
- G-6 LOW: 401/403 dead-letter immediately; one-sided secret rotation dead-letters every lead with no replay command.
- G-7 LOW (pre-existing): webhook fetch lacks redirect:"error"; 307/308 re-POSTs signed PII body.
- G-8 INFO: Soundcharts redirect/timeouts correct; no token in errors.
No issues: migration 0018 additive; ContactForm renders errors as text; CI adds only OS checks.

VERDICT: PASS
