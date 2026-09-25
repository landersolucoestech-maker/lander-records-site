# Lead validator

Server validation is authoritative (zod). Client attributes mirror limits for UX only. Invalid payload → 422 with `details` (field errors). Inactive/unknown topic → 422. Validator tests: `tests/browser/contact-form.spec.ts`, `tests/unit/contact-client-ip.test.mjs`.
