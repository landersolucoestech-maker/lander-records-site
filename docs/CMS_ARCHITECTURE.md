# Lander Records — CMS / Backoffice Architecture

## 1. Why the static architecture had to change

The original application was configured with `output: "export"` and deployed to GitHub Pages. That model can host HTML/CSS/JS but cannot safely provide server-side administrative sessions, CRUD endpoints, database transactions, file upload processing, contact persistence, audit logs or webhook delivery.

The CMS foundation therefore turns the repository into a dynamic Next.js application. The existing public visual classes are retained, while data moves out of React/JSON constants and into PostgreSQL.

## 2. Canonical content domains

### Artists

`artists` is the canonical artist record. It owns public state, profile content, ordering, featured-home state, media references and SEO. Categories are many-to-many through `artist_category_relations`. Social/platform/website links are rows in `artist_links`. Video/audio/player entries are rows in `artist_embeds`.

A public artist is visible only when `is_published=true` and `archived_at IS NULL`.

### Artist categories

`artist_categories` owns name, slug, order, active state and `show_as_filter`. The public filter is generated from these rows. Adding `Trap`, `Sertanejo`, `Gospel`, `Axé`, `Forró`, `Produtor`, `Banda` or another future category does not require a code change.

### Editorial

`posts`, `post_categories`, `tags` and `post_tags` form one editorial source for the home feed, `/noticias` and `/noticias/[slug]`. Posts support draft, published and archived states, a future `scheduled_at`, featured-home ordering, author, cover, SEO and canonical URL.

### Home and institutional pages

`pages`, `page_sections` and `page_section_items` control route metadata and structured page content. This is intentionally not a free-form visual page builder. Each public route supports known section types; admins can edit content, enable/disable sections and reorder repeatable items without being able to accidentally invent invalid layout structures.

Current page keys:

- `home`
- `about`
- `artists`
- `news`
- `contact`

### Releases

`releases` controls the home release feed. External provider ingestion can update this table later, but the public UI no longer depends on a generated JSON file or placeholder array.

### Navigation and settings

`navigation_items` controls primary/footer labels, URLs, order, visibility, external/internal behavior, target and parent relationships.

`site_settings`, `social_links` and `contact_topics` control brand/contact/SEO defaults, network URLs and contact reasons.

### Media

Binary data is never stored in PostgreSQL. `media_assets` contains URL, storage key, MIME type, size, dimensions, alt text, lifecycle state and author metadata. Upload processing:

1. authenticate editor;
2. validate image MIME and maximum source size;
3. apply EXIF rotation;
4. resize to a 2400px maximum bounding box without enlargement;
5. convert to WebP at controlled quality;
6. upload the optimized bytes to object storage;
7. persist metadata in `media_assets`.

Archiving is the default destructive operation. Physical purge is intentionally separate so referenced media is not silently destroyed.

### Admin identities and audit

`admin_users`, `admin_sessions` and `audit_logs` provide server-side administration.

Roles:

- `owner`: users/roles, security and every lower privilege;
- `admin`: destructive/archive/configuration operations;
- `editor`: day-to-day content CRUD and publishing;
- `viewer`: read-only panel access.

Passwords use bcrypt cost 12. Sessions use 256-bit opaque random tokens; only SHA-256 token hashes are stored in the database. The browser cookie is HttpOnly, SameSite=Lax and Secure in production. Login is locked for 15 minutes after five invalid attempts. New/reset accounts must change the temporary password.

There is no default credential in source control. `npm run admin:bootstrap` creates or resets an owner only from environment variables and invalidates existing sessions.

## 3. Contact and SaaS integration

### Public payload

`POST /api/contact` accepts:

- `idempotencyKey`
- `name`
- `email`
- `phone`
- `topicSlug`
- `message`
- required consent
- honeypot field
- stable source (`lander-records-site`)
- `pagePath`
- `referrer`
- UTM source / medium / campaign / term / content

The server adds user agent and a salted hash of the request IP.

### Validation and anti-abuse

- Zod server validation;
- HTML native constraints for immediate UX;
- honeypot;
- five accepted attempts per 10-minute IP-hash window;
- mandatory consent/version/timestamp;
- UUID idempotency key with a database unique constraint;
- no raw IP stored.

The endpoint refuses to pretend it is production-ready when the IP-hash secret or database is missing.

### Durable integration flow

The database transaction creates both:

1. `contact_submissions`;
2. `integration_outbox` with event `site.contact.submitted`.

Only after that transaction commits does the application attempt the SaaS webhook. A webhook outage cannot lose the lead. Failed events retain attempts, error and next-attempt timestamp. Admins can retry them manually.

When the SaaS endpoint is not configured, the outbox event is marked `disabled`; the lead remains safely persisted and the integration is visibly pending configuration.

Webhook contract:

- `Content-Type: application/json`
- `X-Lander-Event-Id: <outbox UUID>`
- `X-Lander-Signature: sha256=<HMAC-SHA256 body>`

The receiving SaaS should use `X-Lander-Event-Id` as its idempotency key.

## 4. SEO

Public routes build metadata from administrable fields:

- title
- description
- canonical
- Open Graph
- social image

Artist and article routes include structured JSON-LD (`MusicGroup`, `NewsArticle`). `sitemap.xml` is generated from currently published artists and posts. `/admin` and `/api` are disallowed by `robots.txt`.

## 5. Existing-content migration

Migration `0001_cms_foundation.sql` creates the model and imports:

- Lander Records contact/settings;
- current primary and footer navigation;
- DJ Stay;
- current artist filter categories;
- current three editorial posts;
- current home/about/artists/news/contact page sections;
- current contact subjects;
- the existing DJ Stay WebP as a registered static media asset.

The former duplicated React/JSON data files are removed from the new content path.

## 6. Test gate

`CMS Foundation CI` starts a clean PostgreSQL 16 service and runs:

1. migration;
2. integration checks for migrated artist, dynamic category, artist publication, post draft/publication, contact persistence, outbox and idempotency;
3. TypeScript;
4. production build.

Production media upload and external SaaS webhook are environment-backed integration boundaries and cannot be truthfully exercised until those external services are provisioned.
