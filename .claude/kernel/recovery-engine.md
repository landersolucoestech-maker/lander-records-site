# Recovery engine

After interruption: `controller.mjs status` + `mission.mjs status` + `git log` since mission base commit; resume the first in-flight finding. After a failed change: classify (code/test/env), revert only your own uncommitted cluster (never pre-existing work), re-plan. Data/integration side effects need compensation, not just code rollback (see workflows/incident.yml, ADR-0004 rollback notes).
