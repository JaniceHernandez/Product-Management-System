-- ============================================================
-- 022_rls_role_update.sql
-- New RLS policy: SUPERADMIN can update user_type on non-SUPERADMIN rows.
-- This supplements 021_rls_admin_user_mgmt.sql which only allows
-- ADMIN to update record_status.
--
-- Rule:
--   Only SUPERADMIN can change user_type.
--   ADMIN cannot change user_type (existing WITH CHECK in Policy 2 of
--   021_rls_admin_user_mgmt.sql does not cover user_type updates).
--   Target row must not be SUPERADMIN.
-- ============================================================

DROP POLICY IF EXISTS superadmin_update_user_type ON public.user;

CREATE POLICY superadmin_update_user_type
  ON public.user
  FOR UPDATE
  TO authenticated
  USING (
    -- Only SUPERADMIN can execute this policy
    EXISTS (
      SELECT 1 FROM public.user actor
      WHERE actor.userid      = auth.uid()::TEXT
        AND actor.user_type   = 'SUPERADMIN'
    )
    AND
    -- Target row must not be a SUPERADMIN (cannot demote or modify SUPERADMIN)
    user_type != 'SUPERADMIN'
  )
  WITH CHECK (
    -- After update, the new user_type must be ADMIN or USER only
    -- (cannot promote anyone to SUPERADMIN via this policy)
    user_type IN ('ADMIN', 'USER')
    AND EXISTS (
      SELECT 1 FROM public.user actor
      WHERE actor.userid    = auth.uid()::TEXT
        AND actor.user_type = 'SUPERADMIN'
    )
  );