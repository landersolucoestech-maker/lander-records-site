# design-system rules (lander-records-site)

Derived from the repository as discovered on 2026-09-25. If code proves a rule wrong, fix the rule with evidence.

- Admin UI uses styles/admin/primitives.css (adminButton, adminPanel, adminPageHeader…) and CSS modules per area; restrained Lander red accent #ee111b.
- Contract tests guard admin visuals (tests/unit/admin-dashboard-visual-contract.test.mjs, media-kit-layout-contract).
- The admin sidebar item list is contract-locked (tests/unit/admin-navigation.test.mjs); changes need a product decision.
- Public styles: styles/public + app/*.css feature files; focus-visible outlines required.
