# Canonical database migration history

Updated: 22 October 2026, 18:17 IST. Status: ✅ canonical Production adoption and execution verified; remaining application/Auth/operational acceptance gates stay open.

Live execution: the initial mapped version was adopted after equivalence checks, the 34 subsequent mapped files actually executed, and the additional `production_function_access_controls` migration applied. There are now 36 live entries; the mapped historical prefix remains 35 entries and future files follow it. Readback and original-row preservation are recorded in `production-upgrade-evidence.md`. This does not assert application deployment or user acceptance.

## Why the filenames changed

The original 35 SQL files used repeated versions 0010, 0011 and 0012. Their original names and SQL are preserved in `supabase/legacy-migrations`. The canonical `supabase/migrations` files were individually generated with `supabase migration new`, then populated with the corresponding original SQL without changing execution order. `supabase/migration-map.json` records the relationship and SHA-256 after Git newline normalization. CI verifies both histories and applies only canonical migrations.

Do not replay the archived directory against Production. Do not merge another branch that restores old files into the active migration directory. Every future change needs a new CLI-generated migration.

## Adoption of this existing database

Production was observed to have the initial application schema and no Supabase migration ledger. Its eight recorded schema comparison areas and Auth registration trigger must still match the initial reference at the live preflight. Only then may the first canonical initial-schema entry be recorded as **adopted** using migration repair. This is an explicit baseline assertion; it does not claim the new filename or an unproven historical command was executed.

The remaining 34 entries must actually execute in their canonical order. Each is its own transaction: `pending_review` is an added enum value and must commit before later SQL uses it. An aggregate single-transaction concatenation is unsafe. Live application must require a fresh verified backup, expected schema/history, the frozen checksums, bounded lock waits and a forward-repair plan.

## Verification and failure handling

1. Run `node scripts/verify-migration-map.mjs`.
2. Run each canonical file on a clean disposable database and run the permission/lifecycle suites. Repeat the 34-file forward upgrade on a private restored baseline, with one transaction per file.
3. Compare a fresh live schema to the recorded initial reference. Confirm Storage scope, backup consistency and the target project reference. Preserve the previous backup and key.
4. Review a dry-run before applying. Record the baseline adoption separately from the 34 executed migrations.
5. Stop on any failed migration. Do not falsely record it as applied or rerun the whole history. Inspect actual history/schema and produce a forward repair. Never automatically restore over Production; restored access requires deletion reconciliation.
6. Verify table/column/role/RLS/function/Storage postconditions, original-row preservation, advisors and history readback. Keep public release held while security, policy, operational or participant acceptance gates remain open.

Future `supabase db push` uses only the canonical directory after adoption. Legacy environment histories must be reconciled separately; this map is not permission to repair an unrelated project.

## Recorded private trial — 22 October 2026, 01:39 IST

✅ All 35 canonical migrations passed on a clean disposable PostgreSQL 17 database, each in a separate transaction. ✅ All 34 forward migrations passed on a private clone of the approved Production archive. Canonical JSON row digests/counts across every original column of all seven original public tables matched before and after that upgrade. The five SQL permission/lifecycle suites passed on synthetic data, and the restored clone passed suite-presence, default-sharing, RLS, function-execution, private proof-column and bucket-privacy assertions. A fresh live eight-area initial-schema comparison also matched the reference.

These are verified preflight results, not a claim that the Production upgrade, user acceptance or application deployment has occurred. Private source records and raw verification output remain outside Git.
