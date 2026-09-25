# Attribution controller

Captured client-side at submit: `window.location.pathname`, `document.referrer`, `utm_source|medium|campaign|term|content` from the current URL. Stored per submission and copied into the outbox payload. Limits: pagePath ≤1000, referrer ≤2000, utm ≤500.
Gap (not a defect): UTM is only read from the contact page URL; landing-page UTMs are lost if the visitor navigates before contacting. Changing this needs a product decision about storage/consent.
