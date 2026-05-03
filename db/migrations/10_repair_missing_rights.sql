-- ============================================================
-- 10_repair_missing_rights.sql
-- Ensures every user in public.user has all 6 rights rows
-- and all 3 module rows. Safe to re-run — ON CONFLICT DO NOTHING.
-- ============================================================

-- Insert missing usermodule_rights rows for all users
insert into public.usermodule_rights (userid, right_id, right_value, record_status, stamp)
select u.userid, r.right_id, 0, 'ACTIVE', 'MIGRATED'
from public.user u
cross join public.rights r
where not exists (
  select 1 from public.usermodule_rights umr
  where umr.userid   = u.userid
    and umr.right_id = r.right_id
)
on conflict (userid, right_id) do nothing;

-- Insert missing user_module rows for all users
insert into public.user_module (userid, module_id, rights_value, record_status, stamp)
select u.userid, m.module_id, 0, 'ACTIVE', 'MIGRATED'
from public.user u
cross join public.module m
where not exists (
  select 1 from public.user_module um
  where um.userid    = u.userid
    and um.module_id = m.module_id
)
on conflict (userid, module_id) do nothing;

-- Ensure all users have PRD_ADD = 1 (universal baseline right)
update public.usermodule_rights
set right_value = 1
where right_id = 'PRD_ADD' and right_value = 0;

-- Re-seed Superadmin rights to all 1s in case they were reset
update public.usermodule_rights
set right_value = 1
where userid in (
  select userid from public.user where user_type = 'SUPERADMIN'
);

update public.user_module
set rights_value = 1
where userid in (
  select userid from public.user where user_type = 'SUPERADMIN'
);