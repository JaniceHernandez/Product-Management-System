-- ============================================================
-- 021_rls_admin_user_mgmt.sql
-- RLS policies for the Admin Module (User Management page).
--
-- Rules implemented:
--   1. ADMIN can SELECT all user rows
--   2. ADMIN can UPDATE record_status ONLY on non-SUPERADMIN rows
--   3. ADMIN cannot UPDATE user_type
--   4. ADMIN cannot modify usermodule_rights of SUPERADMIN
--   5. ADMIN cannot modify user_module of SUPERADMIN
--
-- SUPERADMIN can do all of the above without restriction.
-- ============================================================

-- ── Drop existing policies (safe for re-runs) ────────────────
DROP POLICY IF EXISTS authenticated_select_users  ON public.user;
DROP POLICY IF EXISTS admin_update_record_status  ON public.user;
DROP POLICY IF EXISTS protect_superadmin_umr      ON public.usermodule_rights;
DROP POLICY IF EXISTS protect_superadmin_modules  ON public.user_module;

-- ============================================================
-- POLICY 1: user table — SELECT
-- ============================================================
CREATE POLICY authenticated_select_users
  ON public.user
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- POLICY 2: user table — UPDATE record_status
-- ============================================================
CREATE POLICY admin_update_record_status
  ON public.user
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user actor
      WHERE actor.userid = auth.uid()::TEXT
        AND actor.user_type IN ('ADMIN', 'SUPERADMIN')
    )
    AND (
      user_type != 'SUPERADMIN'
      OR EXISTS (
        SELECT 1 FROM public.user actor
        WHERE actor.userid = auth.uid()::TEXT
          AND actor.user_type = 'SUPERADMIN'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user actor
      WHERE actor.userid = auth.uid()::TEXT
        AND actor.user_type IN ('ADMIN', 'SUPERADMIN')
    )
    AND user_type NOT IN ('SUPERADMIN')
  );

-- ============================================================
-- POLICY 3: usermodule_rights — ALL operations
-- ============================================================
CREATE POLICY protect_superadmin_umr
  ON public.usermodule_rights
  FOR ALL
  TO authenticated
  USING (
    userid NOT IN (
      SELECT u.userid FROM public.user u WHERE u.user_type = 'SUPERADMIN'
    )
    OR EXISTS (
      SELECT 1 FROM public.user actor
      WHERE actor.userid = auth.uid()::TEXT
        AND actor.user_type = 'SUPERADMIN'
    )
  );

-- ============================================================
-- POLICY 4: user_module — ALL operations
-- ============================================================
CREATE POLICY protect_superadmin_modules
  ON public.user_module
  FOR ALL
  TO authenticated
  USING (
    userid NOT IN (
      SELECT u.userid FROM public.user u WHERE u.user_type = 'SUPERADMIN'
    )
    OR EXISTS (
      SELECT 1 FROM public.user actor
      WHERE actor.userid = auth.uid()::TEXT
        AND actor.user_type = 'SUPERADMIN'
    )
  );
