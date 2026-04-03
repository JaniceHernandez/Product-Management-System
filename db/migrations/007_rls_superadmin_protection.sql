-- ============================================================
-- 007_rls_superadmin_protection.sql
-- RLS policies protecting SUPERADMIN rows from ADMIN modification
-- Project guide Section 7: SUPERADMIN Protection
-- ============================================================

CREATE POLICY admin_cannot_touch_superadmin
ON public.user
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user AS u
    WHERE u.userId = auth.uid()::TEXT
    AND u.user_type IN ('ADMIN', 'SUPERADMIN')
  )
  AND user_type != 'SUPERADMIN'
);

CREATE POLICY protect_superadmin_rights
ON public.UserModule_Rights
FOR ALL
TO authenticated
USING (
  userid NOT IN (
    SELECT userId FROM public.user WHERE user_type = 'SUPERADMIN'
  )
);