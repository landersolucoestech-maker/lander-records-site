# Correction engine

1. Reproduce: write the failing test first (unit/integration/browser) and prove it fails on the base commit.
2. Fix at the layer that owns the root cause (producer → transformation → consumer), never at the symptom.
3. Minimal correct fix: no fallback masking, no loosened test, no scaffolding.
4. Propagate to every consumer of a changed contract (graphs/dependencies.json).
5. Record the red→green evidence.
Autofix allowed when: root cause proven, expected behavior defined, risk acceptable, patch reversible, validation possible.
