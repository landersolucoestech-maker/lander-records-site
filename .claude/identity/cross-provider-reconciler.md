# Cross-provider reconciler

For each artist: links(platform→normalized URL) × Soundcharts identifiers(UUID) × stored metrics(platform).
Mismatch classes:
- link present, metric absent → acceptable (provider may lack data) unless identity resolved and platform audience endpoint returned data before.
- metric present, link absent for that platform → acceptable (Soundcharts knows the platform) — informational.
- identity resolved via platform X but link X removed → must re-resolve on next sync (enforced by resolutionStillMatches).
Procedure: skills/cross-provider-reconciliation.
