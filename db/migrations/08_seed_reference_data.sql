-- ============================================================
-- 08_seed_reference_data.sql
-- Reference data: modules, rights, and the Seeded Superadmin.
-- ON CONFLICT DO NOTHING makes this safe to re-run.
-- ============================================================


-- ── Modules ──────────────────────────────────────────────────
insert into public.module (module_id, description) values
  ('Prod_Mod',   'Product Management Module'),
  ('Report_Mod', 'Reports Module'),
  ('Adm_Mod',    'Admin / User Management Module')
on conflict (module_id) do nothing;


-- ── Rights (linked to parent module) ─────────────────────────
insert into public.rights (right_id, description, module_id) values
  ('PRD_ADD',  'Add Product',              'Prod_Mod'),
  ('PRD_EDIT', 'Edit Product',             'Prod_Mod'),
  ('PRD_DEL',  'Soft Delete Product',      'Prod_Mod'),
  ('REP_001',  'Product Report Listing',   'Report_Mod'),
  ('REP_002',  'Top Selling Report',       'Report_Mod'),
  ('ADM_USER', 'Activate / Manage Users',  'Adm_Mod')
on conflict (right_id) do nothing;


-- ── Seeded Superadmin ─────────────────────────────────────────
-- Inserted from auth.users by email match.
-- The auth.users row must already exist (created via Supabase Dashboard).
-- Replace the email if the project uses a different seeded SA account.
insert into public.user (userid, username, email, user_type, record_status, is_seeded, stamp)
select
  au.id::text,
  'User Name',
  au.email,
  'SUPERADMIN',
  'ACTIVE',
  true,
  'SEEDED SUPERADMIN'
from auth.users au
where au.email = 'name@neu.edu.ph'
on conflict (userid) do update
  set user_type = 'SUPERADMIN',
      is_seeded = true,
      record_status = 'ACTIVE';

-- Seed Superadmin module access (all 3 modules, all rights = 1)
insert into public.user_module (userid, module_id, rights_value, record_status, stamp)
select u.userid, m.module_id, 1, 'ACTIVE', 'SEEDED'
from public.user u
cross join public.module m
where u.is_seeded = true
on conflict (userid, module_id) do update set rights_value = 1;

-- Seed Superadmin rights (all 6 rights = 1)
insert into public.usermodule_rights (userid, right_id, right_value, record_status, stamp)
select u.userid, r.right_id, 1, 'ACTIVE', 'SEEDED'
from public.user u
cross join public.rights r
where u.is_seeded = true
on conflict (userid, right_id) do update set right_value = 1;