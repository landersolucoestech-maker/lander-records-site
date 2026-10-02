# Agent orchestration

The mission controller selects the smallest sufficient set of roles from `agents/registry.json`. Reviewer roles are read-only and logically independent from the writer whose output they judge. Concurrent writers require disjoint ownership or isolated worktrees. L3+ requires independent planning and review; L5 requires security plus the relevant destructive/data/production specialist.
