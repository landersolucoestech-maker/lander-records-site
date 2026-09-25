# Completion engine

Implementation: `runtime/lib/completion.mjs#evaluateCompletion` — the only verdict producer (`completion.mjs` prints it; `mission.mjs close` refuses D and never accepts a caller verdict). Trust model: ADR-0007.

Structural conditions: active mission; requirements with criteria that declare verify commands; findings valid under replayed lifecycle; evidence chain intact; pack integrity incl. git anchoring; no READY or in-flight findings; code committed; no role whose latest review is FAIL; ticketed `adversarial-reviewer` PASS for the current workspace (+ `security-reviewer` when a mission finding is L5).

Then it **re-executes**: every criterion's declared command, the proof command of every finding RESOLVED in the mission, and every check of `gates/regression.json`, recording each run as evidence. `--no-exec` only reports structure and can never yield better than D.

Verdict: D if anything fails; otherwise C with NEEDS_PRODUCT_DECISION findings, B with only BLOCKED_EXTERNAL, A when nothing is parked.
