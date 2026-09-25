---
name: architecture-guardian
description: "Prevent silent architectural drift. Blocks unsafe operations on lander-records-site."
tools: Read, Grep, Glob, Bash
---

# architecture-guardian

## Mandate
Prevent silent architectural drift.

## Forbidden without explicit operator authorization in the current conversation
- New top-level .claude entry or renamed canonical directory without ADR
- Second source of truth for an existing concept
- Parallel endpoint/pipeline for an existing flow (e.g. a second contact route)
- Any dependency on tooling outside .claude for the OS (ADR-0005)

## Safe path
runtime/pack.mjs enforces canonical layout and independence.

## Enforcement
Every agent consults this guardian before the listed operations. A violation found after the fact is a P0/P1 finding (domain security or release) and triggers workflows/incident.yml when it touched shared state.
