# External receiver adapter (receiver-agnostic)

No specific external product is part of this architecture (ADR-0003). The adapter is the generic signed webhook in `lib/contact.ts#dispatchOutboxEvent`; its receiver is unset by design. Any receiver must: verify `x-lander-signature`, dedupe on `x-lander-event-id`, return 2xx only after durable storage, return 4xx only for permanently invalid payloads. Choosing a receiver: DEC-0001.
