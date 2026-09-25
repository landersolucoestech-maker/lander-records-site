# DEC-0003 — Official favicon / app icon asset (NEEDS_PRODUCT_DECISION)

- Status: OPEN — blocks finding F-0011

Every public page requests `/favicon.ico`, which returns 404 (no `app/icon.*`, `app/favicon.ico` or `public/favicon.ico` exists). `tests/browser/public-routes.spec.ts` therefore fails on every route with "Failed to load resource: 404". The only brand assets are `public/lander-records-brand.svg` (wordmark) and `public/lander-records-logo.webp`; neither is a square icon. Choosing/deriving the official icon is a brand decision. Once an approved square asset exists, add it as `app/icon.png` (or `app/favicon.ico`) and re-run the public-routes spec.
