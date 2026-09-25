---
name: identity-resolution
description: "Resolve or re-verify an entity's Soundcharts identity. (lander-records-site)"
---

# identity-resolution

## INPUT
Artist id or lander_records

## PRECONDITIONS
- Soundcharts credentials in env

## PROCEDURE
1. Trigger sync via admin action or syncArtistSoundcharts(id, true) in a controlled environment
2. Inspect artist_external_identities row
3. Confirm matched_via matches a current link

## OUTPUT
Identity row state

## FAILURE MODES
- No credentials → BLOCKED_EXTERNAL

## EVIDENCE REQUIRED
DB query EV — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
cross-provider-reconciliation
