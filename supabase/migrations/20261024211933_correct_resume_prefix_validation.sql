-- PostgreSQL's internal position(text,text) takes the haystack first.
-- Keep the owner checks and use the explicit strpos(haystack, needle) API.
alter policy "candidates manage own candidate profile"
on public.candidate_profiles
with check (
  user_id = (select auth.uid())
  and public.current_user_role() = 'candidate'
  and (
    resume_path is null
    or pg_catalog.strpos(resume_path, (select auth.uid())::text || '/') = 1
  )
);

create or replace function public.protect_resume_path()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.resume_path is not null
     and pg_catalog.strpos(new.resume_path, new.user_id::text || '/') <> 1 then
    raise exception 'resume_path must belong to candidate storage folder';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_resume_path() from public, anon, authenticated;
