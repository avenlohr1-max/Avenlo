# Environment and database migration runbook

**Status:** Verified engineering facts and outstanding release controls as of 20 October 2026.

## Environment map

| Environment | Verified behavior | Required control |
| --- | --- | --- |
| Local development | The app reads local environment values such as `.env.local`; these files must stay out of Git. | Use a non-production Supabase project for local schema work. |
| GitHub pull request CI | Build variables are explicit placeholders. The enhanced verification workflow in PR #4 uses disposable PostgreSQL 16, applies migration scripts in filename order, and runs lint, typecheck, unit tests, build, E2E smoke tests, and RLS checks. PR #4's latest verification passed. | Keep production credentials out of CI build steps. Run checks against the exact release candidate. |
| Vercel preview | GitHub PRs produce Vercel preview deployments; previews have been observed as Ready. | The Supabase URL configured for Preview has not been independently verified. Confirm it points to a non-production project before using real candidate data. |
| Staging | No separate Avenlo staging Supabase project or automated migration deployment workflow has been confirmed. | Set up a separate staging project and document its project ref and secret ownership before staging migration rehearsal. |
| Production | The repository describes Vercel plus Supabase as the intended production path. The exact Vercel environment-to-Supabase project mapping and production migration procedure have not been verified. | Confirm the production Supabase ref, Vercel environment mapping, backup/restore procedure, and release owner before deployment. |

## Current Supabase connection findings

The Supabase connection exposes one active project, `supabase-apricot-battery`, ref `yzuuutynqfpbiozlrfmy`, in ap-south-1. Read-only inspection found Avenlo's core public tables: profiles, candidate_profiles, candidate_skills, companies, jobs, and applications. The project therefore contains Avenlo's application schema.

The database has no `supabase_migrations` schema or recorded migration history available through the Supabase migration listing. The application schema may have been created outside the repository's migration history. This connection is likely Avenlo's app database, but the Vercel environment mapping is not exposed in the connected tools and remains to be confirmed.

No migration was applied during this review.

## Migration system facts

- The current repository uses numbered SQL files in `supabase/migrations`, including repeated prefixes such as `0010`, `0011`, and `0012`, plus a gap at `0014`.
- The verification workflow applies these scripts directly in lexicographic filename order to a disposable PostgreSQL database. It does not use the Supabase CLI migration tracker.
- PR #4 adds the forward applicant-resume policy correction as `0022_company_applicant_resume_policy_qualification.sql`.
- PR #6 adds candidate-controlled Talent Record sharing as `0023_candidate_talent_record_sharing.sql`.
- A clean-database CI run verifies that the repository scripts replay. It does not reconcile those scripts with the existing connected Supabase database or prove which scripts were previously applied there.

## Safe database release sequence

1. Confirm the Vercel Production and Preview Supabase project refs without exposing key values.
2. Create or identify a separate staging Supabase project.
3. Capture the existing app schema and compare it with the repository using the Supabase CLI from a local project checkout. Establish a baseline for the existing database before enabling CLI pushes; do not rename migrations that may already be applied.
4. Rehearse the forward migrations against staging, then inspect the resulting schema, RLS policies, and application flows.
5. Back up production and confirm a rollback plan.
6. Apply reviewed migrations to production through a controlled release process, then verify the expected policies and app behavior.

Until steps 1–4 are complete, do not run `supabase db push`, `migration repair`, or an ad hoc schema change against the connected project. The current absence of migration history makes that unsafe to automate.

## Release checks

For each release candidate, confirm:

- dependency audit and credential scan pass;
- lint, typecheck, unit tests, production build, and E2E checks pass;
- every migration replays against a clean disposable database;
- RLS regression checks pass with candidate consent both enabled and disabled;
- Vercel Preview is Ready and uses the intended non-production Supabase project;
- staging migrations and end-to-end flows pass before a production release decision.
