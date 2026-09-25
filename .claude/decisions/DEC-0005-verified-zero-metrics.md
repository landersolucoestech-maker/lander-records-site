# DEC-0005 — Show a verified zero on public artist pages? (NEEDS_PRODUCT_DECISION)

- Status: OPEN — blocks finding F-0014

`app/(public)/artistas/[slug]/page.tsx:45` renders `Object.entries(artist.metrics).filter(([, value]) => value > 0)`. A metric Soundcharts reported as 0 for the verified identity is therefore indistinguishable from "no data". The OS invariant ZERO ≠ NULL says they are different states; showing "0 ouvintes mensais" publicly is, however, a presentation choice.

Options: (A) render verified zeros ("0"); (B) keep hiding zeros but render an explicit "sem dados" only when no metric exists; (C) keep current behavior and record it as an accepted presentation rule. Data semantics are already correct in storage (0 is stored as 0).
