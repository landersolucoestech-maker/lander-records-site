# Synthetic monitor

`tests/browser/contact-form.spec.ts` is the synthetic journey. It writes a real submission, so it only runs with `E2E_CONTACT_SUBMIT=1` against a disposable database. Production synthetic checks require an operator decision (they create real leads).
