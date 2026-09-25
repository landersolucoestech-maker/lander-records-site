# Lead contract

- Inbound: `schemas/contact-payload.schema.json` (= contracts/lead.schema.json).
- System of record: `contact_submissions` (status new|processing|exported|spam|archived).
- Outbound: `schemas/outbox-event.schema.json` envelope `{id,type:'site.contact.submitted',aggregateType:'contact_submission',aggregateId,occurredAt,data}`, headers `x-lander-event-id`, `x-lander-signature: sha256=HMAC(body)`.
- Attribution in data.attribution: source, pagePath, referrer, utm{source,medium,campaign,term,content}. The fixed mission names source_application/source_channel/source_form map to: source='lander-records-site', channel=website (implicit), form=contact (eventType).
