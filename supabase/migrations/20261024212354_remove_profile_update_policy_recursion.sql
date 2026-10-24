-- The previous WITH CHECK queried profiles recursively during a normal save.
-- The existing BEFORE UPDATE trigger preserves self-edited role and status.
-- Use the existing trusted role helper instead of selecting the same RLS table.
alter policy "users update own safe profile"
on public.profiles
with check (
  id = (select auth.uid())
  and role = (select private.current_user_role())
);
