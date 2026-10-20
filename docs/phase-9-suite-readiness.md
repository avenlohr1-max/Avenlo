# Phase 9 — whole-suite readiness

Updated: 21 October 2026, 03:26 IST. Status: engineering checks in progress; public rollout held.

## Product coverage

| Product | Implemented workspace | Core permission boundary |
|---|---|---|
| Talent Record | `/dashboard/profile` | Candidate ownership; opt-in applicant sharing |
| Signal Ledger | `/dashboard/signals` | Private candidate sources and correction history |
| Capability Atlas | `/dashboard/skills` | Candidate-owned skill/source associations |
| Career Scenario Lab | `/dashboard/scenarios` | Private candidate-defined alternatives |
| Opportunity Intelligence | `/dashboard/recommendations`, `/staff/opportunities` | Human curation; private candidate decisions |
| Role Intelligence Studio | `/company/roles`, `/staff/roles` | Company ownership and separate human review |
| Mutual Decision Room | `/dashboard/rooms` | Candidate invitation to one company; expiry/withdrawal |
| Proof Studio | `/dashboard/proofs` | Exact preview and separate sharing approval |
| Decision Dossier | Room workspace and export | Participant access; source-aware entries and audited requests |
| Human Intelligence Services | `/dashboard/services`, `/staff/services` | Explicit team consent, assignment and escalation |

## Automated evidence required

1. Dependency and secret checks, lint, TypeScript, unit/action tests, production build and public browser smoke checks.
2. Empty PostgreSQL replay of every legacy and new migration; complete existing RLS attack, erasure, opportunity and role-definition suites; integrated collaboration suite.
3. Disposable local Supabase Auth/PostgREST/Storage journey: three role accounts, candidate invitation, private preview, employer access after approval, conversation, dossier export, service assignment and withdrawal, room withdrawal, password-confirmed erasure, Storage cleanup and stale-session write rejection.
4. Production readiness tracker cites the latest passing commit/run. Earlier green runs do not validate later changes.

The disposable CI stack is a temporary test fixture, not a separate staging deployment. Its seed script refuses non-loopback URLs. No production secrets are needed. Duplicate historical migration prefixes are replayed explicitly only against an empty test database; this does not reconcile production migration history.

## Production and operational acceptance gates

| Gate | Evidence needed | Current constraint |
|---|---|---|
| Backup and recovery | Encrypted off-site backup plus successful disposable restore, recorded RPO/RTO and owner | Free project; no verified backup or secure CLI/DB access available |
| Schema baseline | Read-only live comparison, reviewed delta and canonical migration history | Live history previously empty; duplicate legacy prefixes require reconciliation |
| Auth security | Owner confirms leaked-password protection and production Auth configuration; advisors rechecked | Owner dashboard setting remains outstanding |
| Direct production release | Exact release SHA, reviewed migration bundle, preflight, smoke evidence and rollback owner | PR #12 is review code; no deployment performed |
| Erasure enablement | Auth/Storage journey green, paid-order exception and concurrency policy accepted | Production flag remains disabled pending remaining gates |
| Retention | Approved retention/exception rules, candidate notice, purge owner/schedule and audit evidence | Draft technical defaults in `collaboration-retention.md`; not a legal approval |
| Human service operations | Eligibility, deliverable, timeline, conflicts/escalations, refund/support and accountable reviewers | Implementation does not establish staffed service capacity or approve paid terms |
| Monitoring/incident response | Alert destination, responsible operator, incident drill and recovery evidence | Must be confirmed against actual deployment access and monitoring |
| Accessibility and UAT | Keyboard/screen-reader review plus representative candidate/employer/staff acceptance | Automated browser checks cannot substitute for user acceptance |
| Cohort rollout | Founder approval of named first cohort, enabled products, stop criteria and support coverage | Public rollout intentionally held |

## Controlled direct-production release procedure

1. Keep public intake and product rollout held. Confirm all required checks on the reviewed integration SHA. Use PR #12 as the combined review candidate rather than merging overlapping branches blindly.
2. Securely authenticate the owner's database tooling; never paste credentials into chat. Take and verify an off-site backup and restore it into an isolated disposable database. Record where the encrypted backup is stored and who can restore it.
3. Compare live schema to the integrated schema, reconcile legacy duplicate versions and prepare an explicit reviewed delta. Do not replay the entire repository or run blind `db push` against the live project.
4. Apply the reviewed database delta in a controlled window, deploy the exact reviewed application SHA, then run read-only production health checks. Execute any necessary write smoke checks only with designated synthetic production accounts and a reviewed cleanup plan.
5. Recheck Auth, RLS, Storage and security advisors; enable account erasure only when its data/retention gates are accepted. Confirm monitoring and support coverage.
6. If release health fails, hold intake and restore the previously reviewed application version. Prefer a reviewed forward schema repair; destructive data restoration requires the recovery plan and confirmed data-loss window.
7. Founder approves the first limited cohort. Release gradually by product/cohort with stop conditions for access violations, failed deletion, broken core tasks or support overload. Broader public release is a later decision.

There is no original Phase 10: the plan contains Phases 0–9 and ten products. The user's “5–10” request is tracked as completing remaining product implementation, Phase 9 verification and the ten-product reconciliation. It does not authorize public launch while the rollout hold remains in force.
