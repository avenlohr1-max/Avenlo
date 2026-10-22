# Phase 1 candidate data handling

This note describes the current Talent Record, Signal Ledger, and Capability Atlas implementation. It is an engineering behavior record, not a substitute for reviewed privacy terms.

## Access and consent

- Talent Records default to private. A candidate can opt in to profile, listed skills, and resume access for companies with a role application from that candidate.
- Company access is controlled by Supabase row-level policies. Turning sharing off removes that company's access to those candidate details on subsequent database/storage reads; the application record remains available to that company.
- Consent changes are recorded with the candidate, old and new values, actor, and time. Candidates can read their own consent events. The audit table is not directly writable by client roles.
- Signal Ledger entries, their correction history, and Capability Atlas evidence links are candidate-only in this release. No employer policy grants access to them.
- Resume-detected terms remain distinct from candidate-recorded skills. A candidate-confirmed signal may be linked to a skill, with source, context, and uncertainty kept visible. The link does not create a proficiency score.

## Correction, deletion, and audit

- Talent Record profile fields are editable by the candidate. Those edits currently replace the saved value; field-level historical versions are not retained.
- Signal Ledger corrections preserve before/after snapshots. Candidates may delete a signal; deletion also removes its correction history and Capability Atlas links through database cascades.
- Candidate skills and education can be removed from the Talent Record. Work history is stored in candidate preferences and is replaced when the candidate saves edits.
- Consent changes and Signal Ledger corrections have audit history. Reads of private content are enforced by RLS/storage policies but are not individually logged in this implementation.
- There is no automatic expiry job. Data remains until removed through the product or account-erasure process.

## Release prerequisites still open

- The self-service account-erasure implementation is in `docs/candidate-account-erasure.md`. Keep its server flag disabled until its migration, synthetic integrated journey, retention review and Production gates are resolved. Accounts with service orders require support review.
- Define and publish retention periods, support-assisted deletion handling, and legal/privacy terms before inviting candidates.
- Decide whether Talent Record field-level edit history or access-read auditing is needed for the first cohort.
- Validate the consent language and withdrawal journey with candidate research.

These items are tracked as rollout gates; this implementation must not be used with real candidate data until they are resolved.
