-- ============================================================
-- 07_rls_fix_user_policies.sql
-- Replace overly restrictive policies with ones that allow
-- authenticated users to read public.user. Visibility filtering
-- (ACTIVE/INACTIVE) is handled in the React query layer.
-- ============================================================

-- Drop old policies
DROP POLICY IF EXISTS user_can_read_own_row            ON public.user;
DROP POLICY IF EXISTS admin_cannot_touch_superadmin    ON public.user;
DROP POLICY IF EXISTS trigger_insert_user              ON public.user;
DROP POLICY IF EXISTS auth_insert_own_user             ON public.user;

-- SELECT: all authenticated users can read public.user
-- Role-based visibility (ACTIVE-only for USER) is enforced in React query layer
CREATE POLICY user_select_all_authenticated
  ON public.user
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: service_role (trigger) can insert new rows
CREATE POLICY trigger_insert_user
  ON public.user
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- INSERT: authenticated user can insert their own row (backup for trigger race)
CREATE POLICY auth_insert_own_user
  ON public.user
  FOR INSERT
  TO authenticated
  WITH CHECK (userId = auth.uid()::TEXT);