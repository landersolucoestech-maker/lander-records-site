# Skill: Localhost Guardian

Use this skill whenever the project has a development server, preview server, API server, or UI expected to stay reachable locally.

## Contract
- Run preflight before mutating code.
- Use `node .codex/runtime/localhost-guardian.mjs daemon` to ensure supervision.
- Use `... status` for a non-mutating health check.
- Use `... ensure` to recover immediately.
- Use `... stop` only when the mission explicitly requires teardown or the user asks to stop local services.
- Do not bypass the completion gate after a localhost failure.

## Recovery sequence
1. Probe configured HTTP endpoint.
2. Fall back to TCP to distinguish route failure from process loss.
3. Restart only guardian-owned server processes.
4. Use exponential backoff capped by policy.
5. Rebind evidence after recovery.
