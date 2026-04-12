-- ============================================================
-- 014_rls_authenticated_insert.sql
-- INSERT policies for the 'authenticated' role.
-- Allows AuthContext.provisionUser() to create rows
-- for new users using their own signed-in session.
-- userid must equal auth.uid() — no user can insert for another.
-- ============================================================

-- ── public.user ─────────────────────────────────────────────
DROP POLICY IF EXISTS authenticated_insert_own_user ON public.user;

CREATE POLICY authenticated_insert_own_user
  ON public.user
  FOR INSERT TO authenticated
  WITH CHECK (userid = auth.uid()::TEXT);

-- ── public.user_module ──────────────────────────────────────
DROP POLICY IF EXISTS authenticated_insert_own_user_module ON public.user_module;

CREATE POLICY authenticated_insert_own_user_module
  ON public.user_module
  FOR INSERT TO authenticated
  WITH CHECK (userid = auth.uid()::TEXT);

-- ── public.UserModule_Rights ────────────────────────────────
-- NOTE: If your table name is lowercase, update accordingly
DROP POLICY IF EXISTS authenticated_insert_own_umr ON public."UserModule_Rights";

CREATE POLICY authenticated_insert_own_umr
  ON public."UserModule_Rights"
  FOR INSERT TO authenticated
  WITH CHECK (userid = auth.uid()::TEXT);