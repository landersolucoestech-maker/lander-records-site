# Mission engine

Implementation: `runtime/mission.mjs` (state/mission.yml, contract contracts/mission.schema.json) + `runtime/preflight.mjs`.
1. Preflight captures branch, HEAD, upstream, staged/unstaged/untracked, fingerprint.
2. Start mission with objective, base commit and branch.
3. Requirements (and explicit non-requirements) → acceptance criteria C-NNN.
4. Each criterion closes only with fresh PASS evidence (`evidence.mjs run --criterion C-NNN -- <cmd>`).
5. Close with verdict A/B/C/D from completion.mjs.
