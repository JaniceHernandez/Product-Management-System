-- ============================================================
-- 017_rls_product_write.sql
-- RLS INSERT and UPDATE policies for public.product.
-- RLS SELECT and INSERT policies for public.pricehist.
-- ============================================================

-- ── Drop existing write policies (safe for re-runs) ──────────
DROP POLICY IF EXISTS product_insert_prd_add         ON public.product;
DROP POLICY IF EXISTS product_update_prd_edit        ON public.product;
DROP POLICY IF EXISTS product_softdelete_prd_del     ON public.product;
DROP POLICY IF EXISTS product_recover                ON public.product;

DROP POLICY IF EXISTS pricehist_select_authenticated ON public.pricehist;
DROP POLICY IF EXISTS pricehist_insert_authenticated ON public.pricehist;

-- ============================================================
-- PRODUCT: INSERT — gated by PRD_ADD right = 1
-- ============================================================
CREATE POLICY product_insert_prd_add
  ON public.product
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.usermodule_rights umr
      WHERE umr.userid        = auth.uid()::TEXT
        AND umr.right_id      = 'PRD_ADD'
        AND umr.right_value   = 1
        AND umr.record_status = 'ACTIVE'
    )
  );

-- ============================================================
-- PRODUCT: UPDATE (edit fields) — gated by PRD_EDIT right = 1
-- ============================================================
CREATE POLICY product_update_prd_edit
  ON public.product
  FOR UPDATE
  TO authenticated
  USING (
    record_status = 'ACTIVE'
    AND EXISTS (
      SELECT 1
      FROM public.usermodule_rights umr
      WHERE umr.userid        = auth.uid()::TEXT
        AND umr.right_id      = 'PRD_EDIT'
        AND umr.right_value   = 1
        AND umr.record_status = 'ACTIVE'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.usermodule_rights umr
      WHERE umr.userid        = auth.uid()::TEXT
        AND umr.right_id      = 'PRD_EDIT'
        AND umr.right_value   = 1
        AND umr.record_status = 'ACTIVE'
    )
  );

-- ============================================================
-- PRODUCT: UPDATE → INACTIVE (soft-delete)
-- Gated by PRD_DEL right = 1 (SUPERADMIN only)
-- ============================================================
CREATE POLICY product_softdelete_prd_del
  ON public.product
  FOR UPDATE
  TO authenticated
  USING (
    record_status = 'ACTIVE'
    AND EXISTS (
      SELECT 1
      FROM public.usermodule_rights umr
      WHERE umr.userid        = auth.uid()::TEXT
        AND umr.right_id      = 'PRD_DEL'
        AND umr.right_value   = 1
        AND umr.record_status = 'ACTIVE'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.usermodule_rights umr
      WHERE umr.userid        = auth.uid()::TEXT
        AND umr.right_id      = 'PRD_DEL'
        AND umr.right_value   = 1
        AND umr.record_status = 'ACTIVE'
    )
  );

-- ============================================================
-- PRODUCT: UPDATE → ACTIVE (recovery)
-- ADMIN and SUPERADMIN only
-- ============================================================
CREATE POLICY product_recover
  ON public.product
  FOR UPDATE
  TO authenticated
  USING (
    record_status = 'INACTIVE'
    AND EXISTS (
      SELECT 1
      FROM public.user u
      WHERE u.userid      = auth.uid()::TEXT
        AND u.user_type   IN ('ADMIN', 'SUPERADMIN')
        AND u.record_status = 'ACTIVE'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user u
      WHERE u.userid      = auth.uid()::TEXT
        AND u.user_type   IN ('ADMIN', 'SUPERADMIN')
        AND u.record_status = 'ACTIVE'
    )
  );

-- ============================================================
-- PRICEHIST: SELECT — all authenticated users
-- ============================================================
CREATE POLICY pricehist_select_authenticated
  ON public.pricehist
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- PRICEHIST: INSERT — all authenticated users
-- ============================================================
CREATE POLICY pricehist_insert_authenticated
  ON public.pricehist
  FOR INSERT
  TO authenticated
  WITH CHECK (true);