# Evidence manager

`runtime/evidence.mjs` creates all evidence (ADR-0007):
- `run` executes a command without a shell and records exit code, argv, output hash/excerpt, commit, content fingerprint, active mission and environment (Node vs engines). Criteria close only with their declared verify command; evidence naming a finding must be a real proof command (tests, OS probes, schema audit). A command that changes the workspace is rejected; timeouts are FAIL.
- `review` records an independent review whose last line is `VERDICT: PASS|FAIL`; PASS requires the single-use `REVIEW-TICKET` minted by `dispatch.mjs` for that role and workspace.
Records are created under a directory lock, hash-chained (edit detection), and immutable once committed (git anchor). None of this proves authorship; completion re-executes the proofs instead of trusting records.
