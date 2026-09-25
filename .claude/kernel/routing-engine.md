# Routing engine

Deterministic: `control-plane/registry.json` → `routing[finding.domain]` gives lead, subagents, auditor, reviewers, workflow, gates. `controller.mjs next` prints the route. Adversarial review is added when impact ≥ L3 or severity ≤ P1.
