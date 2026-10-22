# Production suite database upgrade

## Current hosting/Auth checkpoint — 22 October 2026, 18:48 IST

✅ **Phase 0 delivery foundation DONE for the invitation-only pilot scope.** See [hosting and authentication evidence](production-hosting-auth-evidence.md). Vercel team Avenlo/project avenlo, verified `https://avenlo.in`, DNS, environment targets and read-only login responses are confirmed. Auth now uses that origin with exact callback/reset allowlist; the single approved recovery email arrived with SPF/DKIM/DMARC passing and the correct redirect. The link was not consumed and no password changed.

The founder explicitly accepted unavailable leaked-password protection **for an invited pilot only**. The warning remains technically present; no paid upgrade or unrestricted public/paid release exception is approved. CI #281 passed both jobs on `8078b84d09189fa3c1a96b53fccd1a1f14ece2f8` (88 tests, six SQL suites). That candidate is a protected READY Preview sharing the Production database; no write UAT was run there. Production still serves older main `568e0dd795876d9e4f828da1b8b82f18282f6ffa`; PR #12 is unmerged and no candidate promotion occurred.

**Phases 1–9 remain open overall.** The founder will review the retention/service proposal; it is not accepted. Actual support hours, independent quality review, representative-user acceptance, operational drills, recurring backup/purge/alerts, erasure enablement and first-cohort approval remain outstanding. Earlier dated observations below are historical and are superseded by this checkpoint where they describe missing Vercel access, localhost Auth, untested delivery or no pilot exception.


Updated: 22 October 2026, 18:17 IST. Public application release and overall acceptance remain open.

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

The regression harness now reproduces those direct provider grants. All 36 files passed a clean replay; all 35 forward changes passed on a private restored baseline; all six SQL suites passed, including forbidden audit/payment RPCs and future-function defaults. Original baseline rows were preserved. ✅ The additional migration was applied at 18:11 IST after fresh 18:01 encrypted off-site snapshot verification. Readback: 36 history entries; zero public SECURITY DEFINER functions executable by anon/authenticated; private policy lookup available only to its intended roles; server settlement retained; candidate-manufactured service orders denied. Live advisors confirm the function-execution warnings are gone.

Payment handler corrections use trusted settlement only after owner/signature/legal checks, reject a missing signing secret, check captured webhook amount/currency, and keep recorded-but-unprocessed webhook events retryable. CI #280 passed both jobs on candidate `a3a01b2d61a40c7205bfdf1ceaa1806fe8af8e84`, including all 88 unit/action tests, six SQL suites, build, public smoke and authenticated journeys. This is not commercial approval or a provider sandbox payment/refund acceptance record. Handler source is not yet deployed to the Production application.

✅ A narrowly declared Auth update raised the minimum password length from six to eight at 18:09 IST, matching the existing forms. Before/after configuration diffs verified it was the only changed setting. Read-only inspection also confirmed Resend SMTP is configured; delivery is not yet tested. The live `site_url` remains localhost and must be corrected to the verified Production origin with its callback allowlist. No origin was guessed and no verification email was sent.

## Remaining release gates

- ✅ Additional function-access migration applied; advisors rechecked. The remaining INFO for `payment_events` is expected: RLS and no browser policy deliberately leave access to the trusted backend.
- Leaked-password protection remains unavailable under the founder's chosen Free plan. No upgrade or security exception is approved.
- Vercel access, exact application deployment/configuration and live functional verification.
- Owner review of retention/service proposal, actual support/quality coverage and support/alert drills.
- Recurring backup/purge operations, representative candidate/employer/operator acceptance and first-cohort sign-off.
- Production erasure enablement remains gated by the approved retention/support procedure and deployed smoke checks.
