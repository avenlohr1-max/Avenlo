# Production suite database upgrade

Updated: 22 October 2026, 18:03 IST. Public application release and overall acceptance remain open.

## Completed live upgrade — 22 October, 01:49–01:50 IST

Target: `yzuuutynqfpbiozlrfmy`. Release source: `39e479b4a21675f0e20be805a8388ef9a217c02a`, full CI #279 passed both jobs. The application code was not deployed by this database operation.

- ✅ Original 35 scripts preserved and mapped to unique CLI-generated timestamp versions with checksum verification.
- ✅ Clean 35-file replay, restored 34-file upgrade and five synthetic SQL suites passed, with a transaction per migration.
- ✅ Fresh eight-area initial-schema comparison, Auth signup-trigger and relevant role checks passed.
- ✅ Fresh restricted database snapshot at 01:42 IST was encrypted with the existing separately held key, uploaded privately, downloaded again and verified by ciphertext hash, decrypted archive hash and archive index. Previous recovery-tested backup/key were preserved. Storage contained no objects.
- ✅ A temporary restrictive client-access hold and signup trigger protected the upgrade window. The equivalent initial entry was explicitly **adopted**, not replayed. Only the 34 later entries were executed.
- ✅ All original columns/rows in the seven original public tables retained matching canonical row digests and counts.
- ✅ Readback found 35 canonical history entries, 33 public tables with RLS, suite relations present, private candidate documents bucket, sharing still private by default and obsolete permissive applicant policies removed.
- ✅ Maintenance policies, temporary signup trigger and temporary function removed; Data API schema reload notified. No maintenance hold remains.

No source records, keys, passwords, private backup URLs or row digests are recorded here.

## Additional security remediation

The live advisor revealed explicit anon/authenticated function grants from provider defaults that a PUBLIC-only revocation does not remove. An additional forward migration closes browser access to public SECURITY DEFINER functions, moves the candidate-company policy lookup behind the private schema, preserves trigger behavior, restricts settlement to the server and removes candidate-controlled service-order creation.

The regression harness now reproduces those direct provider grants. All 36 files passed a clean replay; all 35 forward changes passed on a private restored baseline; all six SQL suites passed, including forbidden audit/payment RPCs and future-function defaults. Original baseline rows were preserved. Live application of this additional fix is tracked separately; do not infer it from prepared SQL.

Payment handler corrections use trusted settlement only after owner/signature/legal checks, reject a missing signing secret, check captured webhook amount/currency, and keep recorded-but-unprocessed webhook events retryable. The 88 unit/action tests passed locally. This is not commercial approval or a provider sandbox payment/refund acceptance record.

## Remaining release gates

- Apply and verify the additional function-access migration; rerun live advisors.
- Leaked-password protection remains unavailable under the founder's chosen Free plan. No upgrade or security exception is approved.
- Vercel access, exact application deployment/configuration and live functional verification.
- Owner review of retention/service proposal, actual support/quality coverage and support/alert drills.
- Recurring backup/purge operations, representative candidate/employer/operator acceptance and first-cohort sign-off.
- Production erasure enablement remains gated by the approved retention/support procedure and deployed smoke checks.
