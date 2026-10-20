# Environment and database migration runbook

**Status:** Verified engineering facts and outstanding release controls as of 20 October 2026.

## Environment map

| Environment | Verified behavior | Required control |
| --- | --- | --- |
| Local development | Use the local Supabase stack and local environment values such as `.env.local`; keep secrets out of Git. | Use synthetic data and never point local development at production. |
| GitHub pull request CI | The Phase 0 workflow uses disposable PostgreSQL 16, applies repository migration scripts in filename order, and runs dependency audit, credential scan, lint, typecheck, unit tests, build, E2E smoke tests, and RLS checks. Latest Phase 0 run #227 passed. | Keep production credentials out of CI. Run checks against the exact release candidate. |
| Vercel Preview | GitHub pull requests produce Preview deployments; previews have been observed as Ready. | The Supabase project configured for Preview has not been independently verified. Do not use real candidate data in Preview until the mapping and data exposure are confirmed. |
| Separate staging | Not part of the approved plan. Development uses the local stack and disposable CI databases with synthetic data. | Keep real candidate and employer data out of development and CI. |
| Production | The repository describes Vercel plus Supabase as the intended production path. The exact Vercel environment-to-Supabase project mapping and production migration procedure remain unverified. | Confirm the production Supabase ref, Vercel environment mapping, backup/restore procedure, and release owner before any production deployment. |

## Current Supabase connection findings

The Supabase connection exposes one active project, `supabase-apricot-battery`, ref `yzuuutynqfpbiozlrfmy`, in ap-south-1. Read-only inspection found Avenlo's core public tables: profiles, candidate_profiles, candidate_skills, companies, jobs, and applications. The project contains Avenlo's application schema, and the founder confirmed it is Avenlo's Supabase project.

The project has no recorded migration history available through the Supabase migration listing. The existing application schema may have been created outside the repository's migration history. The exact mapping from Vercel Production and Preview to this Supabase project remains unconfirmed.

No migration was applied during this review.

## Migration system facts

- The repository uses numbered SQL files in `supabase/migrations`, including repeated prefixes such as `0010`, `0011`, and `0012`, plus a gap at `0014`.
- CI applies the scripts directly in lexicographic filename order to disposable PostgreSQL. It does not prove which scripts were applied to the connected Supabase project.
- PR #4 adds the forward applicant-resume policy correction as `0022_company_applicant_resume_policy_qualification.sql`.
- PR #6 adds candidate-controlled Talent Record sharing as `0023_candidate_talent_record_sharing.sql`.
- A clean-database CI replay verifies repository reproducibility, not equivalence with the existing remote schema.

## Direct-to-production release sequence

1. Confirm which Vercel environment is connected to the Avenlo Supabase project, without exposing key values.
2. Capture the existing production schema read-only and compare it with the repository. Establish a reviewed baseline before enabling automated migration tracking; do not rename migrations that may already have been applied.
3. Validate changes in the local stack and disposable CI PostgreSQL with synthetic data, including RLS and resume-access regressions.
4. Before a production database change, take and verify a backup and define a rollback or forward-repair procedure.
5. Deploy the reviewed application and database changes through a controlled production release step; verify policies and app behavior against that release.
6. Keep public access and cohort rollout paused until the product owner explicitly opens them.

Until steps 1–4 are complete, do not run `supabase db push`, `migration repair`, or ad hoc schema changes against the connected project. The missing migration history makes an automated production push unsafe. No separate staging project is required by this plan.

## Release checks

For each release candidate, confirm:

- dependency audit and credential scan pass;
- lint, typecheck, unit tests, production build, and E2E checks pass;
- every migration replays against a clean disposable database;
- RLS regression checks pass with candidate sharing enabled and disabled;
- Vercel Preview behavior and its Supabase project mapping are understood before real data is used;
- the production schema baseline, backup, and rollback procedure are verified before a production database change;
- public rollout remains paused until separately approved.
