# Environment and database migration runbook

**Status:** Verified engineering facts and outstanding release controls as of 20 October 2026.

## Environment map

| Environment | Verified behavior | Required control |
| --- | --- | --- |
| Local development | The app reads local environment values such as `.env.local`; these files must stay out of Git. | Use a non-production Supabase project for local schema work. |
| GitHub pull request CI | Build variables are explicit placeholders. The Phase 0 verification workflow in PR #7 uses disposable PostgreSQL 16, applies migration scripts in filename order, and runs lint, typecheck, unit tests, build, E2E smoke tests, and RLS checks. PR #4's latest verification also passed. | Keep production credentials out of CI build steps. Run checks against the exact release candidate. |
| Vercel preview | GitHub PRs produce Vercel preview deployments; previews have been observed as Ready. | The Supabase URL configured for Preview has not been independently verified. Confirm it points to a non-production project before using real candidate data. |
| Staging | Not required in the current plan. Development uses local configuration and disposable CI databases with synthetic data. | Keep real candidate and employer data out of development tests; ensure Vercel Preview does not expose production data. |
| Production | The repository describes Vercel plus Supabase as the intended production path. The exact Vercel environment-to-Supabase project mapping and production migration procedure have not been verified. | Confirm the production Supabase ref, Vercel environment mapping, backup/restore procedure, and release owner before deployment. |

## Current Supabase connection findings

The Supabase connection exposes one active project, `supabase-apricot-battery`, ref `yzuuutynqfpbiozlrfmy`, in ap-south-1. Read-only inspection found Avenlo's core public tables: profiles, candidate_profiles, candidate_skills, companies, jobs, and applications. The project therefore contains Avenlo's application schema.

The database has no `supabase_migrations` schema or recorded migration history available through the Supabase migration listing. The application schema may have been created outside the repository's migration history. The founder confirmed this connected project is Avenlo's Supabase project. The exact Vercel Production and Preview environment mapping to this project remains to be confirmed.

No migration was applied during this review.

## Migration system facts

- The current repository uses numbered SQL files in `supabase/migrations`, including repeated prefixes such as `0010`, `0011`, and `0012`, plus a gap at `0014`.
- The verification workflow applies these scripts directly in lexicographic filename order to a disposable PostgreSQL database. It does not use the Supabase CLI migration tracker.
- PR #4 adds the forward applicant-resume policy correction as `0022_company_applicant_resume_policy_qualification.sql`.
- PR #6 adds candidate-controlled Talent Record sharing as `0023_candidate_talent_record_sharing.sql`.
- A clean-database CI run verifies that the repository scripts replay. It does not reconcile those scripts with the existing connected Supabase database or prove which scripts were previously applied there.

## Direct-to-production release sequence

1. Confirm which Vercel environment is connected to the Avenlo Supabase project; do not expose key values.
2. Capture the existing production schema read-only and compare it with the repository using the Supabase CLI from a local project checkout. Establish a baseline before enabling automated migration tracking; do not rename migrations that may already have been applied.
3. Validate each change in local development and disposable CI PostgreSQL using synthetic data, including RLS and resume-access regressions.
4. Before a production database change, take a verified backup and define the rollback or forward-repair procedure.
5. Deploy reviewed changes and migrations to production through a controlled release step, then verify policies and app behavior against that exact release.
6. Keep public access and cohort rollout paused until the product owner explicitly opens them.

Until steps 1–4 are complete, do not run `supabase db push`, `migration repair`, or an ad hoc schema change against the connected project. The current absence of migration history makes an automated production push unsafe. A separate staging project is intentionally excluded from this release plan.

## Release checks

For each release candidate, confirm:

- dependency audit and credential scan pass;
- lint, typecheck, unit tests, production build, and E2E checks pass;
- every migration replays against a clean disposable database;
- RLS regression checks pass with candidate consent both enabled and disabled;
- Vercel Preview is Ready and uses the intended non-production Supabase project;
- local and disposable CI tests pass before a direct production release decision;
- the production schema baseline, backup, and rollback procedure are verified;
- public rollout remains paused until separately approved.
