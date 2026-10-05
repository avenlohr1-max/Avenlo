create table if not exists public.company_inquiries (
  id uuid primary key default gen_random_uuid(),
  company_name text not null check (char_length(company_name) between 2 and 160),
  contact_name text not null check (char_length(contact_name) between 2 and 120),
  email text not null check (char_length(email) between 3 and 254),
  role text,
  hiring_need text not null check (char_length(hiring_need) between 20 and 4000),
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.company_inquiries enable row level security;

drop policy if exists "anyone can submit company inquiries" on public.company_inquiries;
create policy "anyone can submit company inquiries" on public.company_inquiries for insert to anon, authenticated with check (true);

drop policy if exists "staff can read company inquiries" on public.company_inquiries;
create policy "staff can read company inquiries" on public.company_inquiries for select to authenticated using (public.current_user_role() in ('staff', 'admin', 'founder'));
