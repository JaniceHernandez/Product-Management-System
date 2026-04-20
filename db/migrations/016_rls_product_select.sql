-- ============================================================
-- 016_rls_product_select.sql
-- RLS SELECT policy on public.product.
-- Enforces that USER accounts only ever see ACTIVE rows,
-- even via direct API calls. ADMIN and SUPERADMIN see all.
-- Project guide Section 8.3 (Layer 1 — DB enforcement).
-- ============================================================

-- Drop if re-deploying (safe for re-runs)
DROP POLICY IF EXISTS user_sees_active_only ON public.product;

CREATE POLICY user_sees_active_only
  ON public.product
  FOR SELECT
  TO authenticated
  USING (
    -- Row is visible if product is ACTIVE
    record_status = 'ACTIVE'
    OR
    -- OR if the current user is ADMIN or SUPERADMIN
    EXISTS (
      SELECT 1
      FROM public.user u
      WHERE u.userid = auth.uid()::TEXT
        AND u.user_type IN ('ADMIN', 'SUPERADMIN')
    )
  );