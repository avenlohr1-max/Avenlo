# Overall phase closure

Updated: 22 October 2026, 18:17 IST.

Status: ✅ Production database/history and function-access hardening executed and verified; application deployment and human/operational acceptance remain open. Public rollout remains held. The founder chose to remain on Supabase Free on 21 October; leaked-password protection remains an explicit security gate because the provider requires Pro or above. No upgrade is authorized.

## Current verified position — 22 October, 18:12 IST

See `production-upgrade-evidence.md`: the initial schema was adopted after equivalence checks, all 34 canonical forward files executed, and an additional tested function-access migration applied. Live readback has 36 history entries, 33 public tables with RLS, zero browser-callable public SECURITY DEFINER functions, private Storage and no maintenance hold. Original seven-table rows were preserved. Fresh private encrypted off-site snapshots were downloaded/decrypted/hash/index verified; the earlier hosted recovery drill remains recorded separately. CI #280 passed both jobs on `a3a01b2d61a40c7205bfdf1ceaa1806fe8af8e84`, including 88 tests and six SQL suites.

The password minimum now matches the existing eight-character forms. Resend SMTP is configured; actual delivery is untested. Auth `site_url` still points to localhost, so the verified Production origin and callback allowlist must be configured before rollout. Vercel access remains unconfirmed, PR #12 is unmerged and the application candidate is not deployed. The founder said they had not seen the policy proposals: retention, free-trial scope, support hours and quality coverage are not accepted. Representative-user sessions, recurring backups/purges/alerts, operations drills and erasure enablement remain open. No overall phase is newly marked DONE from database completion alone.

Earlier dated evidence below records previous checkpoints; this current section supersedes their live-schema/history/off-site status.

## Evidence already available

- All ten products are implemented together in PR #12. Application commit `2c952006b8ad88dd6dce252c4eb3c4ddc30a178a` passed CI #276: 75 tests, build, disposable database permission/lifecycle suites, real local Auth/API/Storage browser journey and synthetic backup/restore.
- Read-only live inspection on 21 October at 20:04 IST still finds no Signal Ledger, rooms, role briefs, sharing-consent column or migration-history schema. A local metadata inventory records 7 public tables, 63 columns, 14 public/Storage policies, 19 constraints, 15 indexes and 5 public triggers. All 7 public tables have RLS enabled. This is neither a backup nor proof that all policies are correct.
- Secure CLI owner authentication was unavailable at that check; the founder then authenticated successfully and local project linking completed at 20:12 IST. This closes CLI sign-in only; backup access and recovery still need verification. No live migrations, settings changes, erasure enablement or deployment have occurred.

## Closure map

### Execution progress — 21 October 2026, 20:34 IST

✅ Secure CLI authentication and local project linking DONE. ✅ Approved restricted local database export DONE. ✅ Scoped application/Auth/Storage restore and aggregate metadata/data-count comparison DONE. ✅ Initial application-schema comparison and all 34 forward migrations on a private restored clone DONE, with post-delta security assertions. See `production-baseline-reconciliation.md` for exact coverage and limits.

Founder accepted support/privacy and service-delivery ownership. Coverage, mailbox/alert drills, trial quality and representative-user acceptance remain open. Founder has no off-site backup destination yet and chose to stay on Free; full encrypted off-site recovery and leaked-password protection remain release gates. No overall phase is newly marked DONE by these partial results.

| Phase | Remaining execution | Pass evidence | Accountable role to name |
|---|---|---|---|
| 0 | ✅ Snapshot recovery, canonical live schema/history and function fixes DONE; finish Production callback/delivery checks and Free password-security gate | Recovery and upgrade records; remaining Auth results | Release operator and recovery owner |
| 1 | Accepted notice/retention, support exception procedure, deployed erasure | Published notice version, successful synthetic erasure/retry, candidate UAT | Privacy/support owner |
| 2 | Candidate scenario walkthrough | UAT C04 | Product owner |
| 3 | Candidate opportunity walkthrough | UAT C05 | Product owner |
| 4 | Employer definition/publication walkthrough | UAT E01/E02 | Product owner |
| 5 | Participant consent/withdrawal and retention acceptance | UAT P01/P02 and accepted policy | Privacy/product owner |
| 6 | Candidate redaction/source-correction walkthrough | UAT C06 | Product owner |
| 7 | Export/retention/copy-handling acceptance | UAT P03 and accepted recipient terms | Privacy/product owner |
| 8 | Named service staff, capacity, quality, conflicts, support and offer acceptance | Operations roster, trial cases, approved offer | Service owner |
| 9 | Monitoring/recovery drills, accessibility, UAT, controlled release, cohort decision | Completed release record and explicit cohort approval | Founder/release owner |

Use `suite-user-acceptance.md`, `service-and-support-operations.md` and `production-recovery-and-release.md` for the steps. An approved document does not imply its procedures have been performed.

## Order of execution

**Sequential update (22 October 2026, 01:20 IST):** ✅ Item 1 snapshot backup and recovery drill DONE, including independent private encrypted storage, downloaded-copy verification, founder-confirmed printed key custody, 41-table hosted recovery verification, permission/service checks and temporary-project teardown. See `production-backup-recovery-evidence.md` for exact scope. Next is Item 2 live migration/security; no overall phase is marked DONE until its other exit criteria pass. No local container installation occurred.

1. Authenticate owner tooling securely; establish the private backup destination and recovery operator. Record only evidence references, never keys/passwords or user records in Git.
2. Back up database and actual Storage bytes; restore privately with outbound notifications disabled. Measure recovery time and check deletion suppression before reopening restored access.
3. Compare the captured live schema to the combined candidate; review a delta with preconditions. Reconcile duplicate historical migration versions without claiming old scripts ran. Validate that delta on the restored database.
4. Name operations owners; accept retention/copy-handling and service scope; prepare the actual notice/terms changes. A public contact address does not prove someone monitors it.
5. Run representative candidate, employer and staff acceptance against isolated synthetic accounts. The founder may act as a user during internal dogfooding, but representative-user validation remains separately recorded.
6. Address live security gates. Staying on Free leaves leaked-password protection open; this request does not waive that gate. Do not label the overall suite ready while it remains unresolved.
7. Deploy the reviewed release only after preceding release gates pass. Enable erasure only after its separate controls pass. Record read-only health checks and authorized synthetic write smoke results.
8. Founder decides the named first cohort, products, support window and stop conditions. Public rollout remains a separate approval.

## Completion record

For each gate record: gate ID, exact app/schema revision, environment, executor, actual IST timestamp, expected and observed result, sanitized evidence location, defects/retests, accountable acceptor and acceptance timestamp. Mark **✅ DONE** only when the required result and acceptance exist. A failed or unexecuted case stays open; a proposed target is never a measured result.

Keep real participant identities, recordings, backup manifests and data outside this public repository. Use opaque references here. The first closure update prepares procedures; it does not establish staffing, legal retention approval, paid service approval or user satisfaction.

## Sources

- [Supabase backups](https://supabase.com/docs/guides/platform/backups): Free projects need off-site exports; database backups exclude Storage object bytes.
- [Supabase password security](https://supabase.com/docs/guides/auth/password-security): leaked-password protection requires Pro or above.
- [Callable-function remediation](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) and [authenticated-call remediation](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
