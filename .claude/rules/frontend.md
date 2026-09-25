# frontend rules (lander-records-site)

Derived from the repository as discovered on 2026-09-25. If code proves a rule wrong, fix the rule with evidence.

- Server components fetch through modules/* or lib/*; client components only for interaction (ContactForm, ArtistFilterGrid, admin managers).
- Never access React event properties after an await (capture event.currentTarget first).
- Fetch app routes with the trailing-slash path (/api/contact/) because next.config trailingSlash: true.
- Unavailable metrics render '—'; release cards render an explanatory empty state.
- Every public route keeps one <main id=main-content>, header/footer outside main (public-routes spec).
- Parse error bodies defensively (response.json().catch(() => null)); show readable PT-BR messages.
