# Phase 3 — Opportunity Intelligence

## Candidate behavior

The Recommendations route is now an Opportunity Intelligence workspace. Avenlo
staff/founders curate specific open, unexpired employer roles for candidates.
Each suggestion shows its dated human curator note and the selected employer
role field behind it. The employer role fields are current source information;
the curator note is explicitly human judgment, not verified candidate suitability.

The staff form previews the selected employer role and its fields before curation.
Candidates can inspect current employer requirements, save/dismiss/restore a
suggestion, record private corrections and open questions, and link or remove
their own candidate-confirmed Signal Ledger entries. Linked evidence preserves
its source, date, context and uncertainty. Unreviewed resume extraction and
disputed/withdrawn confirmations are not displayed as evidence. Confirmation
does not establish employer verification or proficiency.

Dismissed suggestions leave the default Active view. Candidates can revisit the
Dismissed or All view and restore them without losing their private notes.

Suggestions are newest first without fit scores, ranking or automatic matching.
The latest 50 suggestions and 200 ledger entries are shown; older or unavailable
evidence is marked as needing review. Closed, expired or inaccessible roles have
no role/application action. The candidate chooses whether to open the existing
role/application flow. No suggestion or saved choice auto-applies or changes
Talent Record sharing consent.

## Privacy and ownership

- The curator workspace requires the private admin entry and a verified
  staff/founder database role. The cookie alone is not authorization.
- Operations can create suggestions for candidate accounts against open roles,
  identify the actual curator, and read suggestions. Suggestions are immutable
  through client roles. Employers cannot read these records.
- Candidate decisions, notes and evidence links are separate candidate-only
  tables. Operations cannot read those records or gain access to private ledger
  evidence through curation. Operational service credentials remain privileged.
- Composite foreign keys prevent linking another candidate's suggestion/signal;
  RLS requires a confirmed signal when creating an evidence link.
- Evidence rendering checks the current confirmation state on each request.
  Changed or missing evidence is shown as unavailable and can be removed.
- All three tables cascade on candidate account deletion. No new employer
  permissions, data exports, emails or notifications are introduced.
- Deleting the employer role clears its source link while preserving the
  candidate's suggestion history and private notes. It removes the role action.

## Verification and release

Tests cover action authorization, authenticated ownership, untrusted admin
cookies, invalid states, current evidence confirmation, missing employer fields
and closed/expired roles. Disposable Postgres checks cover staff-only curation,
recipient isolation, private notes/evidence, confirmation checks, cross-candidate
foreign keys, no automatic applications/consent changes and account cascades.

This PR stacks on account-erasure PR #9, which stacks on Phase 1 PR #6. Phase 2
PR #8 remains independent; the integrated release must include it before Phase 3
is treated as complete in the full product sequence. Production remains blocked
on backup, baseline reconciliation, security settings, retention terms and the
integrated synthetic-data journey. Candidate research remains unvalidated.

Engineering completion means the code and required checks passed in the PR.
Overall phase completion still requires its documented exit gates. Apply a
`✅ DONE` overall mark only once all those gates have evidence.
