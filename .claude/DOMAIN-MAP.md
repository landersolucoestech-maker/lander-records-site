# LANDER RECORDS SITE — Domain Map

## Existing bounded contexts
| Domain | Repository path | Responsibility |
|---|---|---|
| Artists | modules/artists | artist records and site presentation |
| Contacts | modules/contacts | contact intake/management |
| Integrations | modules/integrations | external provider integration boundary |
| Media | modules/media | media assets and metadata |
| Pages | modules/pages | CMS pages |
| Posts | modules/posts | editorial/posts |
| Settings | modules/settings | site/system settings |
| Public web | app/(public) | public experience |
| Admin | app/admin | CMS/admin experience |
| API | app/api | server/API boundary |
| Data | lib + migrations | persistence and migrations |

## Activated operational automation domains
Content lifecycle, artist profile quality, media validation, SEO/metadata validation, contact routing, integration health, publishing readiness, operational tasks, approvals, evidence and recovery.

## Explicitly excluded from this site
Creator marketplace/campaign lifecycle, creator discovery/scoring, creator negotiation, creator deliverables, campaign contracts, creator payments/escrow, campaign smart links/presave attribution, campaign waves and creator CRM. These belong to LANDER CREATORS and must not be fabricated here.
