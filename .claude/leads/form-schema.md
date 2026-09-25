# Form schema

| Field | UI | Server (zod) | Stored |
|---|---|---|---|
| name | required, 2–180 | trim min 2 max 180 | contact_submissions.name |
| email | type=email, ≤320 | trim email max 320 | lowercased |
| phone | optional ≤80 | optional max 80 | '' default |
| topicSlug | select from active contact_topics | 1–180, must exist and be active | topic_id |
| message | required 10–5000 | trim 10–5000 | message |
| consent | required checkbox | literal true | consent, consent_version '2026-08', consent_at |
| website (honeypot) | hidden, aria-hidden, tabIndex -1 | max 0 | — |
| attribution | source 'lander-records-site', pagePath, referrer, utm_* from URL | bounded strings | page_path, referrer, utm_* |
| idempotencyKey | crypto.randomUUID per completed attempt | uuid | idempotency_key (unique) |

Schema file: `schemas/contact-payload.schema.json`. Mission-listed fields not in the product (artist_name, company, label, service_interest, budget_range, preferred_contact) are **not** added: the topic select and the message cover them; adding fields is a product decision.
