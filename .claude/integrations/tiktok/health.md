# TikTok — health

Dimensions (see integrations/orchestrator/health-controller.md): configuration, credentials, auth, connectivity, request, responseSchema, semanticValidation, identity, normalization, persistence, consumers, frontend, freshness, retry, rateLimit, observability.

Current state: see `state/integrations.yml` → `tiktok`. Update procedure:
1. Static dimensions (configuration contract, client, normalization, persistence, consumers, retry, rate limit, observability): verify by reading code + tests; PASS requires a test or file:line evidence.
2. Live dimensions (credentials, auth, connectivity, request, responseSchema, semanticValidation, freshness): require a real call in an environment with credentials, recorded with `evidence.mjs run`. Without it they stay UNKNOWN.
3. Aggregate per health-controller rules; never HEALTHY from static evidence.
