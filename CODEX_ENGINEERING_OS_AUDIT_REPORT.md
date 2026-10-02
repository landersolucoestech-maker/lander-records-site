# CODEX_ENGINEERING_OS_AUDIT_REPORT

Audit snapshot: 2026-09-01 (America/Sao_Paulo)

## A. Repository identity

| Field | Evidence |
|---|---|
| Repository | `https://github.com/landersolucoestech-maker/lander-records-site.git` |
| Root | `C:/Users/deyvi/OneDrive/Documents/lander-records-site-portal` |
| Branch | `dev` |
| Audited HEAD | `bcf6e7d46121fb2282b38cbf44073ee0857593b0` |
| Initial worktree | Clean |
| Runtime | Windows, Node `24.15.0`, Git available |

The identity was obtained from Git, not inferred from documentation. The live control-plane state is ignored by Git and therefore is not tied to this HEAD.

## B. Engineering OS inventory

The deterministic inventory is in `CODEX_ENGINEERING_OS_INVENTORY.json`. It contains path, type, role, byte count, line count, SHA-256, outbound references, inbound references, authority/generated flags, and orphan status for every eligible file.

Eligibility was: `AGENTS.md`; all `.codex/**` files, including live state; explicit package/lint/Git/CI controls; and repository files that reference the Engineering OS. Generated audit artifacts, `.git`, dependencies, build output, coverage, test output and `.local` were excluded.

| Metric | Result |
|---|---:|
| Eligible files | 160 |
| Bytes | 175,852 |
| Orphans by literal reference graph | 70 |
| Inventory hash | `cda2ba302b5e9a867f9eceeefaac80220ca67972cd61e0bfaa25e6f8bec0dc42` |
| Agent definitions | 48 files: registry + 47 role documents |
| Skills | 23 |
| Contracts | 11 |
| Policies | 8 |
| Rules | 18 |
| Internal workflows | 6 |
| Runtime files after audit inventory tool | 24 |
| State files | 7 |
| CI workflows | 2 |

Important: “orphan” is a syntactic reference result, not a semantic conclusion. Agent documents are referenced by the registry and therefore are not syntactic orphans, but their content is never loaded or executed by the runtime.

## C. Architecture map

```text
AGENTS.md (model instructions only)
  -> names registry/rules/policies/workflows
  -> requests preflight + guardian

aceo.mjs (CLI dispatcher)
  -> independent .mjs commands
     -> core.mjs
        -> ignored JSON state in .codex/state
     -> agents/registry.json (name/mode lookup only)
     -> localhost-guardian.json

validate-pack.mjs
  -> existence/count/JSON-parse/JS-syntax checks
  -> engineering-os.json.version only

completion-gate.mjs
  -> run-state.json
  -> preflight.json (existence/failure only; freshness not checked)
  -> agents/registry.json (reviewer name/mode only)
  -> guardian status

Disconnected from runtime authority:
  agents/*.md contents
  21/23 skills and all skill procedures
  10/11 contracts (the eleventh is existence-checked only)
  7/8 policies (localhost policy existence-checked only)
  17/18 rules (localhost rule existence-checked only)
  all 6 internal workflows
  both GitHub Actions workflows
  integrity verifier in installed mode
```

There is no mission scheduler, agent launcher, model-to-role binding, retry coordinator, timeout manager, dependency executor, merge coordinator, or workflow interpreter. The implemented system is a collection of local CLI ledgers and gates, plus a comparatively substantive localhost guardian.

## D. Agent matrix

No role document declares tools, input contract, output schema, skill dependencies, workflow activation, state schema, structured exit criteria, or authenticated execution identity. Forty-one standard read roles are 17-line templates; five writer roles are 14-line templates; the continuity controller is an 18-line exception. The runtime validates file existence and accepts the registry name as a claimed producer, but never loads the role document or launches the role.

Legend: `registered` means registry presence; `wired=no` means no callable agent/orchestrator; `claim-only` means a caller can submit the role name without identity proof.

| Agent | Mode | Status | Wired? | Useful? | Principal risk/evidence |
|---|---|---|---|---|---|
| mission-controller | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No scheduler or selection implementation |
| repo-intelligence | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No discovery invocation binding |
| autonomous-planner | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No graph producer binding |
| implementation-lead | write | GENERIC_WRAPPER, DANGEROUS | No | Claim-only | Writer has no ownership/tool/exit contract |
| verification-controller | read | GENERIC_WRAPPER, UNWIRED | No | Claim-only | Can be named as evidence producer |
| risk-controller | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | Impact runtime does not launch it |
| evidence-controller | read | GENERIC_WRAPPER, DANGEROUS | No | Claim-only | Runtime accepts unverified producer name |
| completion-controller | read | GENERIC_WRAPPER, DANGEROUS | No | Claim-only | No final-authority binding |
| runtime-continuity-controller | read | UNDER_SPECIFIED | Partial | Limited | Guardian is real; role is not launched |
| repo-investigator | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No invocation |
| requirements-reviewer | read | GENERIC_WRAPPER, DANGEROUS | No | Claim-only | Satisfies L3 review by name |
| architecture-reviewer | read | GENERIC_WRAPPER, DANGEROUS | No | Claim-only | Satisfies L4/L5 review by name |
| security-reviewer | read | GENERIC_WRAPPER, DANGEROUS | No | Claim-only | Satisfies L5 review by name |
| adversarial-reviewer | read | GENERIC_WRAPPER, DANGEROUS | No | Claim-only | Satisfies L5 review by name |
| git-auditor | read | GENERIC_WRAPPER, DANGEROUS | No | Claim-only | Satisfies L5 review by name |
| test-strategy-engineer | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No test-plan contract |
| qa-engineer | read | GENERIC_WRAPPER, DANGEROUS | No | Claim-only | Can record fabricated PASS |
| regression-reviewer | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No regression manifest |
| frontend-engineer | write | GENERIC_WRAPPER, DANGEROUS | No | Claim-only | No enforced ownership |
| frontend-reviewer | read | GENERIC_WRAPPER, UNWIRED | No | Claim-only | No independent identity |
| accessibility-reviewer | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No executable accessibility procedure |
| ui-ux-reviewer | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No visual evidence contract |
| backend-engineer | write | GENERIC_WRAPPER, DANGEROUS | No | Claim-only | No enforced ownership |
| backend-reviewer | read | GENERIC_WRAPPER, UNWIRED | No | Claim-only | No independent identity |
| api-contract-reviewer | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No schema/test binding |
| database-engineer | write | GENERIC_WRAPPER, DANGEROUS | No | Claim-only | No database authority binding |
| database-reviewer | read | GENERIC_WRAPPER, UNWIRED | No | Claim-only | No independent identity |
| distributed-systems-reviewer | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No concurrency procedure |
| integration-reviewer | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No integration test binding |
| dependency-reviewer | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No dependency diff input |
| supply-chain-reviewer | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No provenance procedure |
| performance-reviewer | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No benchmark contract |
| reliability-observability-reviewer | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No telemetry input |
| ai-llm-systems-reviewer | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No model/eval procedure |
| data-engineering-reviewer | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No data validation procedure |
| cloud-infrastructure-reviewer | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No provider/tool binding |
| devops-ci-reviewer | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | CI never invokes OS |
| compliance-privacy-reviewer | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No jurisdiction/control mapping |
| cost-efficiency-reviewer | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No cost input/procedure |
| mobile-reviewer | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No device test procedure |
| payments-reviewer | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No payment boundary procedure |
| incident-investigator | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | Incident workflow is not executable |
| root-cause-investigator | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No causal-analysis contract |
| recovery-engineer | write | GENERIC_WRAPPER, DANGEROUS | No | Claim-only | Live stale `.git` lease proves lifecycle gap |
| production-validator | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No production observation binding |
| documentation-reviewer | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No doc inventory/coverage input |
| technology-selection-reviewer | read | GENERIC_WRAPPER, UNWIRED | No | Instructions only | No decision-record contract |

Result: 47 registered labels, zero independently callable agents proven. The guardian is executable runtime, not an agent implementation.

## E. Skill matrix

Twenty-one skills are ten-line persona/instruction wrappers. They do not specify concrete inputs, ordered steps, evidence records, edge cases, failure modes, output schemas, exit criteria, or forbidden shortcuts. The runtime never loads any skill. `validate-pack` counts filenames and existence.

| Skill | Classification | Wired? | Evidence |
|---|---|---|---|
| adversarial | PERSONA_ONLY, UNWIRED | No | Generic “attempt falsification”; no attack procedure |
| api-design | PERSONA_ONLY, UNWIRED | No | No compatibility/idempotency steps |
| checkpoint | PERSONA_ONLY, UNWIRED | No | Runtime checkpoint exists but skill gives no recovery procedure |
| continuous-improvement | PERSONA_ONLY, UNWIRED | No | No evidence threshold/change process |
| control-plane | PARTIALLY_PROCEDURAL | No | Lists CLI records; no runtime skill loader |
| discover | PERSONA_ONLY, UNWIRED | No | No inputs/eligibility/coverage procedure |
| execute | PERSONA_ONLY, UNWIRED | No | No ownership acquisition/rollback steps |
| gate | PERSONA_ONLY, UNWIRED | No | No gate invocation/output semantics |
| impact | PERSONA_ONLY, UNWIRED | No | No deterministic classification procedure |
| incident | PERSONA_ONLY, UNWIRED | No | No containment/evidence sequence |
| intake | PERSONA_ONLY, UNWIRED | No | No structured output |
| localhost-guardian | PROCEDURAL, UNWIRED_AS_SKILL | No | Useful commands/contract; runtime itself is wired separately |
| plan | PERSONA_ONLY, UNWIRED | No | No graph schema or validation steps |
| pr-writer | PERSONA_ONLY, UNWIRED | No | No diff/evidence extraction procedure |
| recall | PERSONA_ONLY, UNWIRED | No | No durable store/query freshness process |
| recover | PERSONA_ONLY, UNWIRED | No | No retry ceiling or new-hypothesis format |
| refactor-guide | PERSONA_ONLY, UNWIRED | No | No characterization/rollback procedure |
| release | PERSONA_ONLY, UNWIRED | No | No release evidence sequence |
| remember | PERSONA_ONLY, UNWIRED | No | No provenance schema/store |
| review | PERSONA_ONLY, UNWIRED | No | No independent identity/evidence procedure |
| test-generator | PERSONA_ONLY, UNWIRED | No | No acceptance-to-test mapping procedure |
| threat-model | PERSONA_ONLY, UNWIRED | No | No asset/boundary/abuse-case output schema |
| verify | PERSONA_ONLY, UNWIRED | No | No command discovery/execution/evidence requirements |

## F. Contract matrix

All contracts are JSON Schema documents, but no JSON Schema validator is installed or called. `validate-pack` only parses JSON and requires the review schema file to exist. Runtime state and records are hand-built and accepted without schema validation.

| Contract | Producer/consumer claimed | Actual enforcement | Classification |
|---|---|---|---|
| acceptance-criterion | mission/runtime | None | DOCUMENTED_ONLY |
| evidence-record | evidence/completion | Hand checks omit required command/exit consistency | BROKEN, NOT_ENFORCED |
| execution-graph | graph runtime | Partial custom checks; schema unused | IMPLEMENTED_PARTIAL |
| finding-record | finding/completion | Weak 3-state custom model | BROKEN, NOT_SCHEMA_VALIDATED |
| impact-assessment | impact/completion | Custom heuristic only | IMPLEMENTED_PARTIAL |
| localhost-guardian-state | guardian | Schema unused | DOCUMENTED_ONLY |
| project-profile | discover | Schema unused | DOCUMENTED_ONLY |
| requirement-record | mission | Schema unused | DOCUMENTED_ONLY |
| review-record | review/completion | Name/mode check only | BROKEN_IDENTITY |
| run-state | all ledger commands | Schema unused; version 999 accepted | CRITICAL, NOT_ENFORCED |
| side-effect-record | side-effect/completion | Partial custom state enum | IMPLEMENTED_PARTIAL |

Missing fields, wrong types and corrupt JSON are not consistently rejected. Corrupt run-state is silently replaced in memory by a default IDLE state through `core.mjs:4,16`. Unsupported schema version 999 and an unknown authority field produced completion PASS in the fixture.

## G. Policy/rule matrix

`policy-gate.mjs` hardcodes six numeric levels and four action strings. It does not read any policy JSON. Rules are consumed only if a model voluntarily follows `AGENTS.md:23`.

| Policy | Runtime status | Evidence |
|---|---|---|
| authority | IMPLEMENTED_NOT_FROM_POLICY | Hardcoded duplicate authority logic |
| destructive-operations | DOCUMENTED_ONLY | No command interceptor |
| evidence | DOCUMENTED_AND_CONTRADICTED | Runtime accepts PASS with exit 1 and static stale PASS |
| localhost-continuity | PARTIALLY_ENFORCED | Guardian + completion health check; policy content not loaded |
| production | DOCUMENTED_ONLY | Side-effect CLI not coupled to policy gate |
| scope | DOCUMENTED_ONLY | No scope manifest/enforcement |
| supply-chain | DOCUMENTED_ONLY | No dependency gate |
| trust-boundaries | DOCUMENTED_ONLY | Model/CLI claims can grant role and authority |

| Rules | Runtime status |
|---|---|
| `00-execution-protocol`, `agent-orchestration`, `architecture`, `backend`, `continuous-improvement`, `control-plane`, `database`, `evidence-governance`, `frontend`, `git-safety`, `incident-recovery`, `integrations`, `requirements-traceability`, `scope-control`, `security`, `supply-chain`, `testing` | DOCUMENTED_ONLY |
| `localhost-continuity` | PARTIALLY_ENFORCED by guardian/completion, content not parsed |

`AGENTS.md` claims the lifecycle and independent reviews, but no hook or CI job enforces it. A PowerShell rendering initially displayed the em dash incorrectly; a direct Node UTF-8/code-point check proved that the source bytes are correct, so no encoding finding was retained.

## H. Workflow matrix

| Workflow | Trigger | Runtime consumer | Failure propagation | Classification |
|---|---|---|---|---|
| brownfield-change | None | None | None | DOCUMENTED_ONLY |
| greenfield | None | None | None | DOCUMENTED_ONLY |
| incident | None | None | None | DOCUMENTED_ONLY |
| migration | None | None | None | DOCUMENTED_ONLY |
| recovery | None | None | None | DOCUMENTED_ONLY |
| release | None | None | None | DOCUMENTED_ONLY |

They are arrays of step labels only. There are no precondition schemas, agent/skill/tool bindings, dependency status, skip prevention, retries, timeouts or completion trace. All six are syntactic orphans.

The GitHub Actions workflows run product checks but never invoke doctor, validate, preflight, self-test, integrity or completion. Therefore CI success is not Engineering OS certification.

## I. Runtime analysis

| Runtime | What is implemented | Main finding |
|---|---|---|
| aceo | CLI dispatch and child exit propagation | No lifecycle enforcement; optional entry point |
| core | JSON read/write, Git fingerprint, helpers | Swallows read/Git errors; non-atomic overwrite; no locks/schema |
| doctor | Tool/file/config presence | Shallow presence test called PASS |
| validate-pack | Counts, JSON parse, JS syntax, frontmatter | Quantity gate; schemas/content/wiring unvalidated |
| discover | Heuristic profile generation | No schema validation or authoritative inventory |
| impact | Filename/status heuristic | Mutable caller can override; content/context gaps |
| mission | Ledger mutation | Can erase old mission and jump status directly to DONE |
| evidence | Claim recorder | Does not execute commands; accepts PASS/exit 1/static |
| review | Claim recorder | No actor identity or independence proof |
| finding | Three-state ledger | Direct OPEN→RESOLVED without verification |
| side-effect | Side-effect ledger | Not coupled to policy; caller self-asserts authority/status |
| ownership | Path leases | Non-atomic; no expiry/session/branch/repo binding |
| policy-gate | Numeric comparison | Caller can supply `--current A5`; policies not loaded |
| execution-graph | Cycle/dependency/path overlap checks | Accepts unknown role, mode mismatch and empty ownership |
| context-packet | State summary and path existence | No file hashes/ranges/coverage proof |
| checkpoint | JSON snapshot | No restore, validation, checksum or rollback |
| preflight | Doctor + guardian, writes snapshot | Completion accepts stale fingerprint |
| completion-gate | Ledger-based blocking | Multiple critical false-PASS paths |
| safe-exec | Runs command with guardian checks | Correct exit propagation, but not wired into scripts/hooks/CI |
| fingerprint | Prints Git/worktree hash | Correctly invalidates normal changed evidence in tested case |
| localhost-guardian | Watch/recover/ownership checks | Substantive and self-tested; state writes still non-atomic |
| verify-integrity | Hash manifest verifier | Unusable installed: `INTEGRITY.json` absent |
| self-test | 19 temp tests | Positive/basic cases only; happy path records unexecuted PASS |
| audit-inventory | Read-only deterministic audit artifact | Added by this audit; not a completion enforcement mechanism |

The fingerprint is the strongest implemented control. It includes HEAD, branch, staged/unstaged binary diffs and untracked contents, excluding `.codex/state/**` and project profile. The control worked for ordinary evidence after a tracked file change. It does not rescue static evidence, stale preflight, missing coverage, role spoofing or state corruption.

## J. State analysis

| Concern | Observed behavior | Status |
|---|---|---|
| Source of truth | `.codex/state/run-state.json` plus separate preflight/ownership/guardian files | Multiple mutable sources |
| Schema/version | Schemas exist; runtime does not validate | FAIL |
| Atomicity | Direct `writeFileSync` to target | FAIL |
| Locking | Run state/ownership/preflight: none; guardian recovery lock only | FAIL |
| Concurrency | 40 successful writers; 3 records persisted | CRITICAL FAIL |
| Missing state | Defaults to IDLE | Ambiguous, not distinguished |
| Corrupt/partial state | Silently defaults to IDLE with exit 0 | CRITICAL FAIL |
| Stale detection | Evidence fingerprint only when not static | Partial |
| Recovery | Checkpoint creation only; no restore/validation | FAIL |
| Revision | Live run-state schemaVersion 2, no monotonic revision | FAIL |
| Branch binding | Fingerprint contains branch; state file itself is shared across branch switches | Partial/unsafe |
| Worktree binding | No repository/worktree identity in state | FAIL |
| Cross-session | Ignored files persist in same directory | Implemented but unsafe |
| Cross-project | No persisted repository ID; prior unrelated mission was observed in this state | CRITICAL FAIL |

Live evidence of stale state: `ownership.json` retains an ACTIVE `.git` lease acquired 2026-08-27 even though the recorded header mission is DONE. The preflight fingerprint and all evidence/reviews refer to an older worktree fingerprint. Earlier in this development session the same run-state contained an unrelated “student portal” mission before manual reinitialization, proving contamination is not hypothetical.

Permission failures are raw filesystem exceptions. They are not durably represented as `BLOCKED_BY_PERMISSION`. Previous OneDrive/sandbox writes to preflight and guardian state produced EPERM and needed elevated execution.

## K. Coverage analysis

There is no runtime coverage ledger, eligible-file manifest, range/line record, reviewer-to-file mapping or repository-claim mode. `context-packet` verifies only that listed files exist. A mission criterion called “repository audited” with one manually asserted PASS and zero inventory/coverage records passed the completion gate.

Answer to the mandatory question: changing a tracked line invalidates ordinary fingerprinted evidence, which was proven. It does **not** reliably invalidate certification because `--static` evidence remains accepted, preflight freshness is ignored, and no file/range coverage exists. Repository-wide PASS is therefore unprovable.

The new inventory artifact provides a deterministic snapshot, but it is an audit artifact, not yet wired to completion and cannot prove semantic line review.

## L. Evidence analysis

Evidence records can contain command, cwd-equivalent provenance, exit code, timestamp, fingerprint and producer, but command and exit code are optional and caller supplied. No command is executed by `evidence.mjs`; output and output hash are absent. Producer identity is an arbitrary registered string. The self-test `control-plane-records-and-gate` itself records PASS with no command or exit code, then expects the gate to pass.

Attack result: `PASS`, command `node failing-test.mjs`, exit code `1` was accepted and completion returned PASS. Static evidence remained valid after a tracked file changed. Evidence can therefore be fabricated, copied, made stale, or associated with a false role.

## M. Findings system analysis

The contract supports only OPEN, RESOLVED and WAIVED. `finding.mjs:5` changes an OPEN finding directly to RESOLVED or WAIVED with an optional free-text reason. It requires no root cause, fix reference, fresh verification evidence, verifier, independent identity or transition history.

Attack result: a CRITICAL finding moved OPEN→RESOLVED with `resolution: null`; completion then returned PASS.

## N. Completion analysis

Completion is decided solely by `.codex/runtime/completion-gate.mjs`. The gate checks active-like mission status, criteria evidence, high findings, side effects, claimed review names, preflight existence/failures for L1+, and guardian health.

It does not require any requirement or criterion to exist; does not require lint/typecheck/test/build/security/coverage/inventory; does not validate evidence exit code or command; accepts static stale PASS; does not compare preflight fingerprint; trusts reviewer strings; ignores unresolved MEDIUM/LOW findings; and has no workflow-stage ledger.

Proven false completion conditions:

- no requirements/criteria: PASS;
- skipped repository files/ranges: PASS;
- claimed failing test as PASS with exit 1: PASS;
- unexecuted test/manual claim: PASS;
- static stale evidence after change: PASS;
- stale preflight after change: PASS;
- critical finding directly resolved without verification: PASS;
- one caller claiming all required reviewers: PASS;
- schemaVersion 999: PASS;
- unknown execution-graph role: graph PASS;
- authority self-asserted A5: policy PASS.

The normal fingerprint change control blocked ordinary stale evidence as expected. The live completed mission is currently blocked because its evidence is stale and its status is DONE; this is a valid negative result but does not eliminate the bypasses.

## O. Concurrency analysis

Run-state commands perform read-modify-write without a lock or compare-and-swap. The controlled 40-process evidence test produced 40 exit-code-0 writers and only 3 persisted records. This is deterministic evidence of lost updates. JSON happened to remain parseable in this run; direct overwrite also permits partial/corrupt files on interruption.

Ownership leases have the same race. The execution graph only detects overlap inside one already-built graph; it does not lock code or force writers to acquire leases. Git/worktree isolation is documented but not orchestrated.

## P. Continuity analysis

Conversation-independent state exists, but correctness does not. New sessions can read the ignored state; they cannot prove its repository, branch, worktree, schema or freshness. Context packets list state and file existence but do not capture file hashes or inspected ranges. Checkpoints are snapshots without restore or integrity verification. Mission initialization overwrites prior ledger arrays without backup.

Compaction/reboot can preserve JSON and guardian PID/state, but agent selection, actual work, reviewed ranges, tool permission failures and workflow progress remain conversational claims. Branch change changes the fingerprint but leaves the same state and stale ownership leases in place.

## Q. False-PASS attack results

| Attack | Expected | Actual | Result |
|---|---|---|---|
| Empty active mission | BLOCKED | PASS/0 | Vulnerable |
| PASS with exit code 1 | BLOCKED | PASS/0 | Vulnerable |
| Static evidence then tracked change | BLOCKED | PASS/0 | Vulnerable |
| Normal evidence then tracked change | BLOCKED | BLOCKED/2 | Control works |
| Stale preflight then fresh evidence | BLOCKED | PASS/0 | Vulnerable |
| CRITICAL finding direct resolve | BLOCKED | PASS/0 | Vulnerable |
| Same caller claims four reviewers | BLOCKED | PASS/0 | Vulnerable |
| Corrupt partial state | Explicit corruption failure | IDLE/0 | Vulnerable |
| Future schema + extra authority field | BLOCKED | PASS/0 | Vulnerable |
| Repository claim with zero coverage | BLOCKED | PASS/0 | Vulnerable |
| Graph with nonexistent writer role | BLOCKED | PASS/0 | Vulnerable |
| CLI self-asserts A5 for production | BLOCKED | PASS/0 | Vulnerable |
| 40 concurrent evidence writes | 40 persisted or serialized | 3 persisted | Vulnerable |
| Missing integrity manifest | Structured BLOCKED/unsupported | Uncaught ENOENT/1 | Vulnerable |

## R. Findings

### EOS-001 — CRITICAL — Completion accepts fabricated and unexecuted PASS

- Files/lines: `.codex/runtime/evidence.mjs:4-9`, `.codex/runtime/completion-gate.mjs:10-15`.
- Evidence: PASS with claimed exit code 1 caused gate PASS/0.
- Root cause: evidence CLI records assertions instead of executing/verifying commands; completion checks only `result` and freshness.
- Impact: any caller can bypass every technical test.
- Failure path: create criterion → record PASS with registered producer → gate PASS.
- Remediation: runtime-executed evidence command, captured cwd/exit/output hash; reject claimed PASS and nonzero exit; require command-kind policies.
- Verification: adversarial nonzero/unexecuted/fabricated cases must be BLOCKED.

### EOS-002 — CRITICAL — Vacuous and coverage-free completion

- File/lines: `.codex/runtime/completion-gate.mjs:8-15`.
- Evidence: active mission with zero requirements/criteria returned PASS; repository claim with zero inventory/coverage returned PASS.
- Root cause: universal checks over empty arrays and no repository coverage model.
- Impact: “entire repository audited” cannot be proven.
- Remediation: require nonempty valid requirements/criteria; introduce versioned inventory and per-file/hash/domain coverage; gate repository claims.
- Verification: skipped file/range and changed hash must block.

### EOS-003 — CRITICAL — Stale evidence/preflight can be accepted

- Files/lines: `.codex/runtime/evidence.mjs:9`, `.codex/runtime/completion-gate.mjs:11,23-24`.
- Evidence: static evidence survived tracked change; preflight fingerprint differed from current fingerprint and gate passed.
- Root cause: caller-controlled `--static`; preflight fingerprint not compared.
- Impact: certification can refer to different code.
- Remediation: prohibit static PASS for code-sensitive criteria; enforce current preflight fingerprint; define freshness policy by evidence kind.
- Verification: both attacks block after any tracked/untracked content change.

### EOS-004 — CRITICAL — State corruption and lost updates

- File/lines: `.codex/runtime/lib/core.mjs:4-5,16-17` and every read-modify-write CLI.
- Evidence: corrupt JSON silently became IDLE/0; 40 successful writers yielded 3 records.
- Root cause: catch-all JSON fallback and non-atomic unlocked overwrite.
- Impact: mission/evidence/findings can disappear or be mistaken for absent state.
- Remediation: strict error taxonomy, schema validation, atomic temp+rename, bounded lock/CAS revision, backup/recovery.
- Verification: corruption is explicit; concurrent writers are serialized with no lost records.

### EOS-005 — CRITICAL — Findings close without verification

- Files/lines: `.codex/runtime/finding.mjs:4-5`, `.codex/contracts/finding-record.schema.json`.
- Evidence: CRITICAL OPEN→RESOLVED with null reason then completion PASS.
- Root cause: three-state lifecycle and unrestricted transition.
- Impact: critical defects can be administratively erased.
- Remediation: enforced transition graph through fixed-pending-verification; fresh evidence and independent verifier required; append-only history.
- Verification: direct resolution and self-verification reject.

### EOS-006 — CRITICAL — Self-approval and role spoofing

- Files/lines: `.codex/runtime/review.mjs:3-4`, `.codex/runtime/completion-gate.mjs:19-22`.
- Evidence: one process recorded architecture/security/adversarial/git PASS and satisfied L5.
- Root cause: registry name is treated as identity; no orchestrator-issued execution identity or independence relation.
- Impact: implementer can approve itself.
- Remediation: bind records to authenticated orchestrator run IDs and writer/reviewer identities; enforce distinct principals and immutable provenance.
- Verification: same principal, reused run ID and CLI role spoofing must block.

### EOS-007 — CRITICAL — Registered agents are not executable agents

- Files: `.codex/agents/registry.json`, `.codex/agents/**/*.md`, `.codex/runtime/**`.
- Evidence: no runtime imports/loads role documents or launches agents; documents omit tools/input/output/workflow/skills.
- Root cause: registry built as a catalogue, presented as an orchestrator.
- Impact: critical specialists may never run while completion accepts their names.
- Remediation: either implement an orchestrator adapter with structured role contracts or downgrade claims to “role labels” and never use them as proof.
- Verification: end-to-end dispatch trace from trigger through role execution and signed output.

### EOS-008 — HIGH — Skills are mostly persona-only and all are runtime-unwired

- Files: `.codex/skills/**/SKILL.md`, `.codex/runtime/validate-pack.mjs:25-30`.
- Evidence: 21/23 have ten generic lines; runtime counts but never loads them.
- Root cause: quantity target substituted for procedural quality and activation.
- Impact: skill existence creates false capability claims.
- Remediation: procedural contract and activation registry; validate required sections; remove/reclassify decorative skills.
- Verification: trace skill selection and resulting evidence.

### EOS-009 — HIGH — Contracts are not validated

- Files: `.codex/contracts/**`, `.codex/runtime/validate-pack.mjs:31`.
- Evidence: schemaVersion 999 and extra field accepted; 10 contracts literal orphans.
- Root cause: JSON parsing mistaken for schema enforcement.
- Impact: stale/corrupt/incompatible state enters authority decisions.
- Remediation: Draft 2020-12 validator at every producer/consumer boundary; strict versions/additional properties/migrations.
- Verification: missing/extra/wrong/corrupt/future fixtures reject with distinct codes.

### EOS-010 — HIGH — Policies, rules and workflows are mostly documentary

- Files: `.codex/policies/**`, `.codex/rules/**`, `.codex/workflows/**`, `AGENTS.md:23`.
- Evidence: no consumers for 7 policies, 17 rules or any workflow.
- Root cause: model instructions presented as deterministic governance.
- Impact: stages and prohibitions can be skipped without runtime knowledge.
- Remediation: explicit classification of advisory vs enforced; workflow interpreter/stage ledger; policy evaluator reads versioned policy data.
- Verification: stage skip and policy disable attacks block.

### EOS-011 — CRITICAL — Authority can be self-asserted

- Files/lines: `.codex/runtime/policy-gate.mjs:3-4`, `.codex/runtime/side-effect.mjs:4-6`.
- Evidence: `--current A5 --required A5 --action production` returned PASS; side effects accept caller authority.
- Root cause: mutable CLI value is treated as granted authority.
- Impact: destructive/production claims can bypass approval semantics.
- Remediation: immutable user/orchestrator grant with scope/action/expiry; never accept current authority from untrusted CLI.
- Verification: self-assertion and replay reject.

### EOS-012 — CRITICAL — State is not repository/branch/worktree bound

- Files: `.codex/state/**`, `.codex/runtime/lib/core.mjs`, `.gitignore`.
- Evidence: unrelated student-portal mission previously present; active stale `.git` lease; no repository ID in state.
- Root cause: one ignored state directory per checkout with no identity envelope or lease expiry.
- Impact: cross-project/branch contamination and false continuity.
- Remediation: persist canonical repository + git-common-dir + worktree + branch identity; quarantine mismatch; expire/reconcile leases.
- Verification: copied state, branch switch and worktree fixtures block/quarantine.

### EOS-013 — HIGH — Integrity gate is unavailable in installed mode

- Files/lines: `.codex/runtime/verify-integrity.mjs:3-5`, `.codex/runtime/validate-pack.mjs:8,18`.
- Evidence: integrity command throws ENOENT because `INTEGRITY.json` is absent while validate returns PASS installed.
- Root cause: verifier assumes distribution manifest; installed validation makes it optional without structured unsupported result.
- Impact: OS file tampering is not detected.
- Remediation: generate/maintain an installed manifest or explicitly report NOT_APPLICABLE/BLOCKED; wire freshness to HEAD.
- Verification: changed/missing OS file fails predictably.

### EOS-014 — HIGH — BLOCKED semantics are incomplete

- Files: core/preflight/integrity and state writers.
- Evidence: corruption defaults to IDLE; integrity is raw exception; observed EPERM is not durably classified.
- Root cause: catch-all fallback and unstructured exception paths.
- Impact: missing execution can be confused with absence/failure and retried blindly.
- Remediation: typed PASS/FAIL/BLOCKED_BY_PERMISSION/NOT_APPLICABLE results and bounded retry metadata.
- Verification: EACCES/EPERM/missing tool fixtures produce BLOCKED, never PASS.

### EOS-015 — HIGH — CI does not enforce Engineering OS

- Files: `.github/workflows/cms-ci.yml`, `.github/workflows/deploy-ionos.yml`.
- Evidence: neither workflow invokes any `.codex` gate.
- Root cause: separate product CI and governance runtime with no bridge.
- Impact: green CI can coexist with false/incomplete OS state.
- Remediation: add non-destructive OS validation/self-test/integrity checks; completion remains local unless trusted state artifact design exists.
- Verification: intentional OS test failure makes CI fail.

### EOS-016 — HIGH — Execution graph accepts decorative/unsafe nodes

- File/lines: `.codex/runtime/execution-graph.mjs:3-8`.
- Evidence: nonexistent write role with empty ownership returned PASS.
- Root cause: graph validates topology only, not registry/schema/ownership completeness.
- Impact: graph cannot prove actual delegation or conflict safety.
- Remediation: validate role/mode/ownership/schema/status and require orchestrated execution records.
- Verification: unknown/mismatched/ownerless writer fixtures reject.

### EOS-017 — MEDIUM — Validation metrics are misleading

- File/lines: `.codex/runtime/validate-pack.mjs:21-40`.
- Evidence: PASS reports `files: 450`, which is repository walk count, while labeled alongside OS component counts; minimum counts reward decorative files.
- Root cause: presence/quantity is reported as validation quality.
- Impact: optimistic PASS presentation.
- Remediation: separate inventory metrics from enforcement tests and report DOCUMENTED/WIRED/ENFORCED states.
- Verification: decorative agent/skill fixture cannot satisfy capability validation.

## S. Files modified

| File | Purpose |
|---|---|
| `.codex/runtime/audit-inventory.mjs` | Read-only deterministic Engineering OS inventory generator |
| `CODEX_ENGINEERING_OS_INVENTORY.json` | Complete audit snapshot with SHA-256/reference metadata |
| `CODEX_ENGINEERING_OS_AUDIT_REPORT.md` | This forensic report |

No product/site/backend/database/migration file was modified. The attempted core/completion hardening was rejected by the permission reviewer and was not applied.

## T. Tests actually executed

All commands ran from the repository root unless the test itself created an isolated temporary Git fixture.

| Command | Exit | Actual result |
|---|---:|---|
| `git status --short; git branch --show-current; git rev-parse HEAD` | 0 | Clean, `dev`, audited HEAD confirmed |
| deterministic PowerShell SHA/line/size inventory | 0 | 150 initial files; successful strict rerun after rejecting a non-terminating-error first attempt |
| `node .codex/runtime/aceo.mjs doctor` | 0 | PASS; shallow presence checks |
| `node .codex/runtime/aceo.mjs validate` | 0 | PASS; 47/23/18/8 and syntax/parse checks |
| `node .codex/runtime/aceo.mjs selftest` | 0 | 19/19 PASS; does not cover adversarial failures |
| `node .codex/runtime/aceo.mjs integrity` | 1 | Uncaught ENOENT for missing `INTEGRITY.json` |
| `node .codex/runtime/aceo.mjs gate` | nonzero | Live old mission BLOCKED due DONE/stale evidence/reviews |
| `node .codex/runtime/aceo.mjs guardian status --quiet` | 0 | Healthy TCP at `127.0.0.1:8082` |
| `node .local/engineering-os-adversarial-audit.mjs` | 0 harness | 12 vulnerabilities; one freshness control worked |
| `node --check .codex/runtime/audit-inventory.mjs` | 0 | Syntax valid |
| `node .codex/runtime/audit-inventory.mjs --output CODEX_ENGINEERING_OS_INVENTORY.json` | 0 | 160 files, deterministic metadata generated |
| `npm.cmd run lint` | 0 | ESLint PASS |
| `npm.cmd run typecheck` | 0 | TypeScript PASS |

The adversarial harness used copies under the OS temp directory, initialized separate Git repositories, disabled guardian requirements in those fixtures and removed them afterward. It did not mutate live state or product data.

## U. Adversarial retest

No enforcement correction was applied because both the core persistence patch and the narrower completion-gate patch were blocked by the permission reviewer as high-impact persistent governance changes. A full second execution still reported 12 vulnerable scenarios out of 13; the sole working control remained ordinary fingerprint invalidation. The results are intentionally not reported as fixed.

The inventory addition was retested by syntax check, regeneration, repository identity inspection and summary/hash parsing. It does not claim to remediate completion or coverage enforcement.

## V. Remaining limitations

- No trusted mechanism available inside this repository can prove that a claimed role corresponds to an independent Codex sub-agent/principal.
- No runtime can prove semantic line review merely from hashes; it can only require and invalidate structured coverage claims.
- Live state remains unlocked, non-atomic and identity-free.
- No full workflow orchestration exists.
- Most agents and skills remain decorative.
- Contracts remain unenforced.
- CI remains disconnected from OS gates.
- Integrity remains unavailable in installed mode.
- Existing guardian is useful but its JSON state writes share core persistence weaknesses.

## W. Blocked items

`BLOCKED_BY_PERMISSION`:

1. Replacing `core.mjs` with strict typed state errors, repository identity, schema checks, atomic write and serialized transaction support was rejected as a high-impact runtime rewrite.
2. A narrower completion-gate change requiring nonempty criteria, executable exit-code-0 evidence, non-static freshness and current preflight fingerprint was also rejected as a high-impact enforcement change.

These blocks are not PASS and are not evidence that the proposed remediation is correct. They require explicit approval after review of this report, followed by implementation, regression tests and a second red-team run.

## X. Final Engineering OS status

# ENGINEERING_OS_FAIL

Reason: multiple open CRITICAL findings are proven by executable isolated attacks, including false completion, fabricated/stale evidence, direct critical-finding closure, self-approval, authority spoofing, cross-context state contamination and 37/40 lost concurrent updates. The current doctor/validate/self-test PASS results certify only their narrow checks and cannot override these findings.

Minimum PASS checklist:

- [x] deterministic Engineering OS inventory snapshot
- [ ] real, wired agents
- [ ] real, wired procedural skills
- [ ] contracts validated at runtime
- [x] runtime commands execute, but authority behavior is unsafe
- [ ] state persistence validated
- [ ] stale state comprehensively detected
- [ ] verifiable semantic coverage
- [ ] changed-file invalidation without bypass
- [ ] evidence freshness without bypass
- [ ] safe findings lifecycle
- [ ] gates fully enforced
- [ ] BLOCKED distinct everywhere
- [ ] secure completion gate
- [ ] false-PASS attacks rejected
- [ ] independent verification proven
- [ ] continuity safely validated
- [ ] concurrency safe or explicitly serialized
- [ ] workflows executable and complete
- [ ] all failures propagate correctly
- [ ] no open CRITICAL finding
