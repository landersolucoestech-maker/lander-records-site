# regression-policy

## Policy
A change is not done until previously passing suites still pass; new failures re-enter FIXING. Pre-existing failures must be reproduced on the base commit before being classified.

## Enforcement
state/known-failures.yml with evidence; regression gate.
