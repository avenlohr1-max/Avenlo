-- Candidate invitations are scoped to one company. Closing or expiry removes
-- recipient access to the room, messages, proof snapshots and dossier together.
create table public.decision_rooms (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 160),
  purpose text not null check (length(btrim(purpose)) between 1 and 2000),
  active boolean not null default true,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  unique(id, candidate_id),
  check (expires_at > created_at and expires_at <= created_at + interval '90 days')
);
create index decision_rooms_candidate_idx on public.decision_rooms(candidate_id, created_at desc);
create index decision_rooms_company_idx on public.decision_rooms(company_id, expires_at);
alter table public.decision_rooms enable row level security;
revoke all on public.decision_rooms from public, anon, authenticated;
grant select, insert, delete on public.decision_rooms to authenticated;
grant update(active) on public.decision_rooms to authenticated;
create policy "candidate controls invitations" on public.decision_rooms for all to authenticated
using (candidate_id = (select auth.uid())) with check (
  candidate_id = (select auth.uid()) and (select private.current_user_role()) = 'candidate'
);
create policy "invited employer reads active room" on public.decision_rooms for select to authenticated using (
  active and expires_at > now() and exists (
    select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid())
  )
);

create table public.room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.decision_rooms(id) on delete cascade,
  author_id uuid not null default auth.uid(),
  kind text not null check (kind in ('question','answer','next_step','correction')),
  body text not null check (length(btrim(body)) between 1 and 3000),
  created_at timestamptz not null default now()
);
create index room_messages_room_idx on public.room_messages(room_id, created_at);
alter table public.room_messages enable row level security;
revoke all on public.room_messages from public, anon, authenticated;
grant select, insert on public.room_messages to authenticated;
create policy "participants read conversation" on public.room_messages for select to authenticated
using (exists (select 1 from public.decision_rooms r where r.id = room_id));
create policy "participants append conversation" on public.room_messages for insert to authenticated with check (
  author_id = (select auth.uid()) and exists (
    select 1 from public.decision_rooms r where r.id = room_id and r.active and r.expires_at > now()
  )
);

-- A proof item is an explicitly edited snapshot. Sharing never grants ledger access.
create table public.proof_packages (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid,
  signal_id uuid not null,
  title text not null check (length(btrim(title)) between 1 and 160),
  statement text not null check (length(btrim(statement)) between 1 and 2000),
  source_label text not null check (length(btrim(source_label)) between 1 and 200),
  source_date date,
  context text not null check (length(btrim(context)) between 1 and 3000),
  uncertainty_note text not null check (length(btrim(uncertainty_note)) between 1 and 1500),
  redaction_note text not null check (length(btrim(redaction_note)) between 1 and 1000),
  shared boolean not null default false,
  source_updated_at timestamptz not null default now(),
  source_fingerprint text not null default '',
  captured_at timestamptz not null default now(),
  unique(id, room_id),
  foreign key(room_id, candidate_id) references public.decision_rooms(id, candidate_id) on delete cascade,
  foreign key(candidate_id, signal_id) references public.candidate_signals(candidate_id, id) on delete cascade,
  check (not shared or room_id is not null)
);
create index proof_packages_candidate_idx on public.proof_packages(candidate_id, captured_at desc);
create index proof_packages_room_idx on public.proof_packages(room_id);
create index proof_packages_signal_idx on public.proof_packages(candidate_id, signal_id);
alter table public.proof_packages enable row level security;
revoke all on public.proof_packages from public, anon, authenticated;
grant select, insert, delete on public.proof_packages to authenticated;
grant update(shared) on public.proof_packages to authenticated;
create policy "candidate owns proof snapshots" on public.proof_packages for all to authenticated
using (candidate_id = (select auth.uid())) with check (
 candidate_id = (select auth.uid()) and (select private.current_user_role()) = 'candidate'
 and exists (select 1 from public.candidate_signals s where s.id = signal_id and s.candidate_id = (select auth.uid()) and s.verification_status = 'candidate_confirmed')
 and (not shared or exists (select 1 from public.decision_rooms r where r.id = room_id and r.active and r.expires_at > now()))
);
create policy "recipient sees exact shared snapshot" on public.proof_packages for select to authenticated using (
  shared and exists (select 1 from public.decision_rooms r where r.id = room_id and r.active and r.expires_at > now())
);

create function private.guard_proof_snapshot() returns trigger language plpgsql security invoker set search_path = '' as $$
declare source_time timestamptz; source_hash text;
begin
  if tg_op = 'INSERT' or new.shared then
    select s.updated_at, encode(sha256(convert_to(to_jsonb(s)::text, 'UTF8')), 'hex') into source_time, source_hash from public.candidate_signals s where s.id = new.signal_id and s.candidate_id = auth.uid() and s.verification_status = 'candidate_confirmed';
    if source_time is null then raise exception 'confirmed own signal required'; end if;
    if tg_op = 'INSERT' then
      new.source_updated_at := source_time; new.source_fingerprint := source_hash; new.captured_at := now(); new.shared := false;
    elsif source_hash is distinct from old.source_fingerprint then raise exception 'source changed; prepare a new snapshot'; end if;
  end if;
  return new;
end $$;
revoke all on function private.guard_proof_snapshot() from public, anon, authenticated;
create trigger guard_proof_snapshot before insert or update on public.proof_packages for each row execute function private.guard_proof_snapshot();

-- Corrections or withdrawals in the ledger withdraw every linked snapshot.
-- Candidate must preview and create a new snapshot before sharing revised content.
create function private.withdraw_changed_proof() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new is distinct from old then
    update public.proof_packages set shared = false where signal_id = old.id and candidate_id = old.candidate_id;
  end if;
  return new;
end $$;
revoke all on function private.withdraw_changed_proof() from public, anon, authenticated;
create trigger withdraw_changed_proof after update on public.candidate_signals for each row execute function private.withdraw_changed_proof();

create table public.dossier_entries (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.decision_rooms(id) on delete cascade,
  author_id uuid not null default auth.uid(),
  kind text not null check (kind in ('evidence_reference','human_judgment','correction','open_question','next_step')),
  body text not null check (length(btrim(body)) between 1 and 3000),
  proof_id uuid,
  created_at timestamptz not null default now(),
  foreign key(proof_id, room_id) references public.proof_packages(id, room_id) on delete cascade,
  check ((kind = 'evidence_reference') = (proof_id is not null))
);
create index dossier_entries_room_idx on public.dossier_entries(room_id, created_at);
create index dossier_entries_proof_idx on public.dossier_entries(proof_id, room_id);
alter table public.dossier_entries enable row level security;
revoke all on public.dossier_entries from public, anon, authenticated;
grant select, insert on public.dossier_entries to authenticated;
create policy "participants read source aware dossier" on public.dossier_entries for select to authenticated using (
  exists (select 1 from public.decision_rooms r where r.id = room_id)
  and (proof_id is null or exists (select 1 from public.proof_packages p where p.id = proof_id and p.shared))
);
create policy "participants append human dossier" on public.dossier_entries for insert to authenticated with check (
  author_id = (select auth.uid()) and exists (select 1 from public.decision_rooms r where r.id = room_id and r.active and r.expires_at > now())
  and (proof_id is null or exists (select 1 from public.proof_packages p where p.id = proof_id and p.room_id = room_id and p.shared))
);

create table public.dossier_exports (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.decision_rooms(id) on delete cascade,
  actor_id uuid not null default auth.uid(),
  exported_at timestamptz not null default now()
);
create index dossier_exports_room_idx on public.dossier_exports(room_id, exported_at);
alter table public.dossier_exports enable row level security;
revoke all on public.dossier_exports from public, anon, authenticated;
grant select, insert on public.dossier_exports to authenticated;
create policy "participants see export history" on public.dossier_exports for select to authenticated using (
  exists (select 1 from public.decision_rooms r where r.id = room_id)
);
create policy "active participants log export" on public.dossier_exports for insert to authenticated with check (
 actor_id = (select auth.uid()) and exists (select 1 from public.decision_rooms r where r.id = room_id and r.active and r.expires_at > now())
);

-- Explicit consent to the Avenlo service team; assigned cases restrict access
-- to that staff member. No employer access, purchase or payment is created.
create table public.intelligence_cases (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  service text not null check (service in ('career_review','evidence_review','decision_support')),
  scope text not null check (length(btrim(scope)) between 1 and 3000),
  consent boolean not null default false,
  assigned_staff uuid,
  staff_declaration text check (length(staff_declaration) <= 1000),
  resolution_note text check (length(resolution_note) <= 3000),
  status text not null default 'requested' check (status in ('requested','in_progress','escalated','completed','closed')),
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  check (expires_at > created_at and expires_at <= created_at + interval '90 days')
);
create index intelligence_cases_candidate_idx on public.intelligence_cases(candidate_id, created_at desc);
create index intelligence_cases_assignment_idx on public.intelligence_cases(assigned_staff, status);
alter table public.intelligence_cases enable row level security;
revoke all on public.intelligence_cases from public, anon, authenticated;
grant select, insert, delete on public.intelligence_cases to authenticated;
grant update(consent, status, assigned_staff, staff_declaration, resolution_note) on public.intelligence_cases to authenticated;
create policy "candidate controls service consent" on public.intelligence_cases for all to authenticated
using (candidate_id = (select auth.uid())) with check (candidate_id = (select auth.uid()) and (select private.current_user_role()) = 'candidate');
create policy "consented service queue" on public.intelligence_cases for select to authenticated using (
  consent and expires_at > now() and (assigned_staff is null or assigned_staff = (select auth.uid()) or (status = 'escalated' and (select private.current_user_role()) = 'founder'))
  and (select private.current_user_role()) in ('staff','founder')
);
create policy "assigned staff manages consented case" on public.intelligence_cases for update to authenticated using (
  consent and expires_at > now() and (assigned_staff is null or assigned_staff = (select auth.uid()) or (status = 'escalated' and (select private.current_user_role()) = 'founder'))
  and (select private.current_user_role()) in ('staff','founder')
) with check (consent and assigned_staff = (select auth.uid()) and (select private.current_user_role()) in ('staff','founder'));
create function private.guard_service_case() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now(); new.expires_at := now() + interval '30 days';
    if new.assigned_staff is not null or new.status <> 'requested' or new.staff_declaration is not null or new.resolution_note is not null then raise exception 'new cases require triage'; end if;
  elsif (select private.current_user_role()) = 'candidate' then
    if new.assigned_staff is distinct from old.assigned_staff or new.status not in (old.status, 'closed', 'escalated') or new.staff_declaration is distinct from old.staff_declaration or new.resolution_note is distinct from old.resolution_note then raise exception 'candidate may escalate, withdraw or close a case'; end if;
    if old.status in ('completed','closed') and new.status = 'escalated' then raise exception 'request a new case for further review'; end if;
    if not old.consent and new.consent then raise exception 'request a new case to renew consent'; end if;
  else
    if new.consent is distinct from old.consent or new.assigned_staff <> auth.uid() then raise exception 'staff cannot manufacture consent'; end if;
    if old.status in ('completed','closed') then raise exception 'closed cases cannot be reopened'; end if;
    if coalesce(length(btrim(new.staff_declaration)),0) = 0 or coalesce(length(btrim(new.resolution_note)),0) = 0 then raise exception 'scope declaration and outcome note required'; end if;
  end if;
  return new;
end $$;
revoke all on function private.guard_service_case() from public, anon, authenticated;
create trigger guard_service_case before insert or update on public.intelligence_cases for each row execute function private.guard_service_case();
create table public.intelligence_case_notes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.intelligence_cases(id) on delete cascade,
  author_id uuid not null default auth.uid(),
  kind text not null check (kind in ('scope','progress','correction','escalation','completion')),
  body text not null check (length(btrim(body)) between 1 and 3000),
  created_at timestamptz not null default now()
);
create index intelligence_case_notes_case_idx on public.intelligence_case_notes(case_id, created_at);
alter table public.intelligence_case_notes enable row level security;
revoke all on public.intelligence_case_notes from public, anon, authenticated;
grant select, insert on public.intelligence_case_notes to authenticated;
create policy "case participants read transparent notes" on public.intelligence_case_notes for select to authenticated using (
 exists (select 1 from public.intelligence_cases c where c.id = case_id)
);
create policy "case participants append notes" on public.intelligence_case_notes for insert to authenticated with check (
 author_id = (select auth.uid()) and exists (select 1 from public.intelligence_cases c where c.id = case_id and c.consent and c.expires_at > now() and c.status not in ('completed','closed'))
);

-- Server stamped authorship/timestamps, including direct PostgREST requests.
create function private.stamp_collaboration_entry() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.author_id := auth.uid(); new.created_at := now(); return new;
end $$;
revoke all on function private.stamp_collaboration_entry() from public, anon, authenticated;
create trigger stamp_room_message before insert on public.room_messages for each row execute function private.stamp_collaboration_entry();
create trigger stamp_dossier_entry before insert on public.dossier_entries for each row execute function private.stamp_collaboration_entry();
create trigger stamp_case_note before insert on public.intelligence_case_notes for each row execute function private.stamp_collaboration_entry();

create table public.collaboration_events (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid,
  resource_id uuid not null,
  resource_type text not null,
  operation text not null,
  state jsonb not null default '{}',
  occurred_at timestamptz not null default now()
);
create index collaboration_events_candidate_idx on public.collaboration_events(candidate_id, occurred_at desc);
alter table public.collaboration_events enable row level security;
revoke all on public.collaboration_events from public, anon, authenticated;
grant select on public.collaboration_events to authenticated;
create policy "candidate reads consent and case audit" on public.collaboration_events for select to authenticated using (candidate_id = (select auth.uid()));
create function private.audit_collaboration() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.collaboration_events(candidate_id, actor_id, resource_id, resource_type, operation, state)
  values (new.candidate_id, auth.uid(), new.id, tg_table_name, tg_op,
    jsonb_strip_nulls(jsonb_build_object('active',to_jsonb(new)->'active','shared',to_jsonb(new)->'shared','consent',to_jsonb(new)->'consent','status',to_jsonb(new)->'status','expires_at',to_jsonb(new)->'expires_at')));
  return new;
end $$;
revoke all on function private.audit_collaboration() from public, anon, authenticated;
create trigger audit_room_consent after insert or update on public.decision_rooms for each row execute function private.audit_collaboration();
create trigger audit_proof_sharing after insert or update on public.proof_packages for each row execute function private.audit_collaboration();
create trigger audit_service_consent after insert or update on public.intelligence_cases for each row execute function private.audit_collaboration();

create function private.record_service_progress() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.resolution_note is distinct from old.resolution_note or new.status is distinct from old.status then
    insert into public.intelligence_case_notes(case_id, author_id, kind, body)
    values (new.id, auth.uid(), case when new.status = 'escalated' then 'escalation' when new.status in ('completed','closed') then 'completion' else 'progress' end,
      new.status || ': ' || case when new.status = 'escalated' and auth.uid() = new.candidate_id then 'Candidate requested founder review; see the shared escalation note.' else coalesce(new.resolution_note, 'Candidate closed the case.') end);
  end if;
  return new;
end $$;
revoke all on function private.record_service_progress() from public, anon, authenticated;
create trigger record_service_progress after update on public.intelligence_cases for each row execute function private.record_service_progress();

create function private.escalate_candidate_case() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.kind = 'escalation' then
    update public.intelligence_cases set status = 'escalated'
    where id = new.case_id and candidate_id = auth.uid() and consent and expires_at > now() and status not in ('completed','closed','escalated');
  end if;
  return new;
end $$;
revoke all on function private.escalate_candidate_case() from public, anon, authenticated;
create trigger escalate_candidate_case after insert on public.intelligence_case_notes for each row execute function private.escalate_candidate_case();

create function private.guard_room_invitation() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then new.created_at := now(); new.expires_at := now() + interval '30 days';
  elsif not old.active and new.active then raise exception 'create a new invitation to renew consent'; end if;
  return new;
end $$;
revoke all on function private.guard_room_invitation() from public, anon, authenticated;
create trigger guard_room_invitation before insert or update on public.decision_rooms for each row execute function private.guard_room_invitation();

-- Preserve company self-registration while retaining the hardened trigger.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,email,full_name,role)
  values (new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',''),
    case when new.raw_user_meta_data->>'account_type' = 'company' then 'company'::public.user_role else 'candidate'::public.user_role end)
  on conflict (id) do nothing;
  return new;
end $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

grant all on public.decision_rooms, public.room_messages, public.proof_packages, public.dossier_entries, public.dossier_exports, public.intelligence_cases, public.intelligence_case_notes, public.collaboration_events to service_role;
-- Candidate-controlled sharing for the Talent Record.
-- Existing candidates default to private; consent is required before companies
-- with an application from that candidate can read profile details or resumes.

alter table public.candidate_profiles
  add column if not exists share_with_applicant_companies boolean not null default false;

drop policy if exists "companies read applicant profiles" on public.profiles;
create policy "companies read applicant profiles"
on public.profiles
for select to authenticated
using (
  private.current_user_role() = 'company'
  and exists (
    select 1
    from public.candidate_profiles cp
    join public.applications a on a.candidate_id = cp.user_id
    join public.jobs j on j.id = a.job_id
    join public.companies c on c.id = j.company_id
    where cp.user_id = profiles.id
      and cp.share_with_applicant_companies
      and c.owner_id = auth.uid()
  )
);

drop policy if exists "companies read applicant candidate profiles" on public.candidate_profiles;
create policy "companies read applicant candidate profiles"
on public.candidate_profiles
for select to authenticated
using (
  private.current_user_role() = 'company'
  and share_with_applicant_companies
  and exists (
    select 1
    from public.applications a
    join public.jobs j on j.id = a.job_id
    join public.companies c on c.id = j.company_id
    where a.candidate_id = candidate_profiles.user_id
      and c.owner_id = auth.uid()
  )
);

drop policy if exists "companies read applicant skills" on public.candidate_skills;
create policy "companies read applicant skills"
on public.candidate_skills
for select to authenticated
using (
  private.current_user_role() = 'company'
  and exists (
    select 1
    from public.candidate_profiles cp
    join public.applications a on a.candidate_id = cp.user_id
    join public.jobs j on j.id = a.job_id
    join public.companies c on c.id = j.company_id
    where cp.user_id = candidate_skills.user_id
      and cp.share_with_applicant_companies
      and c.owner_id = auth.uid()
  )
);

drop policy if exists "companies read applicant resumes" on storage.objects;
create policy "companies read applicant resumes"
on storage.objects
for select to authenticated
using (
  bucket_id = 'candidate-documents'
  and private.current_user_role() = 'company'
  and (storage.foldername(storage.objects.name))[1] ~ '^[0-9a-fA-F-]{36}$'
  and exists (
    select 1
    from public.candidate_profiles cp
    join public.applications a on a.candidate_id = cp.user_id
    join public.jobs j on j.id = a.job_id
    join public.companies c on c.id = j.company_id
    where cp.user_id = ((storage.foldername(storage.objects.name))[1])::uuid
      and cp.share_with_applicant_companies
      and c.owner_id = auth.uid()
  )
);

drop policy if exists "company owners manage jobs" on public.jobs;
create policy "company owners manage jobs" on public.jobs
for all to authenticated
using (
  exists (
    select 1 from public.companies c
    where c.id = jobs.company_id
      and c.owner_id = auth.uid()
      and private.current_user_role() = 'company'
  )
)
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.companies c
    where c.id = jobs.company_id
      and c.owner_id = auth.uid()
      and private.current_user_role() = 'company'
  )
);


