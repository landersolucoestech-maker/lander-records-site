# Structural refactor and Lander Admin redesign

Status: IN PROGRESS. This document is not a completion certificate.

## Baseline and authority

- Branch: `dev`; HEAD at intake: `6439eecc35ac3ef83fc31e5c6465a7953b8af883`.
- Existing dirty work includes Engineering OS remediation, authentication hardening, LazyReveal and regression coverage. Preserve it; do not absorb it into mission commits.
- Canonical configured development URL: `http://127.0.0.1:8082`.
- Host collaboration executes real agents. `.codex/agents/registry.json` remains advisory and its formal independent-review adapter is unsupported. Do not invent certification.
- No production, database migration/data write, credentials, external integration write or arbitrary deletion is authorized by this refactor.

## Agent ownership

| Host agent | Existing role profiles | Area | Output | Dependencies | Parallel-safe |
| --- | --- | --- | --- | --- | --- |
| architecture_audit | architecture-reviewer, implementation-lead/backend-engineer | modules/**, lib/content.ts | Audit; real domain repositories and compatible facade | Current query contracts | Yes |
| admin_design_audit | ui-ux-reviewer, frontend-reviewer, accessibility-reviewer, frontend-engineer | app/admin/components/**, protected layout, dashboard.css | Navigation manifest, shell, drawer, editorial styling | Session source, preserved URLs | Yes |
| security_review | security-reviewer, runtime-continuity-controller | Guardian and isolated lifecycle tests | Auth/runtime audit; fail-closed recovery | Verified process ownership | Yes |
| Main | mission-controller, planner, implementation-lead, verification-controller | Layout isolation, remaining features, tests, documentation | Integration and verification | Consolidated audits | Yes, outside writer areas |

Writer output must receive a new read-only review by a different agent. Earlier audit is not final review.

## Architecture decision

Keep `app/` as routing adapters. Do not introduce `src/` merely to rename paths. Existing route groups already separate public and protected Admin URLs. Make existing `modules/<domain>` own real contracts, queries and cases of use; keep `lib/` for transversal infrastructure. Preserve URLs and public visual appearance.

```text
app/(public), app/admin, app/api (routing/auth/response adapters)
                 -> modules/<domain>/{types,validation,repository,service,ui}
                 -> lib/{db,auth,storage,security,logging,integrations}
client UI        -> pure contracts and server-action references only
```

No repository/domain dependency on React UI; no public UI dependency on Admin UI; no client dependency on privileged infrastructure. `server.ts` is an explicit entrypoint, not a compiled security barrier by itself.

## Audit findings and disposition

| ID | Severity | Problem | Disposition |
| --- | --- | --- | --- |
| ARCH-01 | High | modules repositories reexport lib/content; settings exposes getDb | Real domain query ownership; compatibility facade |
| ARCH-02 | High | admin/actions mixes many domains and Sharp | Split by domain in a later characterized wave; preserve guards, transactions, audit and revalidation |
| STYLE-01 | High | Root mounts public effects and imports public/Admin styling | Root reset only; public effects/cascade owned by public layout; extract public rules from Admin |
| UX-01 | High | Dashboard stays active on every Admin route | Most-specific navigation selection; breadcrumb by segments |
| UX-02 | High | Synthetic owner visually appears writable | Explicit read-only source indicator; preserve persistent server mutation guards |
| A11Y-01 | High | Mobile drawer lacks focus containment/background inert | Modal behavior only at mobile breakpoint; restore focus |
| RUNTIME-01 | High | Degraded TCP-only probe can bypass recovery lock | HTTP must be healthy, not merely listening |
| RUNTIME-02 | High | stop clears evidence after refusing unverified processes | Fail closed and retain unresolved ownership evidence |
| TEST-01 | Medium | Structural tests assume lib/content query bodies | Point assertions at the actual repository; do not weaken assertions |
| STYLE-02 | Medium | Cross-feature editor/view CSS imports | Extract shared editor/view styling with concrete consumers |
| GOVERNANCE-01 | Medium | package.json differs from integrity manifest | Review exact changes, then reconcile authorized entries; never blindly refresh hashes |

## Inventory decisions

| Cluster | Decision | Reason |
| --- | --- | --- |
| app route groups/API | KEEP / REFACTOR | URL ownership; thin adapters |
| lib/content.ts | SPLIT / KEEP compatibility | Existing producers/consumers require stable exports |
| modules | REFACTOR | Actual feature ownership instead of facade-on-facade |
| lib/db/auth/storage/security/logging | KEEP | Transversal infrastructure and existing authorization contracts |
| Public polish CSS | REFACTOR / REQUIRES_INVESTIGATION | Preserve effective cascade before deduplication |
| Admin CSS | SPLIT / MERGE shared primitives | Separate auth, shell, features and public leakage |
| migrations/infra/.github/.codex | KEEP | Operational/governance contracts; no cosmetic moves |
| assets banner fragments | KEEP | Consumed by predev/prebuild materializer |
| .next/reports/tsbuildinfo/build-gate outputs | DELETE_IF_GENERATED, no deletion planned | Generated and ignored; deletion is unnecessary |
| scripts/banner-repair | REQUIRES_INVESTIGATION | Versioned; lack of direct import alone is not proof of dead code |
| Pre-existing root OS audit reports | KEEP pending provenance/reference audit | Evidence belonging to earlier work |

## Waves and acceptance

1. Intake/audit/characterization: actual tree, routes, dependencies, dirty baseline and runtime identity.
2. Query ownership and layout isolation: exact behavior preserved; focused tests, typecheck and runtime check.
3. Admin tokens/shell/navigation: keyboard, mobile focus, read-only mode, one active item and screenshots.
4. Main lists/editors and legacy Admin screens: common primitives, coherent density, fields/states and responsive behavior.
5. Domain actions/API adapters and feature UI ownership: guards before side effects, contracts and negative paths.
6. Styling/root hygiene: only evidence-backed consolidations/removals.
7. Fresh full verification, restart validation, independent final reviews, atomic commits if pre-existing work can be separated safely, completion gate.

Mandatory final checks: npm test; typecheck; lint; build; Engineering OS checks; public and actual Admin browser flows; 1440/1280/1024/768/390/360 viewports; keyboard/reduced motion; assets/API/direct refresh; supervised HTTP healthy after verified restart; git diff/check and scoped staging review. Integration writes require an approved isolated database.

## Current verification evidence

The repository extraction was checked by a read-only TypeScript AST comparison: all 13 function bodies (11 exported, two private) preserved. A 30-module dependency check found no cycle or return dependency on lib/content. These checks apply to that extraction only, not the full mission. Final fresh verification and independent reviews remain required.

No significant deletion or mission commit has been performed. Pending patches must always be reconciled against files and diff before replaying any operation.
