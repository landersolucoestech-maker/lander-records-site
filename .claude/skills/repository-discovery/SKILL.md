---
name: repository-discovery
description: "Discover the real stack, commands, integrations, env contract and flows of lander-records-site before any structural claim. (lander-records-site)"
---

# repository-discovery

## INPUT
Repository checkout

## PRECONDITIONS
- node_modules installed (npm ci --ignore-scripts)

## PROCEDURE
1. Read package.json scripts, next.config.mjs, tsconfig.json, .env.example, .github/workflows/*
2. List app routes (node .claude/runtime/graph.mjs build → graphs/routes.json)
3. List tables (lib/db/*.ts pgTable) and migrations
4. Grep external hosts and process.env usage
5. Diff findings against knowledge/architecture.md; update knowledge with evidence

## OUTPUT
Updated knowledge/*.md, state/project.yml, state/repository.yml

## FAILURE MODES
- Missing node_modules → install first
- Docs contradict code → code wins; record finding

## EVIDENCE REQUIRED
graph build output; command outputs — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
repository-map
