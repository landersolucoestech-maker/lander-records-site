# Lifecycle Hooks

pre-task: repository identity, scope lock, relevant docs, branch/state, dependencies.
pre-edit: blast radius, ownership/domain boundary, protected files.
pre-migration: schema diff, destructive-change check, backup/rollback plan.
pre-external-action: authorization, approval, idempotency, external-action check.
post-edit: diff review, naming/duplication/dead-code checks.
post-test: collect results and classify failures.
pre-completion: lint, typecheck, targeted/full tests, build, runtime/visual/security checks as applicable.
completion-gate: acceptance criteria + evidence + rollback/recovery readiness.
