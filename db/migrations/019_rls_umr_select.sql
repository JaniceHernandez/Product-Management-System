-- Run in Supabase Dashboard → SQL Editor
-- Allows authenticated users to read their own rights rows
DROP POLICY IF EXISTS umr_select_own ON public.usermodule_rights;
 
CREATE POLICY umr_select_own
  ON public.usermodule_rights
  FOR SELECT TO authenticated
  USING (userid = auth.uid()::TEXT);