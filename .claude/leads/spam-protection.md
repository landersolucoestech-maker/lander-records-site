# Spam protection

- Honeypot `website` (must be empty; zod max 0 → 422).
- Rate limit 5 submissions per trusted client IP hash per 10 minutes (counts persisted submissions).
- Consent literal true.
- No CAPTCHA. Adding one is a product decision (third-party + privacy impact).
