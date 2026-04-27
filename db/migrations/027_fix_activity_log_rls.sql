-- ============================================================
-- 027_fix_activity_log_rls.sql
-- Replaces the SELECT policy from 026_activity_log.sql.
--
-- New visibility scope:
--   SUPERADMIN → all entries
--   ADMIN      → own entries + all product/price entries from anyone
--   USER       → product/price entries only (from anyone)
--
-- Prerequisite: get_my_user_type() SECURITY DEFINER function
-- must exist (created in S3-T19). Test: SELECT get_my_user_type();
-- ============================================================

DROP POLICY IF EXISTS activity_log_select ON public.activity_log;

CREATE POLICY activity_log_select
  ON public.activity_log
  FOR SELECT
  TO authenticated
  USING (
    -- SUPERADMIN: sees everything
    get_my_user_type() = 'SUPERADMIN'

    OR

    -- ADMIN: own entries + all product/price entries from any user
    (
      get_my_user_type() = 'ADMIN'
      AND (
        actor_id = auth.uid()::TEXT
        OR action IN (
          'PRODUCT_ADDED',
          'PRODUCT_EDITED',
          'PRODUCT_DELETED',
          'PRODUCT_RECOVERED',
          'PRICE_ADDED'
        )
      )
    )

    OR

    -- USER: product/price entries only (regardless of who performed them)
    (
      get_my_user_type() = 'USER'
      AND action IN (
        'PRODUCT_ADDED',
        'PRODUCT_EDITED',
        'PRODUCT_DELETED',
        'PRODUCT_RECOVERED',
        'PRICE_ADDED'
      )
    )
  );

-- Verify both policies are present
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'activity_log'
ORDER BY policyname;
-- Expected: activity_log_insert, activity_log_select (2 rows)