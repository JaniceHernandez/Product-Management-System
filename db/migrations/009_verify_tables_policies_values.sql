-- Step 1: Delete dependent records
DELETE FROM usermodule_rights
WHERE userid IN ('UUID', 'UUID', 'UUID', 'UUID');

DELETE FROM user_module
WHERE userid IN ('UUID', 'UUID', 'UUID', 'UUID');

-- Step 2: Delete the user
DELETE FROM public.user
WHERE userid IN ('UUID', 'UUID', 'UUID', 'UUID');

-- Check all users-----------------
SELECT *
FROM public.user
ORDER BY username;

-- Update user values---------------
UPDATE public.user
SET record_status = 'ACTIVE'
WHERE username = 'Janice2';

-- Check all tables--------------
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check policies ------------
SELECT policyname, cmd, roles FROM pg_policies
WHERE schemaname = 'public' --AND tablename = 'user'
ORDER BY policyname;

SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'user' AND schemaname = 'public'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- Quick login guard simulation — replace UUID with a real SUPERADMIN userId
SELECT userId, username, user_type, record_status
FROM public.user
WHERE user_type = 'SUPERADMIN';
--Expected: 1 row, SUPERADMIN, ACTIVE

-- Check 1: All three show SUPERADMIN / ACTIVE
SELECT userId, username, user_type, record_status
FROM public.user
WHERE user_type = 'SUPERADMIN'
ORDER BY username;

-- Check 2: All module rows = rights_value 1
SELECT u.username, um.Module_ID, um.rights_value
FROM public.user_module um
JOIN public.user u ON u.userId = um.userid
WHERE u.user_type = 'SUPERADMIN'
ORDER BY u.username, um.Module_ID;

-- Check 3: All rights rows = Right_value 1
SELECT u.username, umr.Right_ID, umr.Right_value
FROM public.UserModule_Rights umr
JOIN public.user u ON u.userId = umr.userid
WHERE u.user_type = 'SUPERADMIN'
ORDER BY u.username, umr.Right_ID;


-- Check 4: user_module rows (expect 3)
SELECT userid, Module_ID, rights_value, record_status
FROM public.user_module
WHERE userid = '<test-user-uuid>'
ORDER BY Module_ID;

-- Verify record_status and stamp columns on product
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'product'
ORDER BY ordinal_position;

-- Verify rights reference data
SELECT r.Right_ID, r.Description, r.Module_ID
FROM public.rights r
ORDER BY r.Module_ID, r.Right_ID;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'user'
ORDER BY ordinal_position;

SELECT userid, username, user_type, record_status
FROM public.user
ORDER BY stamp DESC
LIMIT 10;