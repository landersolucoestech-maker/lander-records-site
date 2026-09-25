# Review — architecture-reviewer — .claude OS pack (HEAD 42898aa)

Independent read-only review dispatched by the mission controller. Reproduced from the reviewer's hand-back (headings condensed; findings and verdict verbatim in substance).

Verified: os:validate PASS, test:claude-os 9/9, completion.mjs honest VERDICT D, all gate static patterns hold, 250 referenced paths exist, all backticked symbols in leads/identity/integrations/rules exist, spot checks (outbox constants/advisory lock, Soundcharts priority/403, TTLs, AES-256-GCM, XFF/X-Real-IP, migration guard, lockout) match code. Requirement 1 (self-contained) PASS, 2 (layout) PASS, 3 (native/executable) PARTIAL, 4 (scope) PASS, 5 (grounding) mostly PASS, 6 (NO EVIDENCE = NO CLAIM) FAIL.

## HIGH
1. completion.mjs can reach verdict A with no fresh evidence: zero-requirement mission passes criteria checks; any review ever recorded satisfies the review check; stale FAIL reviews ignored; reviewer identity not checked.
2. mission.mjs close accepts caller-asserted verdict without running completion.
3. Findings lifecycle not enforced: create accepts any status; validateFinding never replays history against TRANSITIONS; F-0001..F-0011 histories are hand-written (minute-exact timestamps); F-0012/F-0013 created at TRIAGED; F-0012 READY→REAUDITING in 0.6 s.
4. Reviewers/auditors/guardians/subagents (52 files) live outside .claude/agents and cannot be spawned by name in Claude Code; routing/workflows name them; no documented dispatch mechanism.
5. resolved-have-fresh-evidence (checks.mjs) and completion accept any PASS evidence id: no freshness, no check that the evidence names the finding.
6. Sensors dedupe against closed findings (RESOLVED/OBSOLETE/FALSE_POSITIVE), so regressions never reopen.
7. pack.mjs rejects Claude Code's own settings.json / settings.local.json; guardians have no hook enforcement.

## MEDIUM
1. Hand-written evidence only forbidden on paper (schema check only; evidence dir outside fingerprint).
2. Any command closes any criterion; criterion ids not checked against the mission.
3. Review VERDICT regex matches anywhere (quoted instructions can fake PASS).
4. nextId + rename race: parallel writers can overwrite EV/F records.
5. Any DEC dependency blocks a finding forever, even after the decision.
6. no-open-findings ignores parked P0/P1 findings in release/security/lead gates.
7. rules/security.md omits the production preview bypass (NODE_ENV=production + GITHUB_ACTIONS + DEV_PREVIEW_PUBLIC_ACCESS + *.trycloudflare.com host) in lib/auth/development-bypass.ts.
8. Artist page filters value > 0 (verified zero shown as absent) while state/metrics.yml records it as accepted; no finding.
9. Workflows not executed by anything; 13/15 contracts and all schemas/ unused by validation.
10. CI does not run os:validate / test:claude-os.

## LOW
1. ADR-0005 says preflight writes state/repository.yml and execution.yml; it writes state/.run/preflight.json.
2. Hand-maintained state files without writer/staleness; decisions.yml duplicates findings.
3. schemas/contact-payload additionalProperties:false but zod strips unknown keys.
4. ETIMEDOUT classified BLOCKED instead of FAIL.
5. Evidence environment incomplete (external Playwright config, Node 22 vs engines >=24, ignored inputs).
6. Duplicated lists (independence allow-list naming a nonexistent report; zero-fallback regex ×3; schema keywords ×2).
7. Doc/label inaccuracies (mission states PLANNED/BLOCKED unused; D label for unmet criteria; KF-004 reproducedOnBase false; KF-001 FIXED without evidence; no gate runs lint).

VERDICT: FAIL
