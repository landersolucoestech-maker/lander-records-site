# Project agent instructions

This repository uses the Autonomous Codex Engineering OS in `.codex/`.

## Required lifecycle

For implementation work, follow:

`PREFLIGHT -> DISCOVER -> UNDERSTAND -> FORMALIZE -> PLAN -> EXECUTE -> VERIFY -> REVIEW -> COMPLETE`

Before the first repository mutation, run:

```powershell
node .codex/runtime/preflight.mjs
```

If a local development server is detected, keep it supervised through:

```powershell
node .codex/runtime/localhost-guardian.mjs daemon
```

Use `.codex/agents/registry.json` to select the smallest sufficient set of agents. Writers must have disjoint ownership; reviewers remain read-only and independent. Use `.codex/rules/`, `.codex/policies/`, and `.codex/workflows/` as the governing project instructions.

Repository evidence is authoritative. Do not reuse state or evidence produced for another workspace. Do not claim completion without fresh verification, required reviews, and a passing completion gate.

Stay within the user's requested scope and authority. Stop before destructive, production, credential, external-write, or materially scope-expanding actions unless explicitly authorized.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
