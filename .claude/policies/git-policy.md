# git-policy

## Policy
Preflight before mutation; no destructive git; stage only the current cluster; `git diff --cached --check`; atomic, specific commit messages.

## Enforcement
git-guardian; preflight.mjs.
