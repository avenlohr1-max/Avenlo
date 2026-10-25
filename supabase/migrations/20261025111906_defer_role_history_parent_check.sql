-- SET NULL attribution updates and parent cascades can be queued together.
-- Keep cascading deletion immediate, but validate surviving history rows at
-- transaction end rather than an intermediate referential-action ordering.
alter table public.employer_role_brief_history
  alter constraint employer_role_brief_history_brief_id_fkey
  deferrable initially deferred;
