# ADR-0002 — `.yml` state and workflow files are JSON-compatible YAML

- Status: ACCEPTED
- Date: 2026-09-25

## Context

The mission mandates `.yml` names for state (`state/*.yml`) and workflows (`workflows/*.yml`). The repository has no YAML parser dependency, and adding one only for the pack would widen the supply chain (`.claude/policies/dependency-policy.md`).

## Decision

Every `.yml` file in `.claude/` is written as JSON (valid YAML 1.2) preceded by `#` comment lines. `.claude/runtime/lib/io.mjs#readYml` strips leading comment lines and parses JSON; `runtime/pack.mjs` fails if any `.yml` is not parseable this way.

## Consequences

- Zero new dependencies; files remain valid YAML for any YAML tool.
- Humans must keep the JSON form (no block YAML). The validator enforces it.
