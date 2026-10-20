-- Audit candidate changes to Talent Record sharing consent.
-- Consent withdrawal is enforced immediately by the applicant access policies.
create table if not exists public.candidate_sharing_events (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  previous_value boolean not null,
  new_value boolean not null,
  actor_id uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now()
);

create index if not exists candidate_sharing_events_candidate_changed_idx
  on public.candidate_sharing_events (candidate_id, changed_at desc);

alter table public.candidate_sharing_events enable row level security;
revoke all on public.candidate_sharing_events from anon, authenticated;
grant select on public.candidate_sharing_events to authenticated;

drop policy if exists "candidates read own sharing events" on public.candidate_sharing_events;
create policy "candidates read own sharing events"
on public.candidate_sharing_events
for select to authenticated
using (candidate_id = (select auth.uid()));

create or replace function public.record_candidate_sharing_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.share_with_applicant_companies is distinct from new.share_with_applicant_companies then
    insert into public.candidate_sharing_events
      (candidate_id, previous_value, new_value, actor_id)
    values (new.user_id, old.share_with_applicant_companies, new.share_with_applicant_companies, (select auth.uid()));
  end if;
  return new;
end;
$$;

revoke all on function public.record_candidate_sharing_event() from public, anon, authenticated;

drop trigger if exists candidate_profiles_record_sharing_event on public.candidate_profiles;
create trigger candidate_profiles_record_sharing_event
after update of share_with_applicant_companies on public.candidate_profiles
for each row execute function public.record_candidate_sharing_event();
