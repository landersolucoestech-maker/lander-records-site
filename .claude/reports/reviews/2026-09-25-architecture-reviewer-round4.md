# Review — architecture-reviewer — round 4 (51358aa..71e8a4c)

Independent read-only review dispatched by the mission controller (clone /var/tmp/arch4 at 71e8a4c). Reproduced from the reviewer's hand-back (condensed; findings and verdict verbatim in substance).

REVIEW-TICKET: 2b7ecb58628a64f0e5a3ebcf148dd32d

Commands: `npm run os:validate` exit 0; `npm run test:claude-os` exit 1 (25/26, hooks.test.mjs:44 `find . -delete` in a /var/tmp checkout).

Prior items: N5 CLOSED; N7 CLOSED; N6 PARTIAL (abort+restart path, H1); N4 mostly CLOSED; M-NEW-2 PARTIAL; layout unchanged; `.codex` mentions only in allow-listed historical files.

## HIGH
1. H1 (pre-existing N6 residual) — `lib/mission-def.mjs` `missionFindingIds`: `mission.mjs abort` + `start` + commit gives a new mission whose finding scope is empty although L5 findings were RESOLVED on the branch; completion then re-runs no proofs and no longer requires security-reviewer.

## MEDIUM
1. M1 (introduced 1c7109f) — `hooks/guard-bash.mjs` find rule resolves the start path before the /tmp exemption, so in a checkout under /tmp or /var/tmp `find . -delete` / `-exec rm` are allowed; test:claude-os depends on checkout location.
2. M2 — `lib/checks.mjs` `resolved-have-fresh-evidence` uses the editable `current.findings` list instead of `missionFindingIds`; mission.yml read by several copies.
3. M3 — no tests for `missionFindingIds`, proof re-execution, `matchesRequiredTests`, BUILD_ID freshness, ticket missionHash binding.

## LOW
1. L1 — build-freshness check applies only to criteria with inline `PLAYWRIGHT_BASE_URL=`/`OS_BASE_URL=`; product-path list omits assets/, migrations/, tsconfig.json; mtime vs committer date are writer-controlled. ADR-0007 overstates it.
2. L2 — ADR-0007 says PATH is scrubbed; childEnv does not (correctly) scrub PATH.
3. L3 — ADR-0006 says directory checkout/restore is blocked; only a trailing `/` form is.
4. L4 — stale comments in completion.mjs.

Product commits 9e24ab4 / b5506e9: no architecture defect.

VERDICT: FAIL
