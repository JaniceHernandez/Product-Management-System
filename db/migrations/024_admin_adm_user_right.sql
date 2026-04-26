-- ============================================================
-- PART OF 024_admin_adm_user_right.sql
-- Creates a SECURITY DEFINER helper that reads user_type
-- for the currently signed-in user WITHOUT triggering RLS.
--
-- SECURITY DEFINER = executes as the function owner (postgres role),
-- which bypasses RLS entirely for that single row lookup.
-- This breaks the recursion cycle that would otherwise occur when
-- a SELECT policy on public.user runs a subquery against public.user.
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_user_type()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT user_type
  FROM public.user
  WHERE userid = auth.uid()::TEXT
  LIMIT 1;
$$;


-- Drop ALL existing SELECT policies on public.user
-- (handles whatever name was used in migration 009)
DROP POLICY IF EXISTS user_can_read_own_row          ON public.user;
DROP POLICY IF EXISTS user_select_scoped             ON public.user;
DROP POLICY IF EXISTS allow_all_user_select          ON public.user;
DROP POLICY IF EXISTS authenticated_select_user      ON public.user;
DROP POLICY IF EXISTS rls_user_select                ON public.user;

CREATE POLICY user_select_scoped
  ON public.user
  FOR SELECT
  TO authenticated
  USING (
    -- SUPERADMIN: sees all rows
    get_my_user_type() = 'SUPERADMIN'
    OR
    -- ADMIN: sees only USER-type rows
    (get_my_user_type() = 'ADMIN' AND user_type = 'USER')
    OR
    -- Any authenticated user: always reads their own row
    -- (needed for AuthContext profile fetch)
    userid = auth.uid()::TEXT
  );

  DROP POLICY IF EXISTS admin_update_record_status     ON public.user;
DROP POLICY IF EXISTS superadmin_update_user_type    ON public.user;

-- Combined UPDATE policy: covers both record_status changes and user_type changes
CREATE POLICY admin_update_record_status
  ON public.user
  FOR UPDATE
  TO authenticated
  USING (
    -- SUPERADMIN: can update any non-SUPERADMIN row
    (get_my_user_type() = 'SUPERADMIN' AND user_type != 'SUPERADMIN')
    OR
    -- ADMIN: can only update USER rows (not ADMIN, not SUPERADMIN)
    (get_my_user_type() = 'ADMIN' AND user_type = 'USER')
  )
  WITH CHECK (
    -- After update, actor must still be ADMIN or SUPERADMIN
    get_my_user_type() IN ('ADMIN', 'SUPERADMIN')
  );

INSERT INTO public.UserModule_Rights (userid, right_id, right_value, record_status, stamp)
SELECT u.userid, 'ADM_USER', 1, 'ACTIVE', 'MIGRATED-ADM_USER'
FROM public.user u
WHERE u.user_type = 'ADMIN'
ON CONFLICT (userid, right_id)
DO UPDATE SET right_value = 1, stamp = 'MIGRATED-ADM_USER';

-- Verify
SELECT u.username, u.user_type, umr.right_id, umr.right_value
FROM public.user u
JOIN public.UserModule_Rights umr ON umr.userid = u.userid
WHERE u.user_type = 'ADMIN' AND umr.right_id = 'ADM_USER';
-- Expected: right_value = 1 for every row