# LANDER RECORDS SITE — Claude Engineering & Automation OS

Claude/Claude Code is the canonical assisted-engineering runtime for this repository.

## Mission
Preserve and evolve the existing LANDER RECORDS institutional site/CMS safely. Never import LANDER CREATORS business workflows into this product unless the product itself later implements them.

## Real product domains
- artists
- contacts
- integrations
- media
- pages
- posts
- settings
- public site and admin CMS
- authentication/authorization
- database/migrations
- deployment/runtime

## Mandatory execution order
1. Inspect repository and relevant domain.
2. Trace dependencies, data flow, routes, persistence, permissions and integrations.
3. Define scope, acceptance criteria, risks and rollback.
4. Implement the smallest complete change.
5. Run targeted tests.
6. Run lint, typecheck, tests and build when applicable.
7. Run runtime/browser/visual checks for UI changes.
8. Review diff, security, regressions and evidence.
9. Only then declare completion.

Never skip a failed gate. Never claim validation that was not executed.

## Orchestration
Use .claude/agents/registry.json and .claude/skills/registry.json as canonical capability catalogs. Route work by capability, not by invented personas. One orchestrator owns the mission; specialists operate within bounded scopes.

## Automation safety
Operational automations must be explicit state machines. Require idempotency keys for side effects, structured input/output, authorization checks, audit events, retry policy, failure classification, recovery path and human approval for destructive, publishing, credential, permission, billing or external side effects.

## Git policy — absolute
`main` is the only permitted branch. Never create, use, target, push to, or instruct work on `dev`, `develop`, feature, topic, release, automated, or any other branch. All repository changes follow commit → validation → push on `main`. If the checked-out branch is not `main`, stop immediately. Pull requests are not part of this repository workflow.

## Repository safety
Do not rewrite history, delete data, bypass authorization, expose secrets, or perform destructive migrations without explicit approval. Preserve existing architecture unless evidence justifies a change.

## Definition of done
Code present; contracts valid; tests appropriate to blast radius pass; lint/typecheck/build pass where applicable; runtime behavior verified; security/authorization reviewed; migrations reversible or explicitly justified; documentation updated; evidence recorded.
