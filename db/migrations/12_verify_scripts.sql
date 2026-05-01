-- ── Check 1: All expected tables exist ───────────────────────
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
-- Expected: activity_log, module, pricehist, product,
--           rights, salesdetail, user, user_module, usermodule_rights

-- ── Check 2: All functions are deployed ──────────────────────
select routine_name, security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('get_actor_level', 'get_my_user_type', 'provision_new_user');
-- Expected: 3 rows, all with security_type = 'DEFINER'

-- ── Check 3: Trigger exists ──────────────────────────────────
select trigger_name, event_object_table, action_timing
from information_schema.triggers
where trigger_name = 'on_auth_user_created';
-- Expected: 1 row (AFTER / INSERT on auth.users)

-- ── Check 4: Views are deployed ──────────────────────────────
select table_name
from information_schema.views
where table_schema = 'public';
-- Expected: current_product_price, top_selling_products

-- ── Check 5: RLS is enabled on all tables ────────────────────
select relname, relrowsecurity
from pg_class
where relname in (
  'product', 'pricehist', 'salesdetail', 'user',
  'module', 'rights', 'user_module', 'usermodule_rights', 'activity_log'
);
-- Expected: all rows show relrowsecurity = true

-- ── Check 6: All RLS policies are present ────────────────────
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
-- Expected: at least 20 policies across all tables

-- ── Check 7: Seeded Superadmin is correctly flagged ──────────
select userid, username, user_type, is_seeded, record_status
from public.user
where is_seeded = true;
-- Expected: exactly 1 row — the seeded SA account

-- ── Check 8: Seeded SA has all rights = 1 ────────────────────
select right_id, right_value
from public.usermodule_rights
where userid = (select userid from public.user where is_seeded = true)
order by right_id;
-- Expected: 6 rows, all right_value = 1

-- ── Check 9: Module and rights reference data seeded ─────────
select count(*) as module_count from public.module;   -- Expected: 3
select count(*) as rights_count from public.rights;   -- Expected: 6

-- ── Check 10: get_actor_level() returns 4 for seeded SA ──────
-- (Run while impersonating the seeded SA session in SQL editor)
select get_actor_level();
-- Expected: 4