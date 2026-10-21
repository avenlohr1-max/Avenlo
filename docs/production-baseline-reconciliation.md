# Production baseline reconciliation evidence

Updated: 22 October 2026, 01:22 IST. Status: ✅ read-only comparison and local restored-baseline forward-delta validation DONE; live history reconciliation/application pending. Public rollout held.

## Source and safety boundary

Source project `yzuuutynqfpbiozlrfmy`, PostgreSQL 17.11. The founder authenticated owner CLI tooling and explicitly approved the full sensitive database export to a Windows-user/SYSTEM-only local recovery folder outside Git. Read-only export completed at 20:20 IST on 21 October. A custom-format archive index is readable. No credentials, user records, Auth hashes, private object paths or backup bytes belong in this public repository.

Read-only Storage metadata checks found zero buckets and zero objects at this checkpoint. Recheck before release and capture bytes if that changes. There is no encrypted off-site copy yet. This evidence does not close the full recovery gate.

## Live versus repository initial schema

A separate offline synthetic reference database was built from repository `0001_initial_schema.sql`, with a minimal Auth dependency for its foreign key/function definitions. Its application metadata was compared with live metadata on 21 October.

| Area | Result |
|---|---|
| Public columns, types, nullability, defaults and identity | Match |
| Public enum labels/order | Match |
| Public indexes | Match |
| Public constraints | Match |
| Public policy definitions/roles | Match |
| Public trigger definitions | Match |
| Public RLS/forced-RLS flags | Match |
| Three application functions: signature, language, volatility, definer, search_path and body | Match after whitespace normalization |

This establishes observed effects consistent with the initial application schema; it does not prove how or when a migration was applied. Platform-managed schemas and default grants are not attributed to migration 0001. Auth trigger provenance, global role memberships, provider extensions/configuration, Storage service behavior and full platform recovery need their separate checks. Do not infer complete provider equivalence from this application-schema comparison.

## Scoped restore verification

The archive was restored to a PostgreSQL 17.11 instance bound only to loopback, with random SCRAM credentials, private logs and no Supabase notification/API services. Public, Auth, Storage and extensions schemas were included; platform services and Vault were excluded. The restore completed successfully at 20:26 IST; the server was stopped afterward.

Restored versus live comparisons matched: counts for all seven public tables plus Auth users/identities and Storage buckets/objects; seven public tables with RLS; public/Storage policy count; public constraints and trigger counts; public-table grant count for anon/authenticated/service_role; and full public policy definitions. No record contents were printed. This is scoped archive validation, not a measured full-platform RTO or an isolated Supabase application recovery.

## Forward delta trial

Application source: `2c952006b8ad88dd6dce252c4eb3c4ddc30a178a`, PR #12. A separate local database cloned from the restored baseline received all 34 SQL migration files after `0001_initial_schema.sql`, in the same lexicographic order used by verified CI. All 34 succeeded against the captured baseline data. Existing baseline/reference databases were preserved. The local server was stopped after validation.

Postconditions passed: suite relations present, existing candidate sharing remains false, direct anon/authenticated execution of public role/registration helpers denied, private proof source-ID column denied to authenticated clients, RLS enabled on every public table, obsolete permissive application policies absent and no public Storage buckets. These local checks supplement CI #276's full synthetic permission/lifecycle suites; they are not live security remediation.

## Remaining release controls

1. ✅ Snapshot off-site backup/key custody and hosted logical recovery drill DONE on 22 October; see `production-backup-recovery-evidence.md` for verified scope, timings and exclusions. Define a fresh consistent write cutoff, refresh the backup and recheck data drift before live changes; recurring backup operations remain to establish.
2. Capture/verify Auth trigger and relevant role memberships; review platform/default grants. Reconcile missing remote history and repeated 0010/0011/0012 prefixes under an explicit canonical plan. Do not claim every historical migration has run and do not rename potentially applied files.
3. Freeze/review exact forward-delta checksums and preconditions; revalidate if source or live schema/data changes. The local review manifest is not an authorized automated apply bundle.
4. Resolve the security release gate. The founder chose Free, on which leaked-password protection is unavailable; no upgrade or waiver is approved.
5. Complete retention, user acceptance, operations and controlled release records before public/cohort access. Production erasure stays disabled.

No live DDL, data mutation, migration-history repair, Auth setting change, main merge or application deployment was performed for this evidence.
