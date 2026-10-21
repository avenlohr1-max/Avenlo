# Production recovery and controlled release

Updated: 22 October 2026, 01:22 IST. Status: execution procedure prepared, production recovery evidence pending. Supabase project: `yzuuutynqfpbiozlrfmy`; live engine PostgreSQL 17.11, confirmed read-only on 21 October. No separate staging project is required.

## Recovery package

Use a private access-controlled destination outside this public Git checkout. Establish an encrypted off-site location, named recovery owner/backup and a recoverable key custody method before accepting a backup. A local file or a schema inventory alone cannot close the gate.

Capture database schema/data/roles and required grants/functions/policies using a PostgreSQL client compatible with the live major version and the current Supabase export procedure. Include required Auth data; account for platform-managed schemas and extensions in the restore target. Keep credentials in secure local tooling, never command arguments, logs, repository files or chat. Avoid direct OS/server-file SQL access.

Database backups contain Storage metadata, not uploaded file bytes. Export actual private bucket objects through the supported Storage API with an authorized server-side identity. Capture bucket configuration/policies plus a private object-path, size and SHA-256 manifest. Paginate listings, check download failures, compare totals and hash every downloaded object. Do not place private object paths or Auth/password hashes in this repository.

Coordinate a maintenance/write-hold window or an explicitly reviewed consistency procedure across database and Storage capture. Record the cutoff and any in-flight upload handling. Encrypt both exports, verify ciphertext checksum, confirm a second off-site copy and test authorized decryption. A service-role key is not a database backup credential and is never browser-safe.

## Restore acceptance

1. Restore to an isolated disposable target with tightly limited access, no outbound notifications, no production callback URLs and no deployment connections. A restore containing real data must never go to public CI/artifacts or a shared development database.
2. Record backup/cutoff, schema revision, start/end IST, elapsed recovery time and errors. Restore required roles, extensions, grants, Auth records and Storage object bytes using provider-compatible steps. Check dependencies before accepting the restore.
3. Compare table/row counts privately, constraints, indexes, triggers, RLS and grants. Verify encrypted-file and object hashes. Check candidate isolation, consent withdrawal, private bucket access and restored account lifecycle using designated synthetic records; never expose restored real user data in test reports.
4. Apply the deletion-suppression/correction record and reconcile financial retention before any restored access can reopen. Verify deleted accounts/files do not return to active use.
5. Record actual recovery-point age and measured restore duration. Proposed first-cohort objectives: RPO at most 24 hours, RTO at most 4 hours; owner must accept or replace these after measuring. Keep intake held if those objectives cannot be supported.
6. Destroy the disposable restore according to the approved private-data handling procedure and record confirmation. Do not delete the only recoverable backup/key.

## Baseline and migration review

The local metadata inventory is a read-only starting point, not a full dump. Repository migration replay on an empty database does not establish the live baseline. Duplicate prefixes 0010, 0011 and 0012 must not be presented as a reliable remote history.

Build a reviewed comparison for every live/release table, column/type/default, constraint, index, trigger, function/search_path, grant, RLS policy, bucket and Auth dependency. Identify live-only objects and preserve them until reviewed. Check existing data for required-field, uniqueness and foreign-key compatibility without printing rows. Record whether each legacy migration's effects are absent, partial, equivalent or conflicting; do not merely mark every version applied.

Prepare an explicit forward delta with live preconditions, approved transformations, lock/time budgets and postconditions. Validate it against the private restored baseline and run the permission/lifecycle tests there. Only then establish canonical history under a reviewed reconciliation plan. No blind `db push`, mass legacy replay or unreviewed `migration repair` against Production.

## Security gate

Deploy reviewed helper/trigger privilege fixes as part of that delta; recheck both anon and authenticated execution and expected signup/role checks. Re-run advisors. The owner chose Supabase Free; [leaked-password protection](https://supabase.com/docs/guides/auth/password-security) requires Pro or above, so this security gate remains open. No plan upgrade or security exception is implicitly approved by development authorization.

Confirm production Auth URL/redirect allowlist, email confirmation/recovery delivery, private staff entry, suspension checks, secret scoping and canonical HTTPS `NEXT_PUBLIC_SITE_URL`. Record settings/evidence without recording secret values. Preview uses the same database: no preview write testing.

## Direct release record

Release owner records reviewed app SHA/tree, schema delta/checksums, current passing CI for that head, approved backup/restore reference, accepted operations/UAT, maintenance window, previous application version, monitoring contact and rollback decision maker. Re-run required checks after any later source change; CI #276 is evidence for its recorded commit only.

Keep intake held. Apply reviewed schema changes, deploy that exact application version and verify read-only health, auth redirects, role boundaries, bucket privacy and advisor results. Any write smoke requires specifically designated synthetic production accounts and a cleanup plan. Enable `ENABLE_CANDIDATE_ACCOUNT_ERASURE` only after deployed migrations, support/retention acceptance and successful deletion/retry checks. Record cleanup.

On a critical failure hold intake, restrict affected workflow and revert application to the recorded version if compatible. Prefer a reviewed forward schema repair. Destructive restoration needs explicit recovery-owner decision and a documented data-loss window; application rollback does not undo data changes. Never replay a full backup over live users as an automatic rollback.

First-cohort approval records product list, maximum invited users, selection, dates/support coverage, accountable founder and stop conditions. Proposed initial cap: five candidates and two employers after internal acceptance; this is not an invitation authorization. Any privacy/consent failure, failed deletion, broken core journey or unstaffed support pauses expansion. Public release remains held separately.

## Recovery evidence record

### Completed snapshot drill — 22 October 2026, 01:20 IST

✅ Encrypted private off-site copy, downloaded-copy hash/decryption/archive checks, printed separate key custody and supported hosted logical recovery DONE for the 21 October 20:20 IST snapshot. All 41 recovered table counts/row digests, application schema/grants, Auth/Storage service reads and synthetic candidate/anonymous boundaries passed. The isolated $0 recovery project was deleted; original Production remained healthy and unchanged. See `production-backup-recovery-evidence.md` for provider-managed exclusions and measured scope. A recurring backup schedule, future nonempty Vault/MFA/Storage recovery and final release acceptance are not claimed by this drill. The earlier paragraph below is retained as historical evidence and is superseded for current off-site/drill status.

Package reference / source project and engine / consistency cutoff IST / encrypted destination reference / encryption and recoverable key custodian / database and object checksums / restore target access controls / counts and permission checks / measured RPO-RTO / deletion suppression result / restore teardown / operator / accountable owner acceptance / actual IST timestamps.

Current evidence: the founder explicitly approved a full sensitive database export to a restricted local folder outside Git. A PostgreSQL 17.11 custom-format export succeeded at 21 October 2026, 20:20 IST. Scoped application/Auth/Storage/extension restore succeeded at 20:26 IST; restored/live aggregate counts and public policy/grant metadata matched. All 34 later migrations and post-delta security assertions passed on a separate restored clone. See `production-baseline-reconciliation.md` for exclusions. An additional Windows-account-bound DPAPI encrypted copy passed decryption/hash verification; the restricted plaintext original and offline restore files remain local. DPAPI is not independently portable if the Windows profile/key is lost. A read-only Storage check found zero buckets and objects; recheck before release. The founder has no off-site destination yet, so portable encryption/key custody, off-site copy and full measured recovery remain open. See [Supabase backup guidance](https://supabase.com/docs/guides/platform/backups).
