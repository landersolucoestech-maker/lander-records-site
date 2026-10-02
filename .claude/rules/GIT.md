# Git Policy — DEV ONLY / MAIN FROZEN

## Absolute rule
- `dev` is the only permitted branch for new work until the user explicitly changes this rule.
- `main` is frozen and must not be modified without a new explicit user order.
- Never create feature, topic, develop, hotfix, release, automated, or any other working branch.
- Never open a pull request unless the user explicitly changes this rule.
- Every change follows: inspect → edit → validate → commit → push directly on `dev`.
- If the active branch is not `dev`, all write operations must stop.
- History rewriting and force push remain forbidden.

## Hosting boundary
- Hostinger is the authorized hosting/deployment target.
- Vercel is prohibited: never configure, restore, recommend, or depend on it.
- A different hosting provider requires explicit user approval before any repository or infrastructure change.
