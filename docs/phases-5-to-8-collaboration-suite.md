# Phases 5–8: consent-scoped collaboration

Implementation record: 21 October 2026, 03:26 IST. Engineering verification is tracked in PR #12 and the production readiness plan. This document does not assert a production deployment or operational approval.

## Phase 5 — Mutual Decision Room

- Candidate creates an invitation through a currently open, unexpired role. The recipient is that role's company owner, identified before consent. Purpose and boundaries are required.
- Room access lasts 30 days. Closing or expiry removes employer access to the room and all child content through RLS. Closed invitations cannot be reopened; renewal requires a new room and consent.
- Only the candidate and the invited company owner participate. Staff and founders receive no implicit room access. Candidate may delete a room and its messages, proofs, dossier entries and export history.
- Questions, answers, next steps and corrections are append-only. Database triggers stamp author and time. Corrections remain visible instead of silently replacing earlier statements.
- Invitations do not create applications, change Talent Record sharing, reveal private opportunity decisions or grant ledger access.

## Phase 6 — Proof Studio

- Candidate selects a confirmed ledger source and edits the exact statement, source label/date, context, uncertainty and redaction explanation to disclose.
- Save always creates a private snapshot, even if a direct API caller requests sharing. A separate preview shows the recipient room and exact contents. Explicit approval shares that snapshot with that room only.
- Snapshots cannot be rewritten in place. Delete and recreate when edits are required. Delete cascades to linked dossier evidence references.
- Any source update automatically withdraws linked snapshots. A server-generated source fingerprint prevents resharing an outdated snapshot, including changes within one transaction. Preparing a new snapshot is required.
- Candidate confirmation is not independent verification. Recipients see that limitation and the captured date. Source identifiers and fingerprints are omitted from exports; original unredacted ledger fields are never included.
- Column grants also prevent authenticated API clients from selecting private ledger identifiers, source fingerprints or internal version metadata from proof snapshots. The UI and export explicitly request only approved snapshot fields.
- Proof is text evidence in this release. No document attachment, independent credential verification or externally accessible public share link is claimed.

## Phase 7 — Decision Dossier

- Dossier entries distinguish evidence references, human judgments, open questions, corrections/disagreements and next steps. Evidence references require a currently shared proof from the same room.
- Source withdrawal hides linked evidence-reference entries from both participants until a valid replacement is explicitly added. Independently written messages and human judgments remain part of the conversation; participants should append corrections where needed.
- No model-generated summary, candidate ranking, hiring score or automated employment verdict is produced.
- Active participants may export JSON containing the currently accessible dossier and exact approved snapshots. It fails closed if queries fail, permission changes or the export would be truncated beyond 1,000 entries/snapshots. Export requests are server-stamped and visible in the room.
- Exports are point-in-time copies. Withdrawal cannot recall a downloaded file or content copied into another person's message. The UI explains purpose limitation, confidentiality and deletion responsibility before download. Near-simultaneous requests can complete as access changes; operational handling of already delivered copies remains necessary.

## Phase 8 — Human Intelligence Services

- Candidate requests career review, evidence review or decision support with a defined scope and explicit consent. Request submission creates no charge, payment, subscription or entitlement.
- Consent covers triage by the Avenlo service team; after assignment, the assigned staff member has access. A founder may review explicitly escalated cases. Other staff, companies and other candidates are denied.
- Staff must declare scope/competence/conflict review and record an outcome or progress note when accepting or changing a case. Progress changes append trusted case notes. Notes are visible to the candidate; no concealed staff assessment is stored here.
- Candidates can append corrections/escalations, withdraw staff access or delete cases and notes. Expiry removes staff access after 30 days. A new case is required to renew withdrawn consent.
- Private ledger, proof drafts and decision rooms are separate. Staff should request only necessary, redacted context through shared case notes.
- Paid eligibility, agreed deliverables, turnaround, conflict resolution, support ownership and published commercial terms must be accepted operationally before paid service delivery. Existing checkout/terms/refund flows are not silently changed by a service request. No hiring outcome is guaranteed.

## Shared security and lifecycle

RLS is enabled on every new table. Column-level grants prevent identity/content rewrites. Audit writers and trigger helpers reside in `private`, use an empty search path and revoke direct public/anon/authenticated execution. Actors and timestamps are trusted database values. Candidate deletion cascades through these products. Existing paid-service orders still require support review before account erasure.

Application reads are bounded and display their limits. Export fails instead of presenting a partial record as complete. Visible errors preserve saved choices. Server actions verify authenticated identity, database role, account status and email confirmation; staff additionally require the private admin entry marker.

## Integration repairs included

- Combined Phase 0–4 migrations restore opt-in applicant profile/skill/resume policies after the Phase 0 rewrite; regression tests cover opt-out and withdrawal.
- Company signup preserves the permitted `account_type=company` behavior without accepting staff/founder metadata.
- Job ownership/creator restrictions survive the Phase 0 policy replacement.
- Approved role briefs can propose pending-review jobs. Database-generated snapshots expose reviewed outcomes, requirements, evidence expectations and rationale to candidates after human job approval. Changing an approved definition pauses linked open jobs. The reviewed definition never directly publishes a job.
- Reviewer account removal clears references and records a lifecycle revision without requiring a deleted actor. Company owner deletion remains constrained by company/job ownership; it is not exposed as candidate self-service erasure.

## Verification and remaining gates

`supabase/tests/collaboration_suite.sql` attacks cross-candidate/company access, private snapshots, source corrections, stale resharing, staff permissions, withdrawal, erasure, role publication and reviewer lifecycle. Existing Phase 0–4 suites run against the combined schema. Unit tests cover consent schemas, evidence/judgment distinctions, expiry and export minimization. A disposable full Supabase CI journey exercises real Auth, Storage and browser interactions; its latest outcome must be recorded before marking engineering DONE.

Production backup/baseline, approved retention policy and purge scheduling, operational service acceptance, accessibility review with representative users and controlled cohort approval remain release gates. No test writes should target Vercel Preview because it shares the production database.
