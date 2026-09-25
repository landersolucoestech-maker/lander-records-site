# Planning engine

For a READY finding produce a plan (contracts/task.schema.json): files to change (from graphs/dependencies.json reverse edges), the root-cause layer, tests that must go red→green, validations, rollback. Plans that cross owned paths hand off to the owning lead. Plans touching L5 surfaces add security-reviewer and the relevant guardian.
