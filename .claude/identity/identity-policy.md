# Identity policy

1. internalArtistId ≠ Soundcharts UUID ≠ Spotify Artist ID ≠ YouTube channel ≠ Instagram ≠ TikTok ≠ SoundCloud identity. Never store one in another's field.
2. Never infer equivalence from names or text similarity. Only deterministic lookups (platform id / exact URL) + identifier verification.
3. An unverifiable match is needs_review, not resolved.
4. Metrics belong to the identity that produced them: clearing or replacing an identity withdraws its metrics atomically.
5. Same-identity provider outages keep last known values (stale ≠ wrong identity).
6. The Lander Records entity is resolved only from its official Instagram/YouTube URLs.
