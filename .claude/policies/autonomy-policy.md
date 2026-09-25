# autonomy-policy

## Policy
Operate at the highest safe autonomy. No authorization is requested between normal steps (read, trace, fix, test, lint, build, stage, atomic commit). Stop only for the six stop conditions in kernel/autonomous-controller.md.

## Enforcement
controller.mjs next drives the loop; stops are recorded as findings/DECs.
