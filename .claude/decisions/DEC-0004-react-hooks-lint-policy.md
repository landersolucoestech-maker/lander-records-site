# DEC-0004 — Adopt the React hooks "set-state-in-effect" lint rules for the admin UI? (NEEDS_PRODUCT_DECISION — engineering policy)

- Status: OPEN — blocks finding F-0013

`npm run lint` reports 12 errors (react-hooks/set-state-in-effect ×11, react-hooks/immutability ×1) in `ArtistManager.tsx`, `MediaLibrary.tsx`, `PageContentWorkbench.tsx`, `PostManager.tsx`, `AdminShell.tsx`, reproduced on base `e673bf9`. Lint is **not** a CI step (`.github/workflows/cms-ci.yml`).

The flagged code is mostly intentional client-only hydration (portal `mounted` flag, `localStorage` restore, reset-page-on-filter-change). Refactoring (e.g. `useSyncExternalStore` for storage, keyed state resets) touches five admin managers with limited browser coverage (`tests/browser/cms-preview.spec.ts`), so it risks hydration regressions for a lint-only gain.

Options: (A) refactor all sites and add lint to CI; (B) keep the patterns, scope the rule off for these files with a documented reason and add lint to CI; (C) leave as is (lint stays non-gating). The owners of the admin UI decide; the OS executes A or B autonomously once decided.
