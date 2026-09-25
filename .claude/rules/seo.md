# seo rules (lander-records-site)

Derived from the repository as discovered on 2026-09-25. If code proves a rule wrong, fix the rule with evidence.

- buildMetadata requires an explicit canonical; static pages use resolveCanonicalUrl(cmsOverride, route).
- Sitemap uses absolutePageUrl (trailing slash) to match served URLs.
- robots disallows /admin/ and /api/.
- Detail pages (artists, news) canonicalize to their slug route unless a valid CMS override exists.
