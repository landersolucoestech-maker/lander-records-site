# Instagram — rules

1. ZERO ≠ NULL ≠ ERROR ≠ STALE: a missing value renders '—'; zero is only rendered when the provider returned 0 for the verified identity.
2. No provider call from React components; only server modules under lib/integrations or lib/contact.
3. Every outbound request has a timeout and refuses redirects when it carries credentials.
4. Errors are persisted for CMS visibility and never replace the last valid value of the same identity.
5. Secrets never leave the server; no NEXT_PUBLIC_* for this provider.
6. The profile URL is normalized with normalizePlatformUrl (host allowlist) before storage; it is an identity input, not an identity.
