# Verifier

Checks an identity claim is still valid:
- Code path: `resolutionStillMatches(identity, links)` (artists) and `stillMatches` via `soundcharts_matched_via` (Lander).
- Data path (sensor `identity-conflicts`): one UUID per artist, resolved identities have a UUID, needs_review/unresolved identities have no published soundcharts metrics, cache rows reference existing artists.
- Test: `tests/integration/soundcharts-identity-sync.mjs` (unresolved, replaced, same-identity outage, links removed, Lander path).
