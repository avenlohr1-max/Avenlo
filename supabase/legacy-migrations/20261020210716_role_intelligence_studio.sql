create table public.employer_role_briefs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null check (length(btrim(title)) between 1 and 160),
  summary text not null default '' check (length(summary) <= 4000),
  outcomes jsonb not null default '[]',
  essential jsonb not null default '[]',
  preferred jsonb not null default '[]',
  location text not null default '' check (length(location) <= 200),
  work_mode text not null default '' check (length(work_mode) <= 100),
  status text not null default 'draft' check (status in ('draft','submitted','changes_requested','approved')),
  revision integer not null default 1,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text check (length(review_note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index employer_role_briefs_company_idx on public.employer_role_briefs(company_id, updated_at desc);
create index employer_role_briefs_review_idx on public.employer_role_briefs(status, updated_at);
create index employer_role_briefs_creator_idx on public.employer_role_briefs(created_by);
create index employer_role_briefs_reviewer_idx on public.employer_role_briefs(reviewed_by);

create table public.employer_role_brief_history (
  brief_id uuid not null references public.employer_role_briefs(id) on delete cascade,
  revision integer not null,
  actor_id uuid references public.profiles(id) on delete set null,
  before_data jsonb,
  after_data jsonb not null,
  changed_at timestamptz not null default now(),
  primary key (brief_id, revision)
);
create index employer_role_brief_history_actor_idx on public.employer_role_brief_history(actor_id);
alter table public.employer_role_briefs enable row level security;
alter table public.employer_role_brief_history enable row level security;
revoke all on public.employer_role_briefs, public.employer_role_brief_history from anon, authenticated;
grant select, insert, update on public.employer_role_briefs to authenticated;
grant select on public.employer_role_brief_history to authenticated;
grant all on public.employer_role_briefs, public.employer_role_brief_history to service_role;

create policy "owner or operations reads role briefs" on public.employer_role_briefs for select to authenticated using (
  exists (select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid()))
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('staff','founder'))
);
create policy "employer creates own role brief" on public.employer_role_briefs for insert to authenticated with check (
  created_by = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'company')
  and exists (select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid()))
);
create policy "owner or operations updates role briefs" on public.employer_role_briefs for update to authenticated
using (
  exists (select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid()))
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('staff','founder'))
)
with check (
  exists (select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid()))
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('staff','founder'))
);
create policy "authorized reader sees role history" on public.employer_role_brief_history for select to authenticated
using (exists (select 1 from public.employer_role_briefs b where b.id = brief_id));

create schema if not exists private;
create or replace function private.guard_role_brief()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  caller_role text;
  item jsonb;
  group_name text;
  requires_review boolean;
  seen text[] := '{}';
  label text;
begin
  select role::text into caller_role from public.profiles where id = (select auth.uid());
  if caller_role is null then raise exception 'authenticated role required'; end if;
  if tg_op = 'INSERT' then
    if caller_role <> 'company' or new.status not in ('draft','submitted') then raise exception 'employer draft or submission required'; end if;
    new.created_by := auth.uid(); new.revision := 1; new.created_at := now();
    new.reviewed_by := null; new.reviewed_at := null; new.review_note := null;
  else
    if new.id is distinct from old.id or new.company_id is distinct from old.company_id or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at then raise exception 'role brief identity is immutable'; end if;
    new.revision := old.revision + 1;
    if caller_role = 'company' then
      if new.status = 'approved' and old.status = 'approved' then new.status := 'draft'; end if;
      if new.status not in ('draft','submitted') then raise exception 'employer cannot approve role brief'; end if;
      new.reviewed_by := null; new.reviewed_at := null; new.review_note := null;
    elsif caller_role in ('staff','founder') then
      if (to_jsonb(new) - array['status','revision','reviewed_by','reviewed_at','review_note','updated_at']) is distinct from (to_jsonb(old) - array['status','revision','reviewed_by','reviewed_at','review_note','updated_at']) then raise exception 'reviewers cannot rewrite employer criteria'; end if;
      if not ((old.status = 'submitted' and new.status in ('approved','changes_requested')) or (old.status = 'approved' and new.status = 'changes_requested')) then raise exception 'invalid review transition'; end if;
      if new.review_note is null or length(btrim(new.review_note)) = 0 then raise exception 'review note required'; end if;
      new.reviewed_by := auth.uid(); new.reviewed_at := now();
    else raise exception 'role cannot edit briefs';
    end if;
  end if;
  requires_review := new.status in ('submitted','approved');
  if jsonb_typeof(new.outcomes) is distinct from 'array' or jsonb_typeof(new.essential) is distinct from 'array' or jsonb_typeof(new.preferred) is distinct from 'array' then raise exception 'role criteria must be arrays'; end if;
  if jsonb_array_length(new.outcomes) > 12 or jsonb_array_length(new.essential) > 12 or jsonb_array_length(new.preferred) > 12 then raise exception 'too many role criteria'; end if;
  for item in select value from jsonb_array_elements(new.outcomes) loop
    if jsonb_typeof(item) <> 'string' or length(btrim(item #>> '{}')) not between 1 and 500 then raise exception 'invalid role outcome'; end if;
  end loop;
  foreach group_name in array array['essential','preferred'] loop
    for item in select value from jsonb_array_elements(case when group_name = 'essential' then new.essential else new.preferred end) loop
      if jsonb_typeof(item) <> 'object' or jsonb_typeof(item->'requirement') is distinct from 'string' or jsonb_typeof(item->'evidence') is distinct from 'string' or jsonb_typeof(item->'rationale') is distinct from 'string' or (item - array['requirement','evidence','rationale']) <> '{}'::jsonb then raise exception 'invalid criterion structure'; end if;
      if length(item->>'requirement') > 500 or length(item->>'evidence') > 1000 or length(item->>'rationale') > 1000 then raise exception 'criterion too long'; end if;
      label := regexp_replace(lower(btrim(item->>'requirement')), '[[:space:]]+', ' ', 'g');
      if label <> '' and label = any(seen) then raise exception 'duplicate requirement across role criteria'; end if;
      if label <> '' then seen := array_append(seen, label); end if;
      if requires_review and (label = '' or length(btrim(item->>'evidence')) = 0 or (group_name = 'essential' and length(btrim(item->>'rationale')) = 0)) then raise exception 'requirement, evidence and essential rationale required'; end if;
    end loop;
  end loop;
  if requires_review and (length(btrim(new.summary)) = 0 or jsonb_array_length(new.outcomes) = 0 or jsonb_array_length(new.essential) = 0) then raise exception 'complete role definition required for review'; end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.guard_role_brief() from public, anon, authenticated;
create trigger role_briefs_guard before insert or update on public.employer_role_briefs for each row execute function private.guard_role_brief();

create or replace function private.record_role_brief_revision()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'role history requires an authenticated actor'; end if;
  insert into public.employer_role_brief_history(brief_id, revision, actor_id, before_data, after_data)
  values (new.id, new.revision, auth.uid(), case when tg_op = 'UPDATE' then to_jsonb(old) else null end, to_jsonb(new));
  return new;
end;
$$;
revoke all on function private.record_role_brief_revision() from public, anon, authenticated;
create trigger role_briefs_history after insert or update on public.employer_role_briefs for each row execute function private.record_role_brief_revision();
