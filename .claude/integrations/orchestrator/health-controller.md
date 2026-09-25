# Health controller

Health is computed per provider over 16 dimensions (configuration, credentials, auth, connectivity, request, responseSchema, semanticValidation, identity, normalization, persistence, consumers, frontend, freshness, retry, rateLimit, observability) and stored in `state/integrations.yml` (contract `contracts/integration.schema.json`).

Rules:
1. HEALTHY only when every applicable dimension is PASS **with evidence from a real call** (connectivity, request, responseSchema, semanticValidation cannot be PASS from static reading).
2. Static review alone caps health at UNKNOWN.
3. Credentials absent where required → BLOCKED_EXTERNAL (if needed for the product) or UNKNOWN (if intentionally unset, e.g. saas-webhook).
4. Any open P0/P1 finding on the provider → at most DEGRADED.
5. HTTP 200 is not health: payload semantics, identity and rendered value must agree (reconciliation).
