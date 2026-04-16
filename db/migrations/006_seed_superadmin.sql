-- ============================================================
-- 006_seed_superadmin.sql
-- Seed three SUPERADMIN accounts for Hope PMS
-- Replace UUID placeholders with real values from Supabase Auth
-- ============================================================

-- STEP A: Insert SUPERADMIN rows into public.user
INSERT INTO public.user (userId, username, lastName, firstName, user_type, record_status, stamp)
VALUES
  (
    'AUTH_UUID_JCESPERANZA',
    'Jerry',
    'Esperanza',
    'Jeremias',
    'SUPERADMIN',
    'ACTIVE',
    'SEEDED jcesperanza ' || NOW()::TEXT
  ),
  (
    'AUTH_UUID_JANICE',
    'Janice',
    'Hernandez',
    'Janice',
    'SUPERADMIN',
    'ACTIVE',
    'SEEDED janice.hernandez ' || NOW()::TEXT
  ),
  (
    'AUTH_UUID_ANGELA',
    'Angela',
    'Militar',
    'Angela',
    'SUPERADMIN',
    'ACTIVE',
    'SEEDED angela.militar ' || NOW()::TEXT
  )
ON CONFLICT (userId) DO UPDATE
  SET user_type     = EXCLUDED.user_type,
      record_status = EXCLUDED.record_status,
      username      = EXCLUDED.username,
      lastName      = EXCLUDED.lastName,
      firstName     = EXCLUDED.firstName,
      stamp         = EXCLUDED.stamp;


-- STEP B: Insert user_module rows (3 modules x 3 users = 9 rows)
INSERT INTO public.user_module (userid, Module_ID, rights_value, record_status, stamp)
VALUES
  ('AUTH_UUID_JCESPERANZA', 'Prod_Mod',   1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_JCESPERANZA', 'Report_Mod', 1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_JCESPERANZA', 'Adm_Mod',   1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_JANICE',      'Prod_Mod',   1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_JANICE',      'Report_Mod', 1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_JANICE',      'Adm_Mod',   1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_ANGELA',      'Prod_Mod',   1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_ANGELA',      'Report_Mod', 1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_ANGELA',      'Adm_Mod',   1, 'ACTIVE', 'SEEDED')
ON CONFLICT (userid, Module_ID) DO UPDATE
  SET rights_value  = EXCLUDED.rights_value,
      record_status = EXCLUDED.record_status,
      stamp         = EXCLUDED.stamp;


-- STEP C: Insert UserModule_Rights rows (6 rights x 3 users = 18 rows)
INSERT INTO public.UserModule_Rights (userid, Right_ID, Right_value, Record_status, Stamp)
VALUES
  ('AUTH_UUID_JCESPERANZA', 'PRD_ADD',  1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_JCESPERANZA', 'PRD_EDIT', 1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_JCESPERANZA', 'PRD_DEL',  1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_JCESPERANZA', 'REP_001',  1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_JCESPERANZA', 'REP_002',  1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_JCESPERANZA', 'ADM_USER', 1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_JANICE',      'PRD_ADD',  1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_JANICE',      'PRD_EDIT', 1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_JANICE',      'PRD_DEL',  1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_JANICE',      'REP_001',  1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_JANICE',      'REP_002',  1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_JANICE',      'ADM_USER', 1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_ANGELA',      'PRD_ADD',  1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_ANGELA',      'PRD_EDIT', 1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_ANGELA',      'PRD_DEL',  1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_ANGELA',      'REP_001',  1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_ANGELA',      'REP_002',  1, 'ACTIVE', 'SEEDED'),
  ('AUTH_UUID_ANGELA',      'ADM_USER', 1, 'ACTIVE', 'SEEDED')
ON CONFLICT (userid, Right_ID) DO UPDATE
  SET Right_value   = EXCLUDED.Right_value,
      Record_status = EXCLUDED.Record_status,
      Stamp         = EXCLUDED.Stamp;