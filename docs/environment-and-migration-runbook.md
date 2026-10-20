# Environment and database migration runbook

**Status:** Verified engineering facts and outstanding release controls as of 20 October 2026.

## Environment map

| Environment | Verified behavior | Required control |
| --- | --- | --- |
| Local development | Use the local Supabase stack and local environment values such as `.env.local`; keep secrets out of Git. | Use synthetic data and never point local development at production. |
| GitHub pull request CI | The Phase 0 workflow uses disposable PostgreSQL 16, applies repository migration scripts in filename order, and runs dependency audit, credential scan, lint, typecheck, unit tests, build, E2E smoke tests, and RLS checks. Latest completed Phase 0 run #229 passed. | Keep production credentials out of CI. Run checks against the exact release candidate. |
| Vercel Preview | The founder confirmed Preview uses the same Supabase project ref as Production: `yzuuutynqfpbiozlrfmy`. Preview is therefore connected to the production database. | Treat Preview as production-data access. Do not test writes, migrations, or real candidate/employer journeys in Preview. Use local development and disposable CI for write testing. |
| Separate staging | Not part of the approved plan. Development uses the local stack and disposable CI databases with synthetic data. | Keep real candidate and employer data out of development and CI. |
| Production | The founder confirmed Production uses Supabase project ref `yzuuutynqfpbiozlrfmy`, project `supabase-apricot-battery`, in ap-south-1. | Any Preview code can reach the production database. Confirm production backup/restore, migration baseline, and release owner before a production database change. |

## Current Supabase connection findings

The connected project is Avenlo's Supabase project and is the configured target for both Vercel Production and Preview. Read-only inspection found Avenlo's core public tables: profiles, candidate_profiles, candidate_skills, companies, jobs, and applications.

The project has no recorded migration history available through the Supabase migration listing, and there is no `supabase_migrations` schema. The remote `candidate_profiles` table does not have the `share_with_applicant_companies` column from PR #6 migration 0023. The applicant profile policies from migration 0016 are also absent. The live schema therefore does not match the current repository migration state; the baseline must be captured and reconciled before any push.

A read-only Supabase security-advisor check reported that `public.current_user_role()` and `public.handle_new_user()` are SECURITY DEFINER functions executable by both `anon` and `authenticated`, and that leaked-password protection is disabled. Inspection showed `current_user_role()` returns the role associated with the caller's own profile, while `handle_new_user()` inserts a profile for the auth user trigger. Review function grants and harden search paths in a migration after replaying it in CI; do not revoke access blindly because RLS policies depend on `current_user_role()`. Enable leaked-password protection after reviewing the Auth impact. No migration or setting change was applied during this review.

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
