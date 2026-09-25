# Review — security-reviewer — round 4 (51358aa..71e8a4c)

Independent read-only review dispatched by the mission controller (clone /var/tmp/sec4 at 71e8a4c). Reproduced from the reviewer's hand-back (condensed; findings and verdict verbatim in substance).

> Not recorded as evidence: fixes for round-4 findings had already changed the workspace, so `evidence.mjs review` refused the PASS (TICKET_STALE, by design). Its MEDIUM/LOW items were addressed in the following commits and a new security review was dispatched.

REVIEW-TICKET: ba21829ab0fabcf522a2468358ab4f91

Ran: `gate.mjs security` PASS (7/7); `npm run test:auth` 39/39; `test:claude-os` 25/26 in /var/tmp clone (hooks `find . -delete`, scratch-path exemption); ~120-command hook battery; GETs on :3100 (admin routes 307 → login, spoofed trycloudflare host still 307, cron 503 without CRON_SECRET); no secret names or postgres URLs in `.next/static`.

## Prior items
- G-1 PARTIAL (MEDIUM) — `lib/checks.mjs` preview-workflow-safety bypassed by YAML `\x5F` escapes in quoted keys, expressions containing `}` (`format('{0}', secrets.X)`), `github.token`, `secrets: inherit`, shell indirection in `run:` (`declare -x "DATABASE_UR""L=…"`, `unset`, `eval` GITHUB_ENV writes).
- G-9 PARTIAL (MEDIUM) — `lib/io.mjs` childEnv keeps HOME/PATH: a user `~/.npmrc` with `script-shell=/bin/true` makes `npm run test:unit` exit 0 with no tests (recorded PASS in the clone); a fake node/npm on PATH likewise.

## Guard hook (LOW, guardrail per ADR-0007)
- L-1 directory checkout/restore only caught with trailing `/`.
- L-2 `--config-env=alias.*`, `GIT_CONFIG_COUNT/KEY/VALUE` aliases, `git branch -f`, `worktree remove --force`.
- L-3 env dumps: bare `typeset`, `/proc/$$/environ`, `ps eww`, awk `ENVIRON`, perl `%ENV`, ruby `ENV`, `process["env"]`, `require("process").env`, `os.getenv("…SECRET")`.
- L-3b destructive SQL piped into psql (segment split).
- L-4 (INFO) scratch-path exemption when the checkout is under /tmp.

## Product 9e24ab4
No security defect: admin actions keep `requirePersistentAdmin("editor")`; cron fails closed; purges scoped; `FOR UPDATE` guard correct; outbound fetches fixed hosts with `redirect: "error"`.

## Pre-existing INFO
`dev-preview.yml` checkout persists credentials; cloudflared downloaded without checksum.

No CRITICAL/HIGH open.

VERDICT: PASS
