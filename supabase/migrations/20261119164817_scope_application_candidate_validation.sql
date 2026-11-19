-- Candidate identity is validated when an application is created or when that
-- identity column is targeted. Revalidating it on a status-only update asks an
-- employer's invoker-context lookup to read a deliberately private profile.
-- The separate immutable-identity guards and all RLS policies remain in force.
-- No privileged function, profile disclosure or new grant is introduced.
drop trigger if exists applications_validate_candidate_role on public.applications;
create trigger applications_validate_candidate_role
before insert or update of candidate_id on public.applications
for each row execute function public.validate_application_candidate_role();
