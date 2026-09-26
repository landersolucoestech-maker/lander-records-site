# Review — architecture-reviewer — round 5 (HEAD 6697dae)

Independent read-only review dispatched by the mission controller (clone /var/tmp/arch5 at 6697dae). Reproduced from the reviewer's hand-back (condensed; findings and verdict verbatim in substance).

REVIEW-TICKET: 3e81b668f68391a1fc72279d75d1c6ba

Ran in the clone (under /var/tmp): `os:validate` exit 0; `test:claude-os` 30/30; `typecheck` exit 0; committed history-rewrite experiment detected by pack.mjs; `scopeBase()` null → all 19 findings in scope.

Round-4 items: H1 CLOSED; M1 CLOSED (/tmp dependency gone); M2 CLOSED (residue LOW-3); M3 mostly CLOSED (residue LOW-4); L1–L4 CLOSED. Docs (ADR-0006, ADR-0007, CLAUDE.md, kernel/completion-engine.md) claim nothing beyond the code. Layout unchanged. `.codex` only in the NON_OPERATIONAL allow-list and records.

## MEDIUM
1. Row-lock protocol duplicated: `lockLanderSettings`/`lockArtistIdentity` in sync.ts, inline copies in app/admin/artist-actions.ts and app/admin/integration-actions.ts; drift in one admin action could reintroduce the F-0003-class race. Export the lock helpers and use them in both actions. Product change otherwise sound (app → lib only, no deadlock, `superseded` not leaked to UI).

## LOW
1. scopeBase trusts HEAD mission history; mission.yml history not append-only anchored (documented in ADR-0007 §3).
2. mission-def.mjs spawns one git process per mission.yml commit (pack.mjs uses cat-file --batch).
3. mission.yml still written by findings.mjs trackOnMission; read directly by controller.mjs and pack.mjs.
4. No tests for BUILD_ID freshness, failing proof re-execution at completion, or history-wide anchoring.
5. Directory check blocks `git checkout <branch>` when a directory has the same name; ignores `git -C`.

VERDICT: PASS
