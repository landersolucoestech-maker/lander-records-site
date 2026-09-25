# DEC-0006 — Which proxy is trusted to supply the client IP in production? (NEEDS_PRODUCT_DECISION — deployment)

- Status: OPEN — blocks finding F-0018

`lib/contact-client-ip.ts` trusts `X-Real-IP` unconditionally (then the last `X-Forwarded-For` hop). That is correct only when the nearest proxy overwrites the header, as `infra/nginx/lander-records.conf.example` does. `docs/PRODUCTION_INFRASTRUCTURE.md` marks production as not ready and allows managed platforms, so the real topology is undecided. Behind a CDN, `$remote_addr` is the edge IP (shared bucket); exposed directly or behind a pass-through platform, clients choose their own identity.

Options: (A) nginx reference topology (current behavior correct; add a deploy checklist item); (B) CDN in front (use the CDN's verified client-IP header and restrict origin access to the CDN); (C) managed platform (use its documented client-IP header). The engineering follow-up is an explicit trusted-header setting that fails closed in production, implemented once the topology is chosen.
