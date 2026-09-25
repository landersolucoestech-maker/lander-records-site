# DEC-0001 — Where do staff read contact submissions? (NEEDS_PRODUCT_DECISION)

- Status: OPEN — blocks finding F-0006
- Owner: product (Lander Records)

## Facts

- Submissions are persisted (`contact_submissions`) with name, e-mail, phone, topic, message, consent, attribution and `status` (`new|processing|exported|spam|archived`).
- The only external delivery is the unconfigured signed webhook (`LANDER_SAAS_WEBHOOK_URL`); with it unset every event is `disabled`.
- No admin screen lists submissions; the sidebar is contract-locked by `tests/unit/admin-navigation.test.mjs` (exact item list), so adding an entry changes an approved design.
- Submissions contain personal data (LGPD): who may read them is an authorization decision.

## Options

| Option | Change | Trade-off |
|---|---|---|
| A. Admin inbox `/admin/contacts` | new page + status transitions + audit log; nav contract updated | fits the CMS; needs role decision (proposed: `admin`+) and PII retention policy |
| B. Configure the signed webhook to a receiver chosen by the business | env only | no code; depends on a receiver the business must choose |
| C. Both | A + B | most robust |

## Required answer

Choose A/B/C, the minimum role allowed to read leads, and the retention period for `contact_submissions`.
