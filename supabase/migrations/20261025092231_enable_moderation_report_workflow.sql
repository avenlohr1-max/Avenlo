create table public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('job','candidate','company','application')),
  target_id uuid not null,
  reason text not null check (char_length(btrim(reason)) between 10 and 2000),
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.moderation_reports enable row level security;
create index moderation_reports_reporter_idx on public.moderation_reports(reporter_id,created_at desc);
create index moderation_reports_queue_idx on public.moderation_reports(status,created_at desc);
create unique index moderation_reports_one_open_target_idx
  on public.moderation_reports(reporter_id,target_type,target_id)
  where status in ('open','reviewing');

revoke all on public.moderation_reports from anon,authenticated;
grant select,insert on public.moderation_reports to authenticated;
grant update(status) on public.moderation_reports to authenticated;
grant all on public.moderation_reports to service_role;

create policy "reporters and staff read reports" on public.moderation_reports
for select to authenticated using (
  reporter_id = (select auth.uid())
  or (select private.current_user_role()) in ('staff','founder')
);
create policy "users report visible targets" on public.moderation_reports
for insert to authenticated with check (
  reporter_id = (select auth.uid()) and status = 'open'
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.status::text <> 'suspended')
  and (
    (target_type = 'job' and exists (select 1 from public.jobs j where j.id = target_id))
    or (target_type = 'candidate' and exists (select 1 from public.profiles p where p.id = target_id and p.role = 'candidate'))
    or (target_type = 'company' and exists (select 1 from public.companies c where c.id = target_id))
    or (target_type = 'application' and exists (select 1 from public.applications a where a.id = target_id))
  )
);
create policy "staff review reports" on public.moderation_reports
for update to authenticated
using ((select private.current_user_role()) in ('staff','founder'))
with check ((select private.current_user_role()) in ('staff','founder'));

create trigger moderation_reports_updated_at before update on public.moderation_reports
for each row execute function public.set_updated_at();
create trigger moderation_reports_audit after insert or update on public.moderation_reports
for each row execute function public.audit_row_change();
