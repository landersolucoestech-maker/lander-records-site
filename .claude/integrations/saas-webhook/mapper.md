# Signed lead webhook (receiver-agnostic) — mapper

- contact_submissions row + topic → outbox payload (see schemas/outbox-event.schema.json)

Mapping code lives only in the client module (lib/contact.ts#dispatchOutboxEvent (fetch POST, 4s abort timeout)); consumers never re-map provider payloads.
