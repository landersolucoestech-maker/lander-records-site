# Git Policy — MAIN ONLY

## Absolute rule
- `main` is the only permitted branch.
- Never create, use, target, push to, or instruct work on `dev`, `develop`, `feature/*`, `topic/*`, `release/*`, automated branches, or any other branch.
- Never open a pull request as part of the project workflow.
- Every change follows: inspect → edit → validate → commit → push directly on `main`.
- If the active branch is not `main`, all write operations must stop.
- History rewriting and force push remain forbidden.
