-- Preserve the private role helper used by the deployed policies.
-- The public compatibility wrapper is intentionally not callable by users.
alter policy "candidates manage own candidate profile"
on public.candidate_profiles
with check (
  user_id = (select auth.uid())
  and (select private.current_user_role()) = 'candidate'
  and (
    resume_path is null
    or pg_catalog.strpos(resume_path, (select auth.uid())::text || '/') = 1
  )
);
