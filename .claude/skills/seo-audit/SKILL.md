---
name: seo-audit
description: "Audit canonicals, sitemap, robots and metadata on the built site. (lander-records-site)"
---

# seo-audit

## INPUT
Running build

## PRECONDITIONS
- server started with NEXT_PUBLIC_SITE_URL

## PROCEDURE
1. curl each public route: <link rel=canonical> must equal the served URL
2. curl /sitemap.xml: every <loc> must return 200 without redirect
3. curl /robots.txt
4. node --test tests/unit/seo-canonical.test.mjs

## OUTPUT
SEO findings

## FAILURE MODES
- —

## EVIDENCE REQUIRED
curl EV — recorded with `node .claude/runtime/evidence.mjs run` (or `review`).

## NEXT ACTION
content audit
