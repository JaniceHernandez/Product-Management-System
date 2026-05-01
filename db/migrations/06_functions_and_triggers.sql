-- ============================================================
-- 06_functions_and_triggers.sql
-- SECURITY DEFINER helper functions and provisioning trigger.
-- These functions bypass RLS for internal lookups only.
-- ============================================================


-- ── get_my_user_type() ──────────────────────────────────────
-- Returns the user_type of the currently authenticated user.
-- Used by RLS policies to avoid recursive subqueries.
create or replace function get_my_user_type()
returns text
language sql
security definer
stable
as $$
  select user_type
  from public.user
  where userid = auth.uid()::text
  limit 1;
$$;


-- ── get_actor_level() ───────────────────────────────────────
-- Returns an integer authority level for the current user.
-- 4 = Seeded Superadmin (immutable, highest authority)
-- 3 = Authorized Superadmin (promoted by Seeded SA)
-- 2 = Admin
-- 1 = User
-- 0 = Unknown or not found
create or replace function get_actor_level()
returns integer
language sql
security definer
stable
as $$
  select
    case
      when user_type = 'SUPERADMIN' and is_seeded = true  then 4
      when user_type = 'SUPERADMIN' and is_seeded = false then 3
      when user_type = 'ADMIN'                             then 2
      when user_type = 'USER'                              then 1
      else 0
    end
  from public.user
  where userid = auth.uid()::text
  limit 1;
$$;


-- ── provision_new_user() ────────────────────────────────────
-- Fires AFTER INSERT on auth.users.
-- Creates the application user row as USER / INACTIVE.
-- Inserts default module access and rights rows.
-- Falls back to email prefix if no Google display name is present.
drop trigger  if exists on_auth_user_created on auth.users;
drop function if exists provision_new_user();

create or replace function provision_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  v_username text;
  v_stamp    text;
begin
  v_username := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(new.email, '@', 1)
  );
  v_stamp := 'PROVISIONED ' || to_char(now(), 'YYYY-MM-DD HH24:MI');

  if not exists (select 1 from public.user where userid = new.id::text) then

    insert into public.user (userid, username, email, user_type, record_status, is_seeded, stamp)
    values (new.id::text, v_username, new.email, 'USER', 'ACTIVE', false, v_stamp)
    on conflict (userid) do nothing;

    insert into public.user_module (userid, module_id, rights_value, record_status, stamp)
    values
      (new.id::text, 'Prod_Mod',   1, 'ACTIVE', v_stamp),
      (new.id::text, 'Report_Mod', 1, 'ACTIVE', v_stamp),
      (new.id::text, 'Adm_Mod',    0, 'ACTIVE', v_stamp)
    on conflict do nothing;

    insert into public.usermodule_rights (userid, right_id, right_value, record_status, stamp)
    values
      (new.id::text, 'PRD_ADD',  1, 'ACTIVE', v_stamp),
      (new.id::text, 'PRD_EDIT', 1, 'ACTIVE', v_stamp),
      (new.id::text, 'PRD_DEL',  0, 'ACTIVE', v_stamp),
      (new.id::text, 'REP_001',  1, 'ACTIVE', v_stamp),
      (new.id::text, 'REP_002',  0, 'ACTIVE', v_stamp),
      (new.id::text, 'ADM_USER', 0, 'ACTIVE', v_stamp)
    on conflict do nothing;

  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function provision_new_user();