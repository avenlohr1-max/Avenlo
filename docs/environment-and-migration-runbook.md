# Environment and database migration runbook

**Updated:** 22 October 2026, 18:17 IST (UTC+05:30)
**Status:** Verified engineering facts and outstanding release controls.

## Current execution status

✅ Canonical reconciliation and the reviewed Production database upgrade have executed. `supabase/migration-map.json` preserves original scripts in the archive and maps the canonical timestamp sequence. The initial equivalent entry was adopted, 34 forward files executed and a further function-access fix applied. Live readback: 36 history entries, 33 public tables with RLS and no browser-callable public SECURITY DEFINER functions. CI #280 passed the exact application/security candidate. See `production-upgrade-evidence.md` for preflight, data preservation, fresh backups and remaining controls.

The password minimum is now eight, matching the forms. Auth site URL still points to localhost; verified Production origin/callback and email-delivery checks remain. Resend SMTP is configured. Free-plan leaked-password protection remains an open gate. Application deployment, erasure enablement and operational/user acceptance have not occurred. Previous dated sections below are historical observations, not instructions to replay already-applied migrations. Future changes must use new timestamp migrations and a fresh preflight; never push the preserved legacy archive.

## Environment map

### Closure progress — 21 October 2026, 20:36 IST

Secure owner CLI authentication and local linking are now verified. The explicitly approved restricted local full database export succeeded; scoped application/Auth/Storage restore and aggregate metadata verification passed. The observed application schema matches initial migration 0001 in the recorded comparison areas. All 34 later migration files and post-delta security assertions passed on a separate local restored clone. See `production-baseline-reconciliation.md` for scope and exclusions.

The local encrypted copy is Windows-account-bound; no independent encrypted off-site destination or full platform recovery is verified. The founder chose Free, so leaked-password protection remains unavailable and that security gate stays open. Remote history still needs canonical reconciliation; no Production migration/history repair, deployment or settings change occurred. Earlier observations below are retained as history; current evidence is in the linked closure records.

| Environment | Verified behavior | Required control |
| --- | --- | --- |
| Local development | Use the local Supabase stack and local environment values such as `.env.local`; keep secrets out of Git. | Use synthetic data and never point local development at production. |
| GitHub pull request CI | The Phase 0 workflow uses disposable PostgreSQL 16, applies repository migration scripts in filename order, and runs dependency audit, credential scan, lint, typecheck, unit tests, build, E2E smoke tests, and RLS checks. Latest completed Phase 0 run #261 passed the full migration replay and RLS suite, including function-grant hardening. | Keep production credentials out of CI. Run checks against the exact release candidate. |
| Vercel Preview | The founder confirmed Preview uses the same Supabase project ref as Production: `yzuuutynqfpbiozlrfmy`. Preview is therefore connected to the production database. | Treat Preview as production-data access. Do not test writes, migrations, or real candidate/employer journeys in Preview. Use local development and disposable CI for write testing. |
| Separate staging | Not part of the approved plan. Development uses the local stack and disposable CI databases with synthetic data. | Keep real candidate and employer data out of development and CI. |
| Production | The founder confirmed Production uses Supabase project ref `yzuuutynqfpbiozlrfmy`, project `supabase-apricot-battery`, in ap-south-1. | Any Preview code can reach the production database. Confirm production backup/restore, migration baseline, and release owner before a production database change. |

## Current Supabase connection findings

The connected project is Avenlo's Supabase project and is the configured target for both Vercel Production and Preview. Read-only inspection found Avenlo's core public tables: profiles, candidate_profiles, candidate_skills, companies, jobs, and applications.

The project has no recorded migration history available through the Supabase migration listing, and there is no `supabase_migrations` schema. The remote `candidate_profiles` table does not have the `share_with_applicant_companies` column from PR #6 migration 0023. The applicant profile policies from migration 0016 are also absent. The live schema therefore does not match the current repository migration state; the baseline must be captured and reconciled before any push. The Avenlo Supabase organization is on the Free plan. Supabase does not provide automatic backups on Free, so a verified off-site logical export or an explicitly approved plan upgrade is required before production schema changes (see [Supabase backup guidance](https://supabase.com/docs/guides/platform/backups)).

A read-only Supabase security-advisor check reported that `public.current_user_role()` and `public.handle_new_user()` are SECURITY DEFINER functions executable by both `anon` and `authenticated`, and that leaked-password protection is disabled. Phase 0 PR #7 now contains migration `0027_phase0_security_hardening.sql`: it moves the role helper into a non-API `private` schema, rewrites dependent policies, removes direct execution from public trigger helpers, and retains trigger behavior. CI run #261 passed migration replay and RLS assertions for these changes. The migration has not been applied to Production, so the current advisor findings remain until the schema baseline is reconciled and the migration is deployed. Leaked-password protection still needs to be enabled by an authenticated project owner; it is a Supabase Auth dashboard setting.

## Migration system facts

- The repository uses numbered SQL files in `supabase/migrations`, including repeated prefixes such as `0010`, `0011`, and `0012`, plus a gap at `0014`.
- CI applies the scripts directly in lexicographic filename order to disposable PostgreSQL. It does not prove which scripts were applied to the connected Supabase project.
- PR #4 adds the forward applicant-resume policy correction as `0022_company_applicant_resume_policy_qualification.sql`.
- PR #6 adds candidate-controlled Talent Record sharing as `0023_candidate_talent_record_sharing.sql`.
- A clean-database CI replay verifies repository reproducibility, not equivalence with the existing remote schema.

## Direct-to-production release sequence

1. Keep Vercel Preview from performing database writes while it shares the Production project. Use the local stack and disposable CI for write and migration tests.
2. Capture the existing production schema read-only and compare it with the repository. Establish a reviewed baseline before enabling automated migration tracking; do not rename migrations that may already have been applied.
3. Review and resolve the database security-advisor findings and verify Auth password protection settings.
4. Validate changes in the local stack and disposable CI PostgreSQL with synthetic data, including RLS and resume-access regressions.
5. Before a production database change, take and verify a backup and define a rollback or forward-repair procedure.
6. Deploy the reviewed application and database changes through a controlled production release step; verify policies and app behavior against that release.
7. Keep public access and cohort rollout paused until the product owner explicitly opens them.

Until steps 1–5 are complete, do not run `supabase db push`, `migration repair`, or ad hoc schema changes against the connected project. The missing migration history and observed schema drift make an automated production push unsafe. No separate staging project is required by this plan.

## Release checks

For each release candidate, confirm:

- dependency audit and credential scan pass;
- lint, typecheck, unit tests, production build, and E2E checks pass;
- every migration replays against a clean disposable database;
- RLS regression checks pass with candidate sharing enabled and disabled;
- Vercel Preview is treated as connected to Production and does not perform writes or use real-data test journeys;
- the production schema baseline, security-advisor remediations, backup, and rollback procedure are verified before a production database change;
- public rollout remains paused until separately approved.
