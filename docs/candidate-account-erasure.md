# Candidate account erasure

The candidate opens Account settings from their Talent Record, enters their
current password and types DELETE. The server requires an authenticated candidate,
same-origin JSON request and a separate password verification for that exact user.
No account identifier or storage path from the request is trusted.

The flow is disabled unless the server environment variable
`ENABLE_CANDIDATE_ACCOUNT_ERASURE=true`. Apply the generated account-erasure
storage migration and verify the synthetic-data acceptance checks before enabling
it. Keep it disabled until the Production baseline, backup and retention gates
are resolved. This PR does not enable it or apply Production changes.

## Deletion sequence

1. Refuse self-service erasure if any service order exists. Support must review
   transactions, refunds, disputes and retention first. Do not use Auth deletion
   to cascade away commercial records.
2. Reauthenticate with an isolated public client. Revoke all refresh sessions,
   including the verification session, before deleting files or the Auth user.
3. Enumerate the authenticated user's UUID folder in candidate-documents,
   including older formats and nested files. Bound discovery, collect paths
   before mutation, and remove in batches. Any discovery/removal failure prevents
   Auth deletion. Never delete Storage metadata using SQL.
4. Hard-delete the Auth user. Existing database foreign keys cascade through the
   Talent Record, skills, education, applications, signals, correction history,
   capability evidence, sharing history, Phase 3 opportunity suggestions/private
   decisions/evidence links and (when Phase 2 is merged) scenarios.
   Unexpected foreign-key or Storage-ownership constraints cause an error; they
   must be investigated, never bypassed.
5. Clear browser/server session state and return to sign in.

JWTs may remain valid until expiry despite session revocation. The restrictive
Storage policy requires a live profile on candidate-document operations, and
resume uploads use the authenticated client so this policy is enforced. Database
foreign keys and existing ownership policies prevent recreation of candidate
records after Auth deletion. Verify these boundaries with disposable data.

## Failures and retained copies

This operation spans Auth, Storage and Postgres, so it is not a single atomic
transaction. A failure can leave the account present with sessions revoked and
some documents removed. The UI says this and offers retry or support. Do not
report success unless document cleanup and Auth deletion both succeed.

Support must check for unexpected object ownership, concurrent/in-flight uploads
and foreign-key references before retrying failed cases. The current flow is
intended for accounts without commercial records. Concurrent checkout/deletion
and paid-account erasure require a coordinated workflow before paid rollout.

Copies already downloaded by recipients cannot be recalled. Security audit
records, support correspondence, payment-provider data and backup copies have
separate retention requirements. Published retention periods, support handling,
restoration suppression and legal review remain rollout gates. This feature does
not establish a legal retention schedule or claim that all external copies vanish.

## Acceptance

- Route tests cover disabled mode, cross-origin requests, malformed confirmation,
  expired sessions, wrong role/password, unexpected verifier identity, service
  orders, session-revocation errors, paginated/nested cleanup, Storage errors,
  Auth deletion errors and the successful deletion order.
- Disposable database checks verify canonical uploads, cross-user denial,
  candidate cascades and denial of Storage reads/writes with a deleted user's JWT.
- Before enabling, run a synthetic-account journey on the integrated release,
  including an injected cleanup failure and a retry. Record the outcome and
  confirm support ownership. No real candidate data is needed for this check.
